import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Priority, Status } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = 'demo@taskmate.ai';

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL },
  });

  await prisma.task.deleteMany({ where: { userId: user.id } });
  await prisma.category.deleteMany({ where: { userId: user.id } });

  const categorySeeds = [
    { name: 'Trabajo', color: '#EF4444' },
    { name: 'Personal', color: '#3B82F6' },
    { name: 'Estudio', color: '#10B981' },
  ];

  const categories = await Promise.all(
    categorySeeds.map((category) =>
      prisma.category.create({
        data: {
          ...category,
          userId: user.id,
        },
      }),
    ),
  );

  const categoryMap = new Map(categories.map((category) => [category.name, category]));

  const taskSeeds = [
    {
      title: 'Revisar backlog del sprint',
      description: 'Preparar la revisión de tareas pendientes para esta semana.',
      status: Status.PENDING,
      priority: Priority.HIGH,
      dueDate: new Date('2026-09-10T09:00:00.000Z'),
      categoryName: 'Trabajo',
    },
    {
      title: 'Planificar la compra semanal',
      description: 'Definir los productos y presupuesto para la próxima compra.',
      status: Status.IN_PROGRESS,
      priority: Priority.MEDIUM,
      dueDate: new Date('2026-09-08T18:30:00.000Z'),
      categoryName: 'Personal',
    },
    {
      title: 'Completar lectura de capítulo',
      description: 'Terminar la lectura del capítulo de matemáticas y resumir ideas clave.',
      status: Status.COMPLETED,
      priority: Priority.HIGH,
      dueDate: new Date('2026-09-02T20:00:00.000Z'),
      categoryName: 'Estudio',
    },
    {
      title: 'Responder correos de clientes',
      description: 'Enviar respuestas pendientes y confirmar próximos pasos.',
      status: Status.PENDING,
      priority: Priority.LOW,
      dueDate: new Date('2026-09-11T12:00:00.000Z'),
      categoryName: 'Trabajo',
    },
    {
      title: 'Preparar rutina de ejercicio',
      description: 'Establecer el esquema de entrenamiento para el fin de semana.',
      status: Status.IN_PROGRESS,
      priority: Priority.MEDIUM,
      dueDate: new Date('2026-09-09T07:00:00.000Z'),
      categoryName: 'Personal',
    },
    {
      title: 'Repasar apuntes de programación',
      description: 'Revisar ejercicios y preparar dudas para la próxima práctica.',
      status: Status.COMPLETED,
      priority: Priority.LOW,
      dueDate: new Date('2026-09-05T16:00:00.000Z'),
      categoryName: 'Estudio',
    },
  ];

  const tasks = await Promise.all(
    taskSeeds.map(({ categoryName, ...taskData }) => {
      const category = categoryMap.get(categoryName);

      if (!category) {
        throw new Error(`Categoría no encontrada: ${categoryName}`);
      }

      return prisma.task.create({
        data: {
          ...taskData,
          userId: user.id,
          categoryId: category.id,
        },
      });
    }),
  );

  console.log('Seed ejecutado correctamente.');
  console.log(
    JSON.stringify(
      {
        user: {
          email: user.email,
          id: user.id,
        },
        categoriesCreated: categories.length,
        tasksCreated: tasks.length,
        categories: categories.map((category) => ({
          name: category.name,
          color: category.color,
        })),
        tasks: tasks.map((task) => ({
          title: task.title,
          status: task.status,
          priority: task.priority,
          categoryId: task.categoryId,
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error('Error ejecutando el seed de Prisma:');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
