import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import type { QuestionDef } from '../../src/shared/types/question.types'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const APARTMENT_TOWNHOUSE_COMMERCIAL: QuestionDef[] = [
  { text: 'When was the last time you completed any work on the exterior siding? This includes painting the building. Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'If you have brick or stone veneer, when was the last time you completed any work? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the building envelope? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the windows? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the sliding doors? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'If you have balconies, when was the last time you completed any work? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the front door(s)? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the enter phone or security system? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the garage door, or the motor? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the roof? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the skylights, if any? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you replaced the metal flashing? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'Did you replace the roof access hatch during the re-roofing project or independently? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'Are the attic areas in the townhomes common area (if any)? When did you do any repair or replacement work on them and how much did you spend?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the downspouts or gutters? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the elevator? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you painted the interior of the building? Who was the supplier? And what was the cost? Please separate the painting in the common rooms from the hallways.', category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any flooring? Who was the supplier? And what was the cost? Please separate the flooring in the common amenity rooms from the hallways.', category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you refreshed the lobby area? And what was the cost?', category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the interior lights? And what was the cost?', category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the interior furniture? Who was the supplier? And what was the cost?', category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'Are any of the service doors in need of work, and have any of them been replaced? Who was the supplier? And what was the cost?', category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When did you last replace or do work on the boiler for hydronic heat (if any)? Hydronic heat is water-based baseboard heat. Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When did you last replace the boiler for domestic hot water heat (if any)? Bathrooms and kitchens. Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When did you last replace the domestic hot water storage tanks (if any)? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When did you install the expansion tanks (if any)? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the water, sanitary or sewer systems, or the sump pump? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the rooftop HVAC or Make-up air system? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the parking exhaust system, fans, or gas monitors, if you have them? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the fire panel or emergency alarm system? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the irrigation system? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any repair or replacement work on the landscaping, exterior lighting or internal roadways, driveways or parkade ramps? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any repair or replacement work on the security gate, or the motor? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the fences? Who was the supplier? And what was the cost? Do you share costs for the maintenance of fences, etc.?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'Are you planning any work in the future around the items discussed above? When was the last time you completed any repair or replacement work on the loading doors, or the motor? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any repair or replacement work on the water, sanitary or sewer systems, or the sump pump? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'When was the last time you completed any work on the fire panel or emergency alarm system? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'Has anything been replaced in the past few years that is not included in the above questions?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
]

const AMENITY_CLUBHOUSE_INTERIOR: QuestionDef[] = [
  { text: 'Is there an Amenity Room (including Guest Suites)?', category: 'Amenity Room', type: 'boolean', propertyTypes: ['Amenity/Clubhouse Interior'] },
  { text: 'When was the last time you painted the interior of the amenity areas? Who was the supplier? And what was the cost?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity/Clubhouse Interior'] },
  { text: 'When was the last time you completed any flooring in the interior of the amenity areas? Who was the supplier? And what was the cost?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity/Clubhouse Interior'] },
  { text: 'When was the last time you completed any repair or replacement work on the interior lights? And what was the cost?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity/Clubhouse Interior'] },
  { text: 'Are any of the services doors in need of work, and have any of them been replaced? Who was the supplier? And what was the cost?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity/Clubhouse Interior'] },
  { text: 'When was the last time you completed any repair or replacement work on the amenity rooms not discussed above, and please specify the specific rooms? Who was the supplier? And what was the cost?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity/Clubhouse Interior'] },
  { text: 'What is the history of the Furniture and Equipment and the Common Rooms and Areas?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity/Clubhouse Interior'] },
  { text: 'When did you last replace or do work on the boiler for hydronic heat, domestic hot water heat, or domestic hot water storage tanks? Who was the supplier? And what was the cost?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity/Clubhouse Interior'] },
  { text: 'Has anything been replaced in the amenities area during the past few years that is not included in the above questions?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity/Clubhouse Interior'] },
  { text: 'Are you planning any repair or replacement work in the future around the items discussed above?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity/Clubhouse Interior'] },
]

