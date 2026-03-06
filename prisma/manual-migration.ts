import prisma from '../src/shared/lib/prismaClient'

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "fn_survey_requirement" (
      "fn_survey_requirement_id" SERIAL NOT NULL,
      "file_number_id" INTEGER NOT NULL,
      "property_type_id" INTEGER NOT NULL,

      CONSTRAINT "fn_survey_requirement_pkey" PRIMARY KEY ("fn_survey_requirement_id")
    );
  `);
  
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "fn_survey_requirement" DROP CONSTRAINT IF EXISTS "fn_survey_requirement_file_number_id_fkey";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "fn_survey_requirement" ADD CONSTRAINT "fn_survey_requirement_file_number_id_fkey" FOREIGN KEY ("file_number_id") REFERENCES "file_number"("file_number_id") ON DELETE CASCADE ON UPDATE CASCADE;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "fn_survey_requirement" DROP CONSTRAINT IF EXISTS "fn_survey_requirement_property_type_id_fkey";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "fn_survey_requirement" ADD CONSTRAINT "fn_survey_requirement_property_type_id_fkey" FOREIGN KEY ("property_type_id") REFERENCES "property_type"("property_type_id") ON DELETE CASCADE ON UPDATE CASCADE;
  `);

  await prisma.$executeRawUnsafe(`
    DROP INDEX IF EXISTS "fn_survey_requirement_file_number_id_property_type_id_key";
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX "fn_survey_requirement_file_number_id_property_type_id_key" ON "fn_survey_requirement"("file_number_id", "property_type_id");
  `);

  console.log("Migration successful");
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
