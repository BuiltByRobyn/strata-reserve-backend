import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🧹 Starting database reset...\n')

  await prisma.fileNumberDocumentReviewItem.deleteMany({})
  console.log('✓ Cleared file number document review items')

  await prisma.fileNumberDocumentNaStatus.deleteMany({})
  console.log('✓ Cleared document N/A statuses')

  await prisma.fileNumberDocumentReview.deleteMany({})
  console.log('✓ Cleared document reviews')

  await prisma.fileNumberDocument.deleteMany({})
  console.log('✓ Cleared uploaded documents')

  await prisma.fileNumberDocumentRequirement.deleteMany({})
  console.log('✓ Cleared document requirements')

  await prisma.fnSurveyQuestion.deleteMany({})
  console.log('✓ Cleared survey question assignments')

  await prisma.questionResponse.deleteMany({})
  console.log('✓ Cleared survey answers')

  await prisma.appointmentReview.deleteMany({})
  console.log('✓ Cleared appointment reviews')

  await prisma.appointment.deleteMany({})
  console.log('✓ Cleared appointments')

  await prisma.appointmentRequest.deleteMany({})
  console.log('✓ Cleared appointment requests')

  await prisma.fileNumberSurveyRequirement.deleteMany({})
  console.log('✓ Cleared file survey requirements')

  await prisma.inAppNotification.deleteMany({})
  console.log('✓ Cleared notifications')

  await prisma.fileNumber.deleteMany({})
  console.log('✓ Cleared file numbers')

  await prisma.activationRequest.deleteMany({})
  console.log('✓ Cleared activation requests')

  await prisma.propertyTypeRequest.deleteMany({})
  console.log('✓ Cleared property type requests')

  await prisma.profileActivityLog.deleteMany({})
  console.log('✓ Cleared profile activity logs')

  console.log('\n✅ Reset complete. Stratas, profiles, inspector availability, and all lookup data retained.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
