import prisma from '../src/shared/lib/prismaClient'

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "sr_survey_requirement" (
      "sr_survey_requirement_id" SERIAL NOT NULL,
      "service_request_id" INTEGER NOT NULL,
      "property_type_id" INTEGER NOT NULL,

      CONSTRAINT "sr_survey_requirement_pkey" PRIMARY KEY ("sr_survey_requirement_id")
    );
  `);
  
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "sr_survey_requirement" DROP CONSTRAINT IF EXISTS "sr_survey_requirement_service_request_id_fkey";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "sr_survey_requirement" ADD CONSTRAINT "sr_survey_requirement_service_request_id_fkey" FOREIGN KEY ("service_request_id") REFERENCES "service_request"("service_request_id") ON DELETE CASCADE ON UPDATE CASCADE;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "sr_survey_requirement" DROP CONSTRAINT IF EXISTS "sr_survey_requirement_property_type_id_fkey";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "sr_survey_requirement" ADD CONSTRAINT "sr_survey_requirement_property_type_id_fkey" FOREIGN KEY ("property_type_id") REFERENCES "property_type"("property_type_id") ON DELETE CASCADE ON UPDATE CASCADE;
  `);

  await prisma.$executeRawUnsafe(`
    DROP INDEX IF EXISTS "sr_survey_requirement_service_request_id_property_type_id_key";
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX "sr_survey_requirement_service_request_id_property_type_id_key" ON "sr_survey_requirement"("service_request_id", "property_type_id");
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