const CLUBHOUSE_EXTERIOR: QuestionDef[] = [
  { text: 'When was the last time you completed any repair or replacement work on the exterior siding? This includes painting the buildings. Who was the supplier? And what was the cost?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse Exterior'] },
  { text: 'If you have brick or stone veneer, when was the last time you completed any repair or replacement work? Who was the supplier? And what was the cost?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse Exterior'] },
  { text: 'When was the last time you completed any repair or replacement work on the building envelope? What was done? Who was the supplier? And what was the cost?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse Exterior'] },
  { text: 'When was the last time you completed any repair or replacement work on the windows? Who was the supplier? And what was the cost?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse Exterior'] },
  { text: 'When was the last time you completed any repair or replacement work on the sliding doors? Who was the supplier? And what was the cost?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse Exterior'] },
  { text: 'When was the last time you completed any repair or replacement work on the front doors? Who was the supplier? And what was the cost?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse Exterior'] },
  { text: 'When was the last time you completed any repair or replacement work on the roof? Who was the supplier? And what was the cost?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse Exterior'] },
  { text: 'When was the clubhouse roof last replaced? Who was the installer? And what was the cost?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse Exterior'] },
  { text: 'When was the last time you completed any repair or replacement work on the skylights, if any? Who was the supplier? And what was the cost?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse Exterior'] },
  { text: 'When was the last time you replaced the flashing? Who was the supplier? And what was the cost?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse Exterior'] },
]

