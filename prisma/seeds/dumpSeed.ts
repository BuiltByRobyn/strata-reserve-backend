import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const s = (v: string | null | undefined) => v == null ? 'null' : JSON.stringify(v)
const n = (v: number | null | undefined) => v == null ? 'null' : String(v)
const b = (v: boolean) => v ? 'true' : 'false'

async function main() {
  const [
    questionTypes,
    legalTypes,
    propertyTypes,
    sections,
    documentTypes,
    services,
    locations,
    reviewStatuses,
    userTypes,
    timeSlots,
    appointmentTypes,
    appointmentTypeTimeSlots,
    companyHolidays,
    questions,
    multipleChoiceOptions,
    questionPropertyTypes,
    questionServices,
  ] = await Promise.all([
    prisma.questionType.findMany({ orderBy: { questionTypeId: 'asc' } }),
    prisma.legalType.findMany({ orderBy: { legalTypeId: 'asc' } }),
    prisma.propertyType.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.section.findMany({ orderBy: { sectionId: 'asc' } }),
    prisma.documentType.findMany({ orderBy: { documentTypeId: 'asc' } }),
    prisma.service.findMany({ orderBy: { serviceId: 'asc' } }),
    prisma.location.findMany({ orderBy: { locationId: 'asc' } }),
    prisma.reviewStatus.findMany({ orderBy: { reviewStatusId: 'asc' } }),
    prisma.userType.findMany({ orderBy: { userTypeId: 'asc' } }),
    prisma.appointmentTimeSlot.findMany({ orderBy: { timeSlotId: 'asc' } }),
    prisma.appointmentType.findMany({ orderBy: { appointmentTypeId: 'asc' } }),
    prisma.appointmentTypeTimeSlot.findMany({ orderBy: { appointmentTypeTimeSlotId: 'asc' } }),
    prisma.companyHoliday.findMany({ orderBy: { companyHolidayId: 'asc' } }),
    prisma.question.findMany({ orderBy: { questionId: 'asc' } }),
    prisma.multipleChoiceOption.findMany({ orderBy: { multipleChoiceOptionId: 'asc' } }),
    prisma.questionPropertyType.findMany({ orderBy: { questionPropertyTypeId: 'asc' } }),
    prisma.questionService.findMany({ orderBy: { questionServiceId: 'asc' } }),
  ])

  const lines: string[] = []

  lines.push(`// AUTO-GENERATED BACKUP SEED`)
  lines.push(`// Generated: ${new Date().toISOString()}`)
  lines.push(`// Run from backend/ with: npx tsx prisma/seeds/seed-backup.ts`)
  lines.push(``)
  lines.push(`import { Pool } from 'pg'`)
  lines.push(`import { PrismaPg } from '@prisma/adapter-pg'`)
  lines.push(`import { PrismaClient } from '@prisma/client'`)
  lines.push(`import 'dotenv/config'`)
  lines.push(``)
  lines.push(`const connectionString = process.env.DATABASE_URL`)
  lines.push(`if (!connectionString) throw new Error('DATABASE_URL environment variable is not set')`)
  lines.push(``)
  lines.push(`const pool = new Pool({ connectionString })`)
  lines.push(`const adapter = new PrismaPg(pool)`)
  lines.push(`const prisma = new PrismaClient({ adapter })`)
  lines.push(``)
  lines.push(`async function main() {`)
  lines.push(`  console.log('🌱 Restoring backup seed...\\n')`)
  lines.push(``)

  // --- Tables with natural @unique fields (no explicit ID needed) ---

  lines.push(`  // Question Types`)
  for (const r of questionTypes) {
    lines.push(`  await prisma.questionType.upsert({ where: { questionTypeName: ${s(r.questionTypeName)} }, update: {}, create: { questionTypeName: ${s(r.questionTypeName)} } })`)
  }
  lines.push(`  console.log('✓ Question types (${questionTypes.length})')`)
  lines.push(``)

  lines.push(`  // Legal Types`)
  for (const r of legalTypes) {
    lines.push(`  await prisma.legalType.upsert({ where: { legalTypeName: ${s(r.legalTypeName)} }, update: {}, create: { legalTypeName: ${s(r.legalTypeName)} } })`)
  }
  lines.push(`  console.log('✓ Legal types (${legalTypes.length})')`)
  lines.push(``)

  lines.push(`  // Property Types`)
  for (const r of propertyTypes) {
    lines.push(`  await prisma.propertyType.upsert({ where: { propertyTypeName: ${s(r.propertyTypeName)} }, update: { sortOrder: ${n(r.sortOrder)}, description: ${s(r.description)} }, create: { propertyTypeName: ${s(r.propertyTypeName)}, sortOrder: ${n(r.sortOrder)}, description: ${s(r.description)} } })`)
  }
  lines.push(`  console.log('✓ Property types (${propertyTypes.length})')`)
  lines.push(``)

  lines.push(`  // Sections`)
  for (const r of sections) {
    lines.push(`  await prisma.section.upsert({ where: { sectionName: ${s(r.sectionName)} }, update: {}, create: { sectionName: ${s(r.sectionName)} } })`)
  }
  lines.push(`  console.log('✓ Sections (${sections.length})')`)
  lines.push(``)

  lines.push(`  // Document Types`)
  for (const r of documentTypes) {
    lines.push(`  await prisma.documentType.upsert({ where: { typeName: ${s(r.typeName)} }, update: {}, create: { typeName: ${s(r.typeName)} } })`)
  }
  lines.push(`  console.log('✓ Document types (${documentTypes.length})')`)
  lines.push(``)

  lines.push(`  // Services`)
  for (const r of services) {
    lines.push(`  await prisma.service.upsert({ where: { serviceName: ${s(r.serviceName)} }, update: { serviceDescription: ${s(r.serviceDescription)} }, create: { serviceName: ${s(r.serviceName)}, serviceDescription: ${s(r.serviceDescription)} } })`)
  }
  lines.push(`  console.log('✓ Services (${services.length})')`)
  lines.push(``)

  lines.push(`  // Locations`)
  for (const r of locations) {
    lines.push(`  await prisma.location.upsert({ where: { locationCode: ${s(r.locationCode)} }, update: { locationName: ${s(r.locationName)} }, create: { locationCode: ${s(r.locationCode)}, locationName: ${s(r.locationName)} } })`)
  }
  lines.push(`  console.log('✓ Locations (${locations.length})')`)
  lines.push(``)

  lines.push(`  // Review Statuses`)
  for (const r of reviewStatuses) {
    lines.push(`  await prisma.reviewStatus.upsert({ where: { statusName: ${s(r.statusName)} }, update: {}, create: { statusName: ${s(r.statusName)} } })`)
  }
  lines.push(`  console.log('✓ Review statuses (${reviewStatuses.length})')`)
  lines.push(``)

  lines.push(`  // User Types`)
  for (const r of userTypes) {
    lines.push(`  await prisma.userType.upsert({ where: { userTypeName: ${s(r.userTypeName)} }, update: {}, create: { userTypeName: ${s(r.userTypeName)} } })`)
  }
  lines.push(`  console.log('✓ User types (${userTypes.length})')`)
  lines.push(``)

  // --- Tables that only have @id as unique (use explicit ID in upsert) ---

  lines.push(`  // Appointment Time Slots`)
  for (const r of timeSlots) {
    lines.push(`  await prisma.appointmentTimeSlot.upsert({ where: { timeSlotId: ${n(r.timeSlotId)} }, update: { slotTime: ${s(r.slotTime)}, slotName: ${s(r.slotName)} }, create: { timeSlotId: ${n(r.timeSlotId)}, slotTime: ${s(r.slotTime)}, slotName: ${s(r.slotName)} } })`)
  }
  lines.push(`  console.log('✓ Appointment time slots (${timeSlots.length})')`)
  lines.push(``)

  lines.push(`  // Appointment Types`)
  for (const r of appointmentTypes) {
    const svcName = services.find(sv => sv.serviceId === r.serviceId)?.serviceName
    const svcConnect = svcName ? `{ connect: { serviceName: ${s(svcName)} } }` : `{ connect: { serviceId: ${n(r.serviceId)} } }`
    lines.push(`  await prisma.appointmentType.upsert({`)
    lines.push(`    where: { appointmentTypeId: ${n(r.appointmentTypeId)} },`)
    lines.push(`    update: { typeName: ${s(r.typeName)}, durationType: ${s(r.durationType)}, description: ${s(r.description)}, isDraftMeeting: ${b(r.isDraftMeeting)} },`)
    lines.push(`    create: { appointmentTypeId: ${n(r.appointmentTypeId)}, typeName: ${s(r.typeName)}, durationType: ${s(r.durationType)}, description: ${s(r.description)}, isDraftMeeting: ${b(r.isDraftMeeting)}, service: ${svcConnect} }`)
    lines.push(`  })`)
  }
  lines.push(`  console.log('✓ Appointment types (${appointmentTypes.length})')`)
  lines.push(``)

  lines.push(`  // Appointment Type Time Slots`)
  for (const r of appointmentTypeTimeSlots) {
    lines.push(`  await prisma.appointmentTypeTimeSlot.upsert({ where: { appointmentTypeId_timeSlotId: { appointmentTypeId: ${n(r.appointmentTypeId)}, timeSlotId: ${n(r.timeSlotId)} } }, update: {}, create: { appointmentTypeId: ${n(r.appointmentTypeId)}, timeSlotId: ${n(r.timeSlotId)} } })`)
  }
  lines.push(`  console.log('✓ Appointment type time slots (${appointmentTypeTimeSlots.length})')`)
  lines.push(``)

  lines.push(`  // Company Holidays`)
  for (const r of companyHolidays) {
    const dateStr = r.holidayDate instanceof Date ? r.holidayDate.toISOString() : String(r.holidayDate)
    lines.push(`  await prisma.companyHoliday.upsert({ where: { companyHolidayId: ${n(r.companyHolidayId)} }, update: { holidayDate: new Date(${s(dateStr)}), holidayName: ${s(r.holidayName)}, isRecurringAnnually: ${b(r.isRecurringAnnually)} }, create: { companyHolidayId: ${n(r.companyHolidayId)}, holidayDate: new Date(${s(dateStr)}), holidayName: ${s(r.holidayName)}, isRecurringAnnually: ${b(r.isRecurringAnnually)} } })`)
  }
  lines.push(`  console.log('✓ Company holidays (${companyHolidays.length})')`)
  lines.push(``)

  // --- Questions: parents before children to satisfy self-reference ---

  const parentQuestions = questions.filter(q => q.parentQuestionId === null)
  const childQuestions = questions.filter(q => q.parentQuestionId !== null)

  lines.push(`  // Questions — parents first`)
  for (const q of parentQuestions) {
    lines.push(`  await prisma.question.upsert({ where: { questionId: ${n(q.questionId)} }, update: { questionText: ${s(q.questionText)}, isRequired: ${b(q.isRequired)}, subLabel: ${s(q.subLabel)}, informationText: ${s(q.informationText)}, questionCategory: ${s(q.questionCategory)}, questionTypeId: ${n(q.questionTypeId)} }, create: { questionId: ${n(q.questionId)}, questionText: ${s(q.questionText)}, isRequired: ${b(q.isRequired)}, subLabel: ${s(q.subLabel)}, informationText: ${s(q.informationText)}, questionCategory: ${s(q.questionCategory)}, questionTypeId: ${n(q.questionTypeId)} } })`)
  }
  lines.push(`  console.log('✓ Parent questions (${parentQuestions.length})')`)
  lines.push(``)

  lines.push(`  // Questions — children`)
  for (const q of childQuestions) {
    lines.push(`  await prisma.question.upsert({ where: { questionId: ${n(q.questionId)} }, update: { questionText: ${s(q.questionText)}, isRequired: ${b(q.isRequired)}, subLabel: ${s(q.subLabel)}, informationText: ${s(q.informationText)}, questionCategory: ${s(q.questionCategory)}, questionTypeId: ${n(q.questionTypeId)}, parentQuestionId: ${n(q.parentQuestionId)} }, create: { questionId: ${n(q.questionId)}, questionText: ${s(q.questionText)}, isRequired: ${b(q.isRequired)}, subLabel: ${s(q.subLabel)}, informationText: ${s(q.informationText)}, questionCategory: ${s(q.questionCategory)}, questionTypeId: ${n(q.questionTypeId)}, parentQuestionId: ${n(q.parentQuestionId)} } })`)
  }
  lines.push(`  console.log('✓ Child questions (${childQuestions.length})')`)
  lines.push(``)

  lines.push(`  // Multiple Choice Options`)
  for (const r of multipleChoiceOptions) {
    lines.push(`  await prisma.multipleChoiceOption.upsert({ where: { multipleChoiceOptionId: ${n(r.multipleChoiceOptionId)} }, update: { sortOrder: ${n(r.sortOrder)}, optionText: ${s(r.optionText)}, questionId: ${n(r.questionId)} }, create: { multipleChoiceOptionId: ${n(r.multipleChoiceOptionId)}, sortOrder: ${n(r.sortOrder)}, optionText: ${s(r.optionText)}, questionId: ${n(r.questionId)} } })`)
  }
  lines.push(`  console.log('✓ Multiple choice options (${multipleChoiceOptions.length})')`)
  lines.push(``)

  lines.push(`  // Question Property Types`)
  for (const r of questionPropertyTypes) {
    lines.push(`  await prisma.questionPropertyType.upsert({ where: { questionPropertyTypeId: ${n(r.questionPropertyTypeId)} }, update: {}, create: { questionPropertyTypeId: ${n(r.questionPropertyTypeId)}, questionId: ${n(r.questionId)}, propertyTypeId: ${n(r.propertyTypeId)} } })`)
  }
  lines.push(`  console.log('✓ Question property types (${questionPropertyTypes.length})')`)
  lines.push(``)

  lines.push(`  // Question Services`)
  for (const r of questionServices) {
    lines.push(`  await prisma.questionService.upsert({ where: { questionServiceId: ${n(r.questionServiceId)} }, update: { sortOrder: ${n(r.sortOrder)} }, create: { questionServiceId: ${n(r.questionServiceId)}, sortOrder: ${n(r.sortOrder)}, questionId: ${n(r.questionId)}, serviceId: ${n(r.serviceId)} } })`)
  }
  lines.push(`  console.log('✓ Question services (${questionServices.length})')`)
  lines.push(``)

  // Reset sequences for tables where explicit IDs were used
  lines.push(`  // Reset sequences so future inserts don't conflict`)
  const seqResets = [
    ['appointment_time_slot', 'time_slot_id'],
    ['appointment_type', 'appointment_type_id'],
    ['appointment_type_time_slot', 'appointment_type_time_slot_id'],
    ['company_holiday', 'company_holiday_id'],
    ['question', 'question_id'],
    ['multiple_choice_option', 'multiple_choice_option_id'],
    ['question_property_type', 'question_property_type_id'],
    ['question_service', 'question_service_id'],
  ]
  for (const [table, col] of seqResets) {
    lines.push(`  await prisma.$executeRawUnsafe(\`SELECT setval(pg_get_serial_sequence('${table}', '${col}'), COALESCE((SELECT MAX(${col}) FROM ${table}), 0))\`)`)
  }
  lines.push(`  console.log('✓ Sequences reset')`)
  lines.push(``)

  lines.push(`  console.log('\\n✅ Backup restore complete!')`)
  lines.push(`}`)
  lines.push(``)
  lines.push(`main()`)
  lines.push(`  .catch((e) => { console.error(e); process.exit(1) })`)
  lines.push(`  .finally(async () => { await prisma.$disconnect(); await pool.end() })`)

  console.log(lines.join('\n'))
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
