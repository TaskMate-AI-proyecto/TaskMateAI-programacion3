import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildApp } from '../src/app';

async function exportOpenApi() {
  const app = await buildApp();

  await app.ready();
  const outputDirectory = join(process.cwd(), 'docs');
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(join(outputDirectory, 'openapi.json'), JSON.stringify(app.swagger(), null, 2));
  await app.close();
}

void exportOpenApi().catch((error) => {
  console.error(error);
  process.exit(1);
});