import { Priority, Status } from '@prisma/client';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { taskSelect } from '../lib/taskSelect';

// Bloques que la IA escribe cuando el usuario pide crear, modificar o eliminar tareas.
const commandPattern = /\[COMMAND\]([\s\S]*?)\[\/COMMAND\]/g;

const titleField = z.string().trim().min(1).max(120);
const descriptionField = z.string().trim().max(2000).optional();
const dueDateField = z.coerce.date().optional().catch(undefined);
const categoryField = z.string().min(1).optional();

const createTaskCommand = z.object({
  action: z.literal('CREATE_TASK'),
  title: titleField,
  description: descriptionField,
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(Status).optional(),
  dueDate: dueDateField,
  categoryId: categoryField,
});

const updateTaskCommand = z.object({
  action: z.literal('UPDATE_TASK'),
  id: z.string().min(1),
  title: titleField.optional(),
  description: descriptionField,
  priority: z.nativeEnum(Priority).optional(),
  status: z.nativeEnum(Status).optional(),
  dueDate: dueDateField,
  categoryId: categoryField,
});

const deleteTaskCommand = z.object({
  action: z.literal('DELETE_TASK'),
  id: z.string().min(1),
});

const commandSchema = z.discriminatedUnion('action', [
  createTaskCommand,
  updateTaskCommand,
  deleteTaskCommand,
]);

export type ChatCommand = z.infer<typeof commandSchema>;

export interface ExtractedChat {
  reply: string;
  commands: ChatCommand[];
}

function parseCommand(raw: string): ChatCommand | undefined {
  try {
    const result = commandSchema.safeParse(JSON.parse(raw));

    return result.success ? result.data : undefined;
  } catch {
    return undefined;
  }
}

// Separa el texto que ve el usuario de los comandos. Un comando mal formado se descarta sin afectar al resto.
export function extractChatCommands(text: string): ExtractedChat {
  const commands = [...text.matchAll(commandPattern)]
    .map((match) => parseCommand(match[1]))
    .filter((command): command is ChatCommand => command !== undefined);
  const reply = text
    .replace(commandPattern, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { reply, commands };
}

const createTask = (
  userId: string,
  command: Extract<ChatCommand, { action: 'CREATE_TASK' }>,
  categoryId: string | null,
) =>
  prisma.task.create({
    data: {
      userId,
      title: command.title,
      description: command.description || null,
      priority: command.priority ?? Priority.MEDIUM,
      status: command.status ?? Status.PENDING,
      dueDate: command.dueDate ?? null,
      categoryId,
    },
    select: taskSelect,
  });

export type ChatTaskRow = Awaited<ReturnType<typeof createTask>>;

export interface ChatTaskChanges {
  created: ChatTaskRow[];
  updated: ChatTaskRow[];
  deletedIds: string[];
}

// Una categoría sólo se asigna si pertenece al usuario; si no, la tarea queda sin categoría.
async function ownedCategoryId(categoryId: string | undefined, userId: string) {
  if (categoryId === undefined) return undefined;

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userId },
    select: { id: true },
  });

  return category?.id ?? null;
}

async function createFromCommand(
  userId: string,
  command: Extract<ChatCommand, { action: 'CREATE_TASK' }>,
) {
  const categoryId = await ownedCategoryId(command.categoryId, userId);

  return createTask(userId, command, categoryId ?? null);
}

function updateData(
  command: Extract<ChatCommand, { action: 'UPDATE_TASK' }>,
  categoryId: string | null | undefined,
) {
  return {
    title: command.title,
    description: command.description === undefined ? undefined : command.description || null,
    priority: command.priority,
    status: command.status,
    dueDate: command.dueDate,
    categoryId,
  };
}

async function updateFromCommand(
  userId: string,
  command: Extract<ChatCommand, { action: 'UPDATE_TASK' }>,
) {
  const owned = await prisma.task.findFirst({
    where: { id: command.id, userId },
    select: { id: true },
  });
  if (!owned) return undefined;

  const categoryId = await ownedCategoryId(command.categoryId, userId);

  return prisma.task.update({
    where: { id: command.id },
    data: updateData(command, categoryId),
    select: taskSelect,
  });
}

// Sólo cuenta como borrado cuando la tarea existía y era del usuario.
async function recordDeletion(userId: string, id: string, changes: ChatTaskChanges) {
  const result = await prisma.task.deleteMany({ where: { id, userId } });

  if (result.count > 0) changes.deletedIds.push(id);
}

// Ejecuta los comandos con los permisos del usuario. Sólo toca sus tareas y reporta lo que cambió.
export async function applyChatCommands(
  commands: ChatCommand[],
  userId: string,
): Promise<ChatTaskChanges> {
  const changes: ChatTaskChanges = { created: [], updated: [], deletedIds: [] };

  for (const command of commands) {
    await applyCommand(command, userId, changes);
  }

  return changes;
}

function recordTask(list: ChatTaskRow[], task: ChatTaskRow | undefined) {
  if (task) list.push(task);
}

async function applyCommand(command: ChatCommand, userId: string, changes: ChatTaskChanges) {
  switch (command.action) {
    case 'CREATE_TASK':
      changes.created.push(await createFromCommand(userId, command));
      return;
    case 'UPDATE_TASK':
      recordTask(changes.updated, await updateFromCommand(userId, command));
      return;
    case 'DELETE_TASK':
      await recordDeletion(userId, command.id, changes);
      return;
  }
}
