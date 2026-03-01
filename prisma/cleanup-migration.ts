import prisma from '../src/shared/lib/prismaClient';

async function main() {
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "question_legal_type"`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "question_section"`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "strata_service"`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "required_document"`);
  console.log("Dropped unused tables successfully");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
