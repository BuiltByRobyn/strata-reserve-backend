import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../src/generated/prisma'
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
  console.log('🔍 Fetching required IDs...')
  
  const standardDR = await prisma.service.findFirst({
    where: { serviceName: { contains: 'Standard depreciation', mode: 'insensitive' } }
  })

  if (!standardDR) {
    console.error('❌ Standard Depreciation Report service not found!')
    console.log('💡 Please create the service first in your database')
    return
  }

  const allPropertyTypes = await prisma.propertyType.findMany()
  const bareLand = allPropertyTypes.find(pt => pt.propertyTypeName === 'Bare Land')
  
  const qtTextarea = await prisma.questionType.findFirst({ 
    where: { questionTypeName: 'textarea' } 
  })
  const qtMultipleChoice = await prisma.questionType.findFirst({ 
    where: { questionTypeName: 'multiple_choice' } 
  })
  const qtNumber = await prisma.questionType.findFirst({ 
    where: { questionTypeName: 'number' } 
  })
  const qtCheckbox = await prisma.questionType.findFirst({ 
    where: { questionTypeName: 'checkbox' } 
  })
  const qtNoneOrExplain = await prisma.questionType.findFirst({ 
    where: { questionTypeName: 'none_or_explain' } 
  })

  console.log('✅ IDs fetched\n')

  console.log('❓ Seeding survey questions...\n')

  let sortOrder = 1


  console.log('  🏞️  Septic Fields questions...')

  await prisma.question.upsert({
    where: { questionId: 1 },
    update: {},
    create: {
      questionId: 1,
      questionText: 'Does the wastewater system carry waste water to septic field on the lots, to a community holding tank or a biodigester system?',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtMultipleChoice!.questionTypeId,
      informationText: 'Select the type of wastewater system used in your strata',
      multipleChoiceOptions: {
        create: [
          { sortOrder: 1, optionText: 'Individual Septic Fields' },
          { sortOrder: 2, optionText: 'Community holding tank' },
          { sortOrder: 3, optionText: 'Biodigester' },
        ]
      },
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  await prisma.question.upsert({
    where: { questionId: 2 },
    update: {},
    create: {
      questionId: 2,
      questionText: 'Please describe the community septic system',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  await prisma.question.upsert({
    where: { questionId: 3 },
    update: {},
    create: {
      questionId: 3,
      questionText: 'Who is responsible for the pump(s) to carry wastewater to the holding/septic tank?',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  await prisma.question.upsert({
    where: { questionId: 4 },
    update: {},
    create: {
      questionId: 4,
      questionText: 'How many pumps are between the residence and the holding tank(s)?',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtNumber!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  await prisma.question.upsert({
    where: { questionId: 5 },
    update: {},
    create: {
      questionId: 5,
      questionText: 'Please describe the composition, number and capacity of holding tanks (if known)',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  await prisma.question.upsert({
    where: { questionId: 6 },
    update: {},
    create: {
      questionId: 6,
      questionText: 'When was the last time any work was completed and what was the cost?',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  await prisma.question.upsert({
    where: { questionId: 7 },
    update: {},
    create: {
      questionId: 7,
      questionText: 'Please describe the size, capacity, make and model of biodigester',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  await prisma.question.upsert({
    where: { questionId: 8 },
    update: {},
    create: {
      questionId: 8,
      questionText: 'Number and replacement history of holding tanks between biodigester and community septic fields',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  await prisma.question.upsert({
    where: { questionId: 9 },
    update: {},
    create: {
      questionId: 9,
      questionText: 'Number and replacement history of pumps between biodigester and community septic field',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  await prisma.question.upsert({
    where: { questionId: 10 },
    update: {},
    create: {
      questionId: 10,
      questionText: 'Are you planning any work in the future?',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  console.log('  ✅ Septic Fields questions seeded')

  console.log('  🏘️  Clubhouse questions...')

  await prisma.question.upsert({
    where: { questionId: 11 },
    update: {},
    create: {
      questionId: 11,
      questionText: 'When was the clubhouse envelope, including siding, windows, doors and roofing last replaced, and at what cost?',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  await prisma.question.upsert({
    where: { questionId: 12 },
    update: {},
    create: {
      questionId: 12,
      questionText: 'When were the clubhouse interior, including flooring, painting, doors and lighting last replaced and at what cost?',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  await prisma.question.upsert({
    where: { questionId: 13 },
    update: {},
    create: {
      questionId: 13,
      questionText: 'Clubhouse mechanical equipment replacement history including boilers, hot water tanks, or heat pumps, including cost?',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  await prisma.question.upsert({
    where: { questionId: 14 },
    update: {},
    create: {
      questionId: 14,
      questionText: 'What is the history of the clubhouse furniture and equipment including in the Lounge, Gym, Kitchen, appliances, Chairs, Tables, Etc.',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  await prisma.question.upsert({
    where: { questionId: 15 },
    update: {},
    create: {
      questionId: 15,
      questionText: 'Are there any repairs or replacement work planned for the future?',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      },
      questionPropertyTypes: bareLand ? {
        create: { propertyTypeId: bareLand.propertyTypeId }
      } : undefined
    }
  })

  console.log('  ✅ Clubhouse questions seeded')
  console.log('  🏊 Amenity questions...')

  await prisma.question.upsert({
    where: { questionId: 16 },
    update: {},
    create: {
      questionId: 16,
      questionText: 'Please indicate amenity package',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtCheckbox!.questionTypeId,
      informationText: 'Select all amenities available in your strata',
      multipleChoiceOptions: {
        create: [
          { sortOrder: 1, optionText: 'Common Room' },
          { sortOrder: 2, optionText: 'Guest Room' },
          { sortOrder: 3, optionText: 'Sauna' },
          { sortOrder: 4, optionText: 'Gym' },
          { sortOrder: 5, optionText: 'Library' },
          { sortOrder: 6, optionText: 'Pool' },
          { sortOrder: 7, optionText: 'Charging Rooms' },
          { sortOrder: 8, optionText: 'Tennis' },
          { sortOrder: 9, optionText: 'Playground' },
          { sortOrder: 10, optionText: 'Concierge' },
          { sortOrder: 11, optionText: 'Caretakers Suite' },
          { sortOrder: 12, optionText: 'Badminton Courts' },
          { sortOrder: 13, optionText: 'Rooftop Garden' },
          { sortOrder: 14, optionText: 'Steam Room' },
          { sortOrder: 15, optionText: 'Workshop' },
          { sortOrder: 16, optionText: 'Theater' },
          { sortOrder: 17, optionText: 'Pond/Fountain' },
          { sortOrder: 18, optionText: 'Other' },
        ]
      },
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      }
    }
  })

  console.log('  ✅ Amenity questions seeded')

  console.log('  ⚖️  Legal Issues questions...')

  await prisma.question.upsert({
    where: { questionId: 17 },
    update: {},
    create: {
      questionId: 17,
      questionText: 'Have there been lawsuits or arbitration decisions that affected the Contingency Reserve Fund (CRF)?',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtNoneOrExplain!.questionTypeId,
      informationText: 'Check "None" if not applicable, or provide explanation',
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      }
    }
  })

  await prisma.question.upsert({
    where: { questionId: 18 },
    update: {},
    create: {
      questionId: 18,
      questionText: 'Are there pending litigation/CRT claims that may affect the building?',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtNoneOrExplain!.questionTypeId,
      informationText: 'Check "None" if not applicable, or provide explanation',
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      }
    }
  })

  await prisma.question.upsert({
    where: { questionId: 19 },
    update: {},
    create: {
      questionId: 19,
      questionText: 'Has the strata taken responsibility for a component in/on a strata lot?',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtNoneOrExplain!.questionTypeId,
      informationText: 'Check "None" if not applicable, or provide explanation',
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      }
    }
  })

  await prisma.question.upsert({
    where: { questionId: 20 },
    update: {},
    create: {
      questionId: 20,
      questionText: 'Please provide a list of strata lots that have taken responsibility/alteration agreement for changes to common property or attachments/alterations of the building envelope',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtTextarea!.questionTypeId,
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      }
    }
  })

  console.log('  ✅ Legal Issues questions seeded')

  console.log('  🏛️  Council Concerns questions...')

  await prisma.question.upsert({
    where: { questionId: 21 },
    update: {},
    create: {
      questionId: 21,
      questionText: 'Please indicate any issues that the strata has or Council is concerned about',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtNoneOrExplain!.questionTypeId,
      informationText: 'Check "None" if not applicable, or provide explanation',
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      }
    }
  })

  await prisma.question.upsert({
    where: { questionId: 22 },
    update: {},
    create: {
      questionId: 22,
      questionText: 'Please summary any issues the strata had with the prior Depreciation Report?',
      isRequired: true,
      questionCategory: 'survey',
      questionTypeId: qtNoneOrExplain!.questionTypeId,
      informationText: 'Check "None" if not applicable, or provide explanation',
      questionServices: {
        create: {
          serviceId: standardDR.serviceId,
          sortOrder: sortOrder++
        }
      }
    }
  })

  console.log('  ✅ Council Concerns questions seeded')

  console.log('\n📋 Seeding required documents...\n')

  const allDocTypes = await prisma.documentType.findMany()
  const docType = (name: string) => allDocTypes.find(d => d.typeName === name)

  const industrial = allPropertyTypes.find(pt => pt.propertyTypeName === 'Industrial')
  const townhome = allPropertyTypes.find(pt => pt.propertyTypeName === 'Townhomes')
  const apartment = allPropertyTypes.find(pt => pt.propertyTypeName === 'Apartments')
  const airParcel = allPropertyTypes.find(pt => pt.propertyTypeName === 'Air Parcel')
  const mixedUseApt = allPropertyTypes.find(pt => pt.propertyTypeName === 'Mixed-Use: Apt over Retail')
  const mixedUseComm = allPropertyTypes.find(pt => pt.propertyTypeName === 'Mixed-Use: Commercial')

  console.log('  Property types found:', allPropertyTypes.map(pt => pt.propertyTypeName).join(', '))

  await prisma.requiredDocument.deleteMany({})

  const requiredDocs: Array<{ serviceId: number; documentTypeId: number; propertyTypeId: number | null; isRequired: boolean }> = []

  const addUniversal = (docTypeName: string) => {
    const dt = docType(docTypeName)
    if (dt) {
      requiredDocs.push({ serviceId: standardDR.serviceId, documentTypeId: dt.documentTypeId, propertyTypeId: null, isRequired: true })
    }
  }

  const addForPropertyTypes = (docTypeName: string, pts: Array<{ propertyTypeId: number } | undefined>) => {
    const dt = docType(docTypeName)
    if (!dt) return
    for (const pt of pts) {
      if (pt) {
        requiredDocs.push({ serviceId: standardDR.serviceId, documentTypeId: dt.documentTypeId, propertyTypeId: pt.propertyTypeId, isRequired: true })
      }
    }
  }

  addUniversal('Strata Plan')
  addUniversal('Current Bylaws')
  addUniversal('AGM Notice with Proposed Budget/Financial Documents')
  addUniversal('AGM Minutes with Financials')
  addUniversal('Special General Meeting Minutes')
  addUniversal('Former Depreciation Reports')

  addForPropertyTypes('Engineering/Elevator/Roofing Reports', [industrial, apartment, mixedUseApt, mixedUseComm, airParcel])
  addForPropertyTypes('Engineering + Specialist Reports', [bareLand])
  addForPropertyTypes('Architectural/Building Plans', [industrial, townhome, mixedUseApt, mixedUseComm, airParcel])
  addForPropertyTypes('Clubhouse Building Plans', [bareLand])
  addForPropertyTypes('Shared Utility/Shared Amenity Agreements', [bareLand, industrial, townhome, mixedUseApt])
  addForPropertyTypes('Air Parcel Agreement', [airParcel, industrial, townhome, mixedUseApt])

  await prisma.requiredDocument.createMany({ data: requiredDocs })
  console.log(`  ✅ ${requiredDocs.length} required document entries seeded`)

  console.log('\n✅ All seed data complete!\n')
  console.log(`📊 Summary:`)
  console.log(`   - Question Types: ${questionTypes.length}`)
  console.log(`   - Document Types: ${documentTypes.length}`)
  console.log(`   - Survey Questions: 22`)
  console.log(`   - Required Documents: ${requiredDocs.length}`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })