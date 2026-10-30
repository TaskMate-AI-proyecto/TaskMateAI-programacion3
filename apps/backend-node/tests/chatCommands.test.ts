import { afterEach, describe, expect, it, vi } from 'vitest';

const prismaMock = vi.hoisted(() => ({
  task: {
    create: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
    deleteMany: vi.fn(),
  },
  category: { findFirst: vi.fn() },
}));

vi.mock('../src/lib/prisma', () => ({ default: prismaMock }));

import { applyChatCommands, extractChatCommands } from '../src/services/chatCommands';

const storedTask = {
  id: 'task-1',
  title: 'Entregar',
  description: null,
  status: 'PENDING',
  priority: 'HIGH',
  dueDate: null,
  categoryId: null,
  category: null,
};

describe('extractChatCommands', () => {
  it('separa el texto para el usuario de los bloques de comando', () => {
    const { reply, commands } = extractChatCommands(
      'Listo, la creo.\n[COMMAND]{"action":"CREATE_TASK","title":"Comprar pan"}[/COMMAND]',
    );

    expect(reply).toBe('Listo, la creo.');
    expect(commands).toEqual([{ action: 'CREATE_TASK', title: 'Comprar pan' }]);
  });

  it('descarta comandos con JSON inválido, acción desconocida o campos fuera de rango sin afectar a los demás', () => {
    const text = [
      '[COMMAND]{no-es-json[/COMMAND]',
      '[COMMAND]{"action":"INVENTADA"}[/COMMAND]',
      '[COMMAND]{"action":"CREATE_TASK","title":"Válida"}[/COMMAND]',
      '[COMMAND]{"action":"CREATE_TASK","title":"Prioridad rara","priority":"URGENTE"}[/COMMAND]',
      '[COMMAND]{"action":"DELETE_TASK","id":"task-9"}[/COMMAND]',
    ].join(' ');

    const { commands } = extractChatCommands(text);

    expect(commands).toEqual([
      { action: 'CREATE_TASK', title: 'Válida' },
      { action: 'DELETE_TASK', id: 'task-9' },
    ]);
  });

  it('ignora una fecha inválida sin descartar el comando', () => {
    const { commands } = extractChatCommands(
      '[COMMAND]{"action":"CREATE_TASK","title":"X","dueDate":"ayer"}[/COMMAND]',
    );

    expect(commands[0]).toMatchObject({ action: 'CREATE_TASK', title: 'X', dueDate: undefined });
  });

  it('devuelve un texto vacío cuando la respuesta es sólo comandos', () => {
    const { reply } = extractChatCommands(
      '[COMMAND]{"action":"DELETE_TASK","id":"task-1"}[/COMMAND]',
    );

    expect(reply).toBe('');
  });
});

describe('applyChatCommands', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('crea la tarea del usuario con valores por defecto y reporta el cambio', async () => {
    prismaMock.task.create.mockResolvedValue(storedTask);

    const changes = await applyChatCommands(
      [{ action: 'CREATE_TASK', title: 'Entregar' }],
      'user-1',
    );

    expect(prismaMock.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Entregar',
          priority: 'MEDIUM',
          status: 'PENDING',
          categoryId: null,
        }),
      }),
    );
    expect(changes).toEqual({ created: [storedTask], updated: [], deletedIds: [] });
  });

  it('asigna una categoría sólo si pertenece al usuario', async () => {
    prismaMock.task.create.mockResolvedValue(storedTask);
    prismaMock.category.findFirst.mockResolvedValue(null);

    await applyChatCommands(
      [{ action: 'CREATE_TASK', title: 'Entregar', categoryId: 'ajena' }],
      'user-1',
    );

    expect(prismaMock.category.findFirst).toHaveBeenCalledWith({
      where: { id: 'ajena', userId: 'user-1' },
      select: { id: true },
    });
    expect(prismaMock.task.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ categoryId: null }) }),
    );
  });

  it('actualiza sólo una tarea propia y guarda la descripción vacía como nula', async () => {
    prismaMock.task.findFirst.mockResolvedValue({ id: 'task-1' });
    prismaMock.task.update.mockResolvedValue({
      ...storedTask,
      status: 'COMPLETED',
      description: null,
    });

    const changes = await applyChatCommands(
      [{ action: 'UPDATE_TASK', id: 'task-1', status: 'COMPLETED', description: '' }],
      'user-1',
    );

    expect(prismaMock.task.findFirst).toHaveBeenCalledWith({
      where: { id: 'task-1', userId: 'user-1' },
      select: { id: true },
    });
    expect(prismaMock.task.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'task-1' },
        data: expect.objectContaining({ status: 'COMPLETED', description: null }),
      }),
    );
    expect(changes.updated).toHaveLength(1);
  });

  it('no modifica tareas ajenas o inexistentes', async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    const changes = await applyChatCommands(
      [{ action: 'UPDATE_TASK', id: 'ajena', title: 'Robada' }],
      'user-1',
    );

    expect(prismaMock.task.update).not.toHaveBeenCalled();
    expect(changes.updated).toEqual([]);
  });

  it('elimina sólo tareas propias y reporta el id borrado', async () => {
    prismaMock.task.deleteMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const changes = await applyChatCommands(
      [
        { action: 'DELETE_TASK', id: 'task-1' },
        { action: 'DELETE_TASK', id: 'ajena' },
      ],
      'user-1',
    );

    expect(prismaMock.task.deleteMany).toHaveBeenCalledWith({
      where: { id: 'task-1', userId: 'user-1' },
    });
    expect(changes.deletedIds).toEqual(['task-1']);
  });

  it('no hace nada cuando no hay comandos', async () => {
    const changes = await applyChatCommands([], 'user-1');

    expect(changes).toEqual({ created: [], updated: [], deletedIds: [] });
    expect(prismaMock.task.create).not.toHaveBeenCalled();
  });
});
