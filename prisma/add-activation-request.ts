import prisma from '../src/shared/lib/prismaClient';

async function main() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "public"."activation_request" (
      "activation_request_id" SERIAL NOT NULL,
      "strata_profile_id"     INTEGER NOT NULL,
      "status"                VARCHAR(50) NOT NULL DEFAULT 'Pending',
      "rejection_reason"      TEXT,
      "reviewed_by_profile_id" UUID,
      "created_at"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      "reviewed_at"           TIMESTAMPTZ,

      CONSTRAINT "activation_request_pkey" PRIMARY KEY ("activation_request_id")
    );
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "public"."activation_request"
      DROP CONSTRAINT IF EXISTS "activation_request_strata_profile_id_fkey";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "public"."activation_request"
      ADD CONSTRAINT "activation_request_strata_profile_id_fkey"
      FOREIGN KEY ("strata_profile_id")
      REFERENCES "public"."strata_profiles"("strata_profile_id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "public"."activation_request"
      DROP CONSTRAINT IF EXISTS "activation_request_reviewed_by_profile_id_fkey";
  `);

  await prisma.$executeRawUnsafe(`
    ALTER TABLE "public"."activation_request"
      ADD CONSTRAINT "activation_request_reviewed_by_profile_id_fkey"
      FOREIGN KEY ("reviewed_by_profile_id")
      REFERENCES "public"."profiles"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  `);

  console.log('activation_request table created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
