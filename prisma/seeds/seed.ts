import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seed...\n')

  console.log('📝 Seeding question types...')

  const questionTypes = [
    'text',
    'textarea',
    'number',
    'boolean',
    'date',
    'multiple_choice',
    'checkbox',
    'none_or_explain'
  ]

  for (const typeName of questionTypes) {
    await prisma.questionType.upsert({
      where: { questionTypeName: typeName },
      update: {},
      create: { questionTypeName: typeName }
    })
  }
  console.log('✅ Question types seeded\n')

  console.log('⚖️ Seeding legal types...')
  const legalTypeNames = ['Standard', 'Bare Land', 'Air Parcel']
  for (const name of legalTypeNames) {
    await prisma.legalType.upsert({
      where: { legalTypeName: name },
      update: {},
      create: { legalTypeName: name }
    })
  }
  console.log('✅ Legal types seeded\n')

  console.log('🏠 Seeding property types...')
  const propertyTypeEntries = [
    { name: 'Bare Land', sortOrder: 1 },
    { name: 'Bare Land with Septic', sortOrder: 2 },
    { name: 'Bare Land with Clubhouse', sortOrder: 3 },
    { name: 'Townhomes', sortOrder: 4 },
    { name: 'Townhomes with Septic', sortOrder: 5 },
    { name: 'Townhomes with Clubhouse', sortOrder: 6 },
    { name: 'Apartments', sortOrder: 7 },
    { name: 'Apartments with Clubhouse', sortOrder: 8 },
    { name: 'Mixed-Use: Apt over Retail', sortOrder: 9 },
    { name: 'Mixed-Use: Commercial', sortOrder: 10 },
    { name: 'Industrial', sortOrder: 11 },
    { name: 'Air Parcel', sortOrder: 12 },
    { name: 'Other', sortOrder: 13 },
  ]
  for (const entry of propertyTypeEntries) {
    await prisma.propertyType.upsert({
      where: { propertyTypeName: entry.name },
      update: { sortOrder: entry.sortOrder },
      create: { propertyTypeName: entry.name, sortOrder: entry.sortOrder }
    })
  }
  console.log('✅ Property types seeded\n')

  console.log('📋 Seeding sections...')
  const sectionNames = [
    'Shared - Joint Use',
    'Residential',
    'Retail',
    'Office',
    'Parking',
    'Hospitality',
    'Industrial',
    'Other'
  ]
  for (const name of sectionNames) {
    await prisma.section.upsert({
      where: { sectionName: name },
      update: {},
      create: { sectionName: name }
    })
  }
  console.log('✅ Sections seeded\n')

  console.log('📄 Seeding document types...')

  const documentTypes = [
    'Strata Plan',
    'Current Bylaws',
    'Section Bylaws',
    'AGM Notice with Proposed Budget/Financial Documents',
    'AGM Minutes with Financials',
    'Special General Meeting Minutes',
    'Former Depreciation Reports',
    'Engineering/Elevator/Roofing Reports',
    'Engineering + Specialist Reports',
    'Architectural/Building Plans',
    'Clubhouse Building Plans',
    'Shared Utility/Shared Amenity Agreements',
    'Air Parcel Agreement'
  ]

  for (const typeName of documentTypes) {
    await prisma.documentType.upsert({
      where: { typeName },
      update: {},
      create: { typeName }
    })
  }
  console.log('✅ Document types seeded\n')

  console.log('\n✅ All seed data complete!\n')
  console.log(`📊 Summary:`)
  console.log(`   - Question Types: ${questionTypes.length}`)
  console.log(`   - Document Types: ${documentTypes.length}`)
  console.log(`   - Survey Questions: seeded separately via seedQuestions.ts`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
