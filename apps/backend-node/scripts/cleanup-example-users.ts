import 'dotenv/config';
import prisma from '../src/lib/prisma';

// Borra los usuarios cuyo correo o identificador termina en ".example"; sus datos se borran en cascada.
// Sin --apply sólo muestra lo que borraría: nunca borra por accidente.
async function main() {
  const apply = process.argv.includes('--apply');
  const matches = await prisma.user.findMany({
    where: { OR: [{ email: { endsWith: '.example' } }, { uniqueTag: { endsWith: '.example' } }] },
    select: { id: true, email: true, uniqueTag: true },
  });

  process.stdout.write(`Usuarios que coinciden: ${matches.length}\n`);
  for (const user of matches) process.stdout.write(`- ${user.email} ${user.uniqueTag}\n`);

  if (!apply) {
    process.stdout.write('Simulación: no se ha borrado nada. Añade --apply para borrarlos.\n');
    return;
  }

  const result = await prisma.user.deleteMany({
    where: { id: { in: matches.map((user) => user.id) } },
  });
  process.stdout.write(`Borrados: ${result.count}\n`);
}

main()
  .catch((err: unknown) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
