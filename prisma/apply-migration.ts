import prisma from '../src/shared/lib/prismaClient';

async function main() {
  console.log("Starting migration...");

  try {
    // 1. Add columns to Question
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."question" ADD COLUMN IF NOT EXISTS "parent_question_id" INTEGER`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."question" ADD COLUMN IF NOT EXISTS "sub_label" VARCHAR(10)`);
    console.log("Added parent_question_id and sub_label to question");

    // Add foreign key constraint for parent_question_id if it doesn't exist
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."question"
        ADD CONSTRAINT "question_parent_question_id_fkey"
        FOREIGN KEY ("parent_question_id") REFERENCES "public"."question"("question_id") ON DELETE SET NULL ON UPDATE CASCADE
      `);
      console.log("Added foreign key constraint for question_parent_question_id");
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        console.log("foreign key question_parent_question_id might already exist:", e.message);
      }
    }

    // 2. Create sr_survey_question mapping table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."sr_survey_question" (
        "sr_survey_question_id" SERIAL NOT NULL,
        "service_request_id" INTEGER NOT NULL,
        "question_id" INTEGER NOT NULL,
        "property_type_id" INTEGER NOT NULL,
        CONSTRAINT "sr_survey_question_pkey" PRIMARY KEY ("sr_survey_question_id")
      )
    `);

    // Add foreign keys and unique constraints for sr_survey_question
    try {
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "sr_survey_question_service_request_id_question_id_property_type_id_key" 
        ON "public"."sr_survey_question"("service_request_id", "question_id", "property_type_id")
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."sr_survey_question" 
        ADD CONSTRAINT "sr_survey_question_service_request_id_fkey" 
        FOREIGN KEY ("service_request_id") REFERENCES "public"."service_request"("service_request_id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."sr_survey_question" 
        ADD CONSTRAINT "sr_survey_question_question_id_fkey" 
        FOREIGN KEY ("question_id") REFERENCES "public"."question"("question_id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."sr_survey_question" 
        ADD CONSTRAINT "sr_survey_question_property_type_id_fkey" 
        FOREIGN KEY ("property_type_id") REFERENCES "public"."property_type"("property_type_id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
      console.log("Created table and constraints for sr_survey_question");
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
        console.log("Constraint for sr_survey_question might already exist:", e.message);
      }
    }

    // 3. Add propertyTypeId to QuestionResponse
    // It's required, so we need to add as nullable, update existing rows, then set NOT NULL
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."question_response" ADD COLUMN IF NOT EXISTS "property_type_id" INTEGER`);
    
    // We can just wipe existing responses to make applying NOT NULL easy, since schema fundamentally changed
    await prisma.$executeRawUnsafe(`DELETE FROM "public"."question_response" WHERE "property_type_id" IS NULL`);
    
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."question_response" 
        ADD CONSTRAINT "question_response_property_type_id_fkey" 
        FOREIGN KEY ("property_type_id") REFERENCES "public"."property_type"("property_type_id") ON DELETE CASCADE ON UPDATE CASCADE
      `);
    } catch (e: any) {
      if (!e.message.includes('already exists')) {
         console.log("Constraint for question_response property_type_id might already exist:", e.message);
      }
    }

    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."question_response" ALTER COLUMN "property_type_id" SET NOT NULL`);
    console.log("Added property_type_id to question_response");

    // 4. Add RLS Policies to new tables
    console.log("Applying RLS policies to mapping tables...");
    
    // sr_survey_question RLS
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."sr_survey_question" ENABLE ROW LEVEL SECURITY`);
    
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'sr_survey_question' AND policyname = 'Enable read access for all users'
        ) THEN
          CREATE POLICY "Enable read access for all users" ON "public"."sr_survey_question" FOR SELECT USING (true);
        END IF;
      END
      $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'sr_survey_question' AND policyname = 'Enable insert for authenticated users only'
        ) THEN
          CREATE POLICY "Enable insert for authenticated users only" ON "public"."sr_survey_question" FOR INSERT TO authenticated WITH CHECK (true);
        END IF;
      END
      $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'sr_survey_question' AND policyname = 'Enable update for authenticated users only'
        ) THEN
          CREATE POLICY "Enable update for authenticated users only" ON "public"."sr_survey_question" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
        END IF;
      END
      $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'sr_survey_question' AND policyname = 'Enable delete for authenticated users only'
        ) THEN
          CREATE POLICY "Enable delete for authenticated users only" ON "public"."sr_survey_question" FOR DELETE TO authenticated USING (true);
        END IF;
      END
      $$;
    `);

    // sr_survey_requirement RLS
    await prisma.$executeRawUnsafe(`ALTER TABLE "public"."sr_survey_requirement" ENABLE ROW LEVEL SECURITY`);
    
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'sr_survey_requirement' AND policyname = 'Enable read access for all users'
        ) THEN
          CREATE POLICY "Enable read access for all users" ON "public"."sr_survey_requirement" FOR SELECT USING (true);
        END IF;
      END
      $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'sr_survey_requirement' AND policyname = 'Enable insert for authenticated users only'
        ) THEN
          CREATE POLICY "Enable insert for authenticated users only" ON "public"."sr_survey_requirement" FOR INSERT TO authenticated WITH CHECK (true);
        END IF;
      END
      $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'sr_survey_requirement' AND policyname = 'Enable update for authenticated users only'
        ) THEN
          CREATE POLICY "Enable update for authenticated users only" ON "public"."sr_survey_requirement" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
        END IF;
      END
      $$;
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT FROM pg_policies WHERE tablename = 'sr_survey_requirement' AND policyname = 'Enable delete for authenticated users only'
        ) THEN
          CREATE POLICY "Enable delete for authenticated users only" ON "public"."sr_survey_requirement" FOR DELETE TO authenticated USING (true);
        END IF;
      END
      $$;
    `);
    
    console.log("Successfully applied RLS policies.");

    console.log("Migration successful.");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
