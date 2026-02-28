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

// Standard sub-questions that appear on most maintenance history questions
const SUPPLIER_COST_SUBS = [
  { label: 'a', text: 'Who was the supplier?', type: 'textarea' as const },
  { label: 'b', text: 'What was the cost?', type: 'textarea' as const },
]

// ─────────────────────────────────────────────────────────────────────────────
// Apartment / Townhouse / Commercial (Common Questions)
// ─────────────────────────────────────────────────────────────────────────────
const APARTMENT_TOWNHOUSE_COMMERCIAL: QuestionDef[] = [
  { text: 'When was the last time you completed any work on the exterior siding? This includes painting the building.', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'If you have brick or stone veneer, when was the last time you completed any work?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the building envelope?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the windows?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the sliding doors?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'If you have balconies, when was the last time you completed any work?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the front door(s)?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the enter phone or security system?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the garage door, or the motor?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the roof?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the skylights, if any?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you replaced the metal flashing?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'Did you replace the roof access hatch during the re-roofing project or independently?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'Are the attic areas in the townhomes common area (if any)? When did you do any repair or replacement work on them?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ label: 'a', text: 'How much did you spend?', type: 'textarea' }] },
  { text: 'When was the last time you completed any work on the downspouts or gutters?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the elevator?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you painted the interior of the building? Please separate the painting in the common rooms from the hallways.', category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any flooring? Please separate the flooring in the common amenity rooms from the hallways.', category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you refreshed the lobby area?', category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ label: 'a', text: 'What was the cost?', type: 'textarea' }] },
  { text: 'When was the last time you completed any work on the interior lights?', category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ label: 'a', text: 'What was the cost?', type: 'textarea' }] },
  { text: 'When was the last time you completed any work on the interior furniture?', category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'Are any of the service doors in need of work, and have any of them been replaced?', category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When did you last replace or do work on the boiler for hydronic heat (if any)? Hydronic heat is water-based baseboard heat.', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When did you last replace the boiler for domestic hot water heat (if any)? Bathrooms and kitchens.', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When did you last replace the domestic hot water storage tanks (if any)?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When did you install the expansion tanks (if any)?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the water, sanitary or sewer systems, or the sump pump?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the rooftop HVAC or Make-up air system?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the parking exhaust system, fans, or gas monitors, if you have them?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the fire panel or emergency alarm system?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the irrigation system?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the landscaping, exterior lighting or internal roadways, driveways or parkade ramps?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the security gate, or the motor?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the fences? Do you share costs for the maintenance of fences, etc.?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the loading doors, or the motor?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'Has anything been replaced in the past few years that is not included in the above questions?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { text: 'Are you planning any work in the future around the items discussed above?', category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Amenity Area or Clubhouse (Interiors)
// ─────────────────────────────────────────────────────────────────────────────
const AMENITY_CLUBHOUSE_INTERIOR: QuestionDef[] = [
  { text: 'Is there an Amenity Room (including Guest Suites)?', category: 'Amenity Room', type: 'boolean', propertyTypes: ['Amenity Room'] },
  { text: 'When was the last time you painted the interior of the amenity areas?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any flooring in the interior of the amenity areas?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the interior lights?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: [{ label: 'a', text: 'What was the cost?', type: 'textarea' }] },
  { text: 'Are any of the services doors in need of work, and have any of them been replaced?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the amenity rooms not discussed above? Please specify the specific rooms.', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'What is the history of the Furniture and Equipment and the Common Rooms and Areas?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'] },
  { text: 'When did you last replace or do work on the boiler for hydronic heat (if one)? Hydronic heat is water-based baseboard heat.', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When did you last replace the boiler for domestic hot water heat (if one)? Bathrooms and kitchen.', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When did you last replace the domestic hot water storage tanks (if one)?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'Has anything been replaced in the amenities area during the past few years that is not included in the above questions?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'] },
  { text: 'Are you planning any repair or replacement work in the future around the items discussed above?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Clubhouse (Exterior) – Separate Building
// ─────────────────────────────────────────────────────────────────────────────
const CLUBHOUSE_EXTERIOR: QuestionDef[] = [
  { text: 'When was the last time you completed any repair or replacement work on the exterior siding? This includes painting the buildings.', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'If you have brick or stone veneer, when was the last time you completed any repair or replacement work?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the building envelope? What was done?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the windows?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the sliding doors?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the front doors?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the roof?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the clubhouse roof last replaced?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: [
    { label: 'a', text: 'Who was the installer?', type: 'textarea' },
    { label: 'b', text: 'What was the cost?', type: 'textarea' },
  ]},
  { text: 'When was the last time you completed any repair or replacement work on the skylights, if any?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you replaced the flashing?', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: SUPPLIER_COST_SUBS },
]

// ─────────────────────────────────────────────────────────────────────────────
// Common Septic Field
// ─────────────────────────────────────────────────────────────────────────────
const COMMON_SEPTIC_FIELD: QuestionDef[] = [
  { text: 'Is there a Common Septic Field? Please describe the system.', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'Are there pumps to carry the wastewater from the residences to the septic tanks? If the pumps are owned by Owners, go to Question 6.', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'If the pumps are owned by the Strata, how many? Have they been replaced?', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'Are the septic tanks on the strata lots? If so, proceed to Question 6.', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'Are there community septic tanks to hold the wastewater from the residences? If so, how many? Please describe the system and recent work completed.', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'How many pumps are there to carry the wastewater from the septic tanks to the community septic field distribution (holding) tanks or biodigester system (if applicable)? Have they been replaced?', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'Is there a biodigester system in place? If No, go to Question 8. If Yes, please describe the system and recent work completed.', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'How many pumps are there to carry the wastewater from the biodigester to the distribution (holding) tanks? Have they been replaced?', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'How many septic tanks hold the wastewater from the biodigester to the community septic field distribution (holding) tanks? If so, how many? Please describe the system and recent work completed.', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'Is the community Septic Tank original from construction? Has it been replaced?', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'Does the Septic System have Pumps to move the wastewater from community septic field distribution (holding) tanks to the district sewer system? Please describe costs and history.', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { text: 'Are you planning any work in the future with the Septic System?', category: 'Services', type: 'textarea', propertyTypes: ['Common Septic Field'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Bare Land Complex
// ─────────────────────────────────────────────────────────────────────────────
const BARE_LAND: QuestionDef[] = [
  { text: 'When was the last time you completed any work on the security system?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the security gate, or the motor?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the water, sanitary or sewer systems, or the sump pump?', category: 'Services', type: 'textarea', propertyTypes: ['Bare Land'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the irrigation system?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'Do you share costs for maintenance of fences, etc.?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
  { text: 'When was the last time you completed any repair or replacement work on the landscaping, exterior lighting or internal roadways, driveways or parkade ramps?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'Are you planning any repair or replacement work in the future around the items discussed above?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
  { text: 'Has anything been replaced in the past few years that is not included in the above questions?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Industrial Complex Maintenance History
// ─────────────────────────────────────────────────────────────────────────────
const INDUSTRIAL: QuestionDef[] = [
  { text: 'When was the last time you completed any repair or replacement work on the loading doors, or the motor?', category: 'Exterior', type: 'textarea', propertyTypes: ['Industrial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any repair or replacement work on the water, sanitary or sewer systems, or the sump pump?', category: 'Services', type: 'textarea', propertyTypes: ['Industrial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'When was the last time you completed any work on the fire panel or emergency alarm system?', category: 'Services', type: 'textarea', propertyTypes: ['Industrial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'Do you share costs for maintenance of fences, etc.?', category: 'Exterior', type: 'textarea', propertyTypes: ['Industrial'] },
  { text: 'When was the last time you completed any repair or replacement work on the landscaping, exterior lighting or internal roadways, driveways or parkade ramps?', category: 'Exterior', type: 'textarea', propertyTypes: ['Industrial'], subQuestions: SUPPLIER_COST_SUBS },
  { text: 'Has anything been replaced in the commercial section during the past few years that is not included in the above questions?', category: 'Exterior', type: 'textarea', propertyTypes: ['Industrial'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Administration (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
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

// Ensure all referenced property types exist in the DB before inserting questions.
const NEW_PROPERTY_TYPE_NAMES = [
  'Apartments',
  'Townhomes',
  'Mixed-Use: Commercial',
  'Amenity Room',
  'Clubhouse',
  'Common Septic Field',
  'Bare Land',
  'Industrial',
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

  // ─── Wipe existing questions for this service ───────────────────────────────
  console.log('Clearing existing questions linked to this service...')
  const existingQService = await prisma.questionService.findMany({
    where: { serviceId: service.serviceId },
    select: { questionId: true },
  })
  const existingQIds = existingQService.map(qs => qs.questionId)

  if (existingQIds.length > 0) {
    // Also find sub-questions that belong to these parents but may not be in questionService
    const subQs = await prisma.question.findMany({
      where: { parentQuestionId: { in: existingQIds } },
      select: { questionId: true },
    })
    const allQIds = [...new Set([...existingQIds, ...subQs.map(q => q.questionId)])]

    // Delete responses first (FK constraint)
    await prisma.questionResponse.deleteMany({ where: { questionId: { in: allQIds } } })

    // Delete sub-questions first (self-referential FK)
    const subQIds = subQs.map(q => q.questionId)
    if (subQIds.length > 0) {
      await prisma.question.deleteMany({ where: { questionId: { in: subQIds } } })
    }

    // Delete parents
    await prisma.question.deleteMany({ where: { questionId: { in: existingQIds } } })
  }
  console.log(`  Cleared ${existingQIds.length} existing questions\n`)

  console.log('Creating questions...')
  let created = 0
  let subCreated = 0

  for (let i = 0; i < ALL_QUESTIONS.length; i++) {
    const q = ALL_QUESTIONS[i]
    const questionTypeId = qtMap.get(q.type)
    if (!questionTypeId) {
      console.error(`  Question type "${q.type}" not found, skipping: ${q.text.slice(0, 50)}...`)
      continue
    }

    const propertyTypeIds = q.propertyTypes
      .map(name => ptMap.get(name))
      .filter((id): id is number => id !== undefined)

    // Create the parent question
    const parent = await prisma.question.create({
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

    // Create sub-questions linked to this parent
    if (q.subQuestions && q.subQuestions.length > 0) {
      const textareaTypeId = qtMap.get('textarea')
      for (const sub of q.subQuestions) {
        const subTypeId = qtMap.get(sub.type) ?? textareaTypeId
        if (!subTypeId) continue

        await prisma.question.create({
          data: {
            questionText: sub.text,
            subLabel: sub.label,
            parentQuestionId: parent.questionId,
            isRequired: true,
            questionCategory: q.category,
            questionTypeId: subTypeId,
            // Sub-questions inherit the same property types as the parent
            ...(propertyTypeIds.length > 0
              ? { questionPropertyTypes: { create: propertyTypeIds.map(id => ({ propertyTypeId: id })) } }
              : {}),
          }
        })
        subCreated++
      }
    }
  }

  console.log(`\n  Parent questions created: ${created}`)
  console.log(`  Sub-questions created:    ${subCreated}`)
  console.log(`  Total: ${created + subCreated}\n`)
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
