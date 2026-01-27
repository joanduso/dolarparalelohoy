import { prisma } from '../lib/db';
import { runIngest } from '../lib/ingest/run';

async function main() {
  try {
    const result = await runIngest(prisma);
    console.log(`Ingest completado: ${result.inserted} registros`);
    if (result.errors.length) {
      console.warn('Errores:', result.errors);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