const COMMON_SEPTIC_FIELD: QuestionDef[] = [
  { text: 'Is there a Common Septic Field? Please describe the system.', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'Are there pumps to carry the wastewater from the residences to the septic tanks? If the pumps are owned by the Strata, how many? Have they been replaced? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'Are the septic tanks on the strata lots? If so, proceed to Question 6.', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'Are there community septic tanks to hold the wastewater from the residences? If so, how many? Please describe the system and recent work completed.', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'How many pumps are there to carry the wastewater from the septic tanks to the community septic field distribution (holding) tanks or biodigester system (if applicable)? Have they been replaced? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'Is there a biodigester system in place? If Yes, please describe the system and recent work completed. How many pumps and septic tanks are involved? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'Is the community Septic Tank original from construction? Has it been replaced? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'Does the Septic System have Pumps to move the wastewater from community septic field distribution (holding) tanks to the district sewer system? Please describe costs and history.', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'Are you planning any work in the future with the Septic System?', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
]

const BARE_LAND: QuestionDef[] = [
  { text: 'When was the last time you completed any work on the security system? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
  { text: 'When was the last time you completed any repair or replacement work on the security gate, or the motor? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
  { text: 'When was the last time you completed any repair or replacement work on the water, sanitary or sewer systems, or the sump pump? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Bare Land'] },
  { text: 'When was the last time you completed any repair or replacement work on the irrigation system? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
  { text: 'Do you share costs for maintenance of fences, etc.?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
  { text: 'When was the last time you completed any repair or replacement work on the landscaping, exterior lighting or internal roadways, driveways or parkade ramps? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
  { text: 'Are you planning any repair or replacement work in the future around the items discussed above?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
  { text: 'Has anything been replaced in the past few years that is not included in the above questions?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
  { text: 'Are you planning any work in the future around the items discussed above?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
]

const INDUSTRIAL: QuestionDef[] = [
  { text: 'When was the last time you completed any repair or replacement work on the loading doors, or the motor? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Industrial'] },
  { text: 'When was the last time you completed any repair or replacement work on the water, sanitary or sewer systems, or the sump pump? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Industrial'] },
  { text: 'When was the last time you completed any work on the fire panel or emergency alarm system? Who was the supplier? And what was the cost?', category: 'Services', type: 'textarea', propertyTypes: ['Industrial'] },
  { text: 'Do you share costs for maintenance of fences, etc.?', category: 'Exterior', type: 'textarea', propertyTypes: ['Industrial'] },
  { text: 'When was the last time you completed any repair or replacement work on the landscaping, exterior lighting or internal roadways, driveways or parkade ramps? Who was the supplier? And what was the cost?', category: 'Exterior', type: 'textarea', propertyTypes: ['Industrial'] },
  { text: 'Has anything been replaced in the commercial section during the past few years that is not included in the above questions?', category: 'Exterior', type: 'textarea', propertyTypes: ['Industrial'] },
]

const ADMINISTRATION: QuestionDef[] = [
  { text: 'Are there recent Engineers Reports?', category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { text: 'Are there prior Depreciation Reports?', category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { text: 'Are any reports recommending work that will require a specific Levy in the near future?', category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { text: 'Are there any Reciprocal Cost sharing agreements?', category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { text: 'Are there lawsuits or arbitration decisions that impact common assets?', category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { text: 'Does the Strata have an Easement, Legal agreement to provide Services, Air Parcel agreement, or other legal agreements?', category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { text: 'Are there any alteration agreements where specific owners have taken responsibility of change to common property or attachments/alterations of the building envelope?', category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { text: 'Has the Strata taken responsibility for a component on/in a strata lot?', category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
]

const ALL_QUESTIONS = [
  ...APARTMENT_TOWNHOUSE_COMMERCIAL,
  ...AMENITY_CLUBHOUSE_INTERIOR,
  ...CLUBHOUSE_EXTERIOR,
  ...COMMON_SEPTIC_FIELD,
  ...BARE_LAND,
  ...INDUSTRIAL,
  ...ADMINISTRATION,
]

const NEW_PROPERTY_TYPE_NAMES = [
  'Apartments',
  'Townhomes',
  'Mixed-Use: Commercial',
  'Amenity/Clubhouse Interior',
  'Clubhouse Exterior',
  'Common Septic Field',
  'Administration',
]

async function main() {
  console.log('Seeding questions...\n')

  console.log('Ensuring property types exist...')
  let nextSortOrder = 200
  for (const name of NEW_PROPERTY_TYPE_NAMES) {
    await prisma.propertyType.upsert({
      where: { propertyTypeName: name },
      update: {},
      create: { propertyTypeName: name, sortOrder: nextSortOrder++ },
    })
  }
  console.log(`  ${NEW_PROPERTY_TYPE_NAMES.length} property types ensured\n`)

  const allPropertyTypes = await prisma.propertyType.findMany()
  const ptMap = new Map(allPropertyTypes.map(pt => [pt.propertyTypeName, pt.propertyTypeId]))

  const allQuestionTypes = await prisma.questionType.findMany()
  const qtMap = new Map(allQuestionTypes.map(qt => [qt.questionTypeName, qt.questionTypeId]))

  const service = await prisma.service.findFirst({
    where: { serviceName: { contains: 'Standard depreciation', mode: 'insensitive' } }
  })

  if (!service) {
    console.error('Standard Depreciation Report service not found. Create it first.')
    return
  }

  console.log('Creating questions...')
  let created = 0
  let skipped = 0

  for (let i = 0; i < ALL_QUESTIONS.length; i++) {
    const q = ALL_QUESTIONS[i]
    const questionTypeId = qtMap.get(q.type)
    if (!questionTypeId) {
      console.error(`  Question type "${q.type}" not found, skipping: ${q.text.slice(0, 50)}...`)
      skipped++
      continue
    }

    const existing = await prisma.question.findFirst({
      where: { questionText: q.text }
    })
    if (existing) {
      skipped++
      continue
    }

    const propertyTypeIds = q.propertyTypes
      .map(name => ptMap.get(name))
      .filter((id): id is number => id !== undefined)

    await prisma.question.create({
      data: {
        questionText: q.text,
        isRequired: true,
        questionCategory: q.category,
        questionTypeId,
        informationText: q.informationText ?? null,
        questionServices: {
          create: { serviceId: service.serviceId, sortOrder: i + 1 }
        },
        ...(propertyTypeIds.length > 0
          ? { questionPropertyTypes: { create: propertyTypeIds.map(id => ({ propertyTypeId: id })) } }
          : {}),
        ...(q.multipleChoiceOptions?.length
          ? { multipleChoiceOptions: { create: q.multipleChoiceOptions.map((text, idx) => ({ optionText: text, sortOrder: idx + 1 })) } }
          : {}),
      }
    })
    created++
  }

  console.log(`\n  Created: ${created}`)
  console.log(`  Skipped (already exist): ${skipped}`)
  console.log(`  Total: ${ALL_QUESTIONS.length}\n`)
  console.log('Question seed complete!')
}

main()
  .catch((e) => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
