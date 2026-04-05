import * as fs from 'fs'
import * as path from 'path'

const INPUT = path.resolve(__dirname, 'seed-backup.ts')
const OUTPUT = path.resolve(__dirname, '..', '..', '..', 'seed-data.sql')

// Model name -> table name
const modelToTable: Record<string, string> = {
  questionCategory: 'question_category',
  questionType: 'question_type',
  legalType: 'legal_type',
  propertyType: 'property_type',
  section: 'section',
  documentType: 'document_type',
  service: 'service',
  location: 'location',
  reviewStatus: 'review_status',
  userType: 'user_type',
  appointmentTimeSlot: 'appointment_time_slot',
  appointmentType: 'appointment_type',
  appointmentTypeTimeSlot: 'appointment_type_time_slot',
  companyHoliday: 'company_holiday',
  question: 'question',
  multipleChoiceOption: 'multiple_choice_option',
  questionPropertyType: 'question_property_type',
  questionService: 'question_service',
  helpResource: 'help_resource',
  strataSection: 'strata_section',
}

// Prisma camelCase field -> snake_case column
const fieldToColumn: Record<string, string> = {
  questionCategoryId: 'question_category_id',
  questionTypeId: 'question_type_id',
  legalTypeId: 'legal_type_id',
  propertyTypeId: 'property_type_id',
  documentTypeId: 'document_type_id',
  serviceId: 'service_id',
  locationId: 'location_id',
  sectionId: 'section_id',
  reviewStatusId: 'review_status_id',
  userTypeId: 'user_type_id',
  questionId: 'question_id',
  questionText: 'question_text',
  isRequired: 'is_required',
  subLabel: 'sub_label',
  informationText: 'information_text',
  parentQuestionId: 'parent_question_id',
  questionTypeName: 'question_type_name',
  legalTypeName: 'legal_type_name',
  propertyTypeName: 'property_type_name',
  sortOrder: 'sort_order',
  sectionName: 'section_name',
  typeName: 'type_name',
  serviceName: 'service_name',
  serviceDescription: 'service_description',
  locationCode: 'location_code',
  locationName: 'location_name',
  statusName: 'status_name',
  userTypeName: 'user_type_name',
  timeSlotId: 'time_slot_id',
  slotTime: 'slot_time',
  slotName: 'slot_name',
  appointmentTypeId: 'appointment_type_id',
  durationType: 'duration_type',
  isDraftMeeting: 'is_draft_meeting',
  companyHolidayId: 'company_holiday_id',
  holidayDate: 'holiday_date',
  holidayName: 'holiday_name',
  isRecurringAnnually: 'is_recurring_annually',
  multipleChoiceOptionId: 'multiple_choice_option_id',
  optionText: 'option_text',
  optionOrder: 'sort_order',
  questionPropertyTypeId: 'question_property_type_id',
  questionServiceId: 'question_service_id',
  helpResourceId: 'help_resource_id',
  resourceType: 'resource_type',
  isActive: 'is_active',
  appointmentTypeTimeSlotId: 'appointment_type_time_slot_id',
  key: 'key',
  label: 'label',
  description: 'description',
  url: 'url',
  audience: 'audience',
  title: 'title',
}

// Service name -> service_id mapping for resolving nested connect
const serviceNameToId: Record<string, number> = {
  'Electrical planning report referral': 1,
  'Insurance appraisal': 2,
  'Elevator depreciation report': 3,
  'Standard depreciation report': 4,
}

// Actual IDs from the original database for lookup tables
// These map the insertion order (1-based) to the real DB ID
const lookupIdMappings: Record<string, number[]> = {
  questionCategory: [1, 17, 2, 18, 3, 19, 5, 8, 20, 21],
  questionType: [1, 2, 3, 4, 5, 6, 7, 9],
  legalType: [5, 6, 7],
  propertyType: [159, 160, 161, 162, 163, 1, 121, 122, 11, 124, 125, 14, 127, 16, 17, 18, 19],
  documentType: [14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26],
  service: [1, 2, 3, 4],
  location: [1, 2, 3, 4, 5, 6],
  section: [1, 2, 3, 4, 5, 6, 7, 8],
  reviewStatus: [1, 2, 3],
  userType: [1, 2, 3, 4],
}

// The primary key column name for each model that needs ID injection
const lookupIdColumns: Record<string, string> = {
  questionCategory: 'questionCategoryId',
  questionType: 'questionTypeId',
  legalType: 'legalTypeId',
  propertyType: 'propertyTypeId',
  documentType: 'documentTypeId',
  service: 'serviceId',
  location: 'locationId',
  section: 'sectionId',
  reviewStatus: 'reviewStatusId',
  userType: 'userTypeId',
}

// Track insertion order per model to assign correct IDs
const insertionCounters: Record<string, number> = {}

// Tables that use a unique text column as conflict target instead of an autoincrement PK
const conflictTargets: Record<string, string> = {
  question_category: 'key',
  question_type: 'question_type_name',
  legal_type: 'legal_type_name',
  property_type: 'property_type_name',
  section: 'section_name',
  document_type: 'type_name',
  service: 'service_name',
  location: 'location_code',
  review_status: 'status_name',
  user_type: 'user_type_name',
  appointment_type_time_slot: 'appointment_type_id, time_slot_id',
}

// Primary key column for each table (used when not in conflictTargets)
const primaryKeys: Record<string, string> = {
  appointment_time_slot: 'time_slot_id',
  appointment_type: 'appointment_type_id',
  company_holiday: 'company_holiday_id',
  question: 'question_id',
  multiple_choice_option: 'multiple_choice_option_id',
  question_property_type: 'question_property_type_id',
  question_service: 'question_service_id',
  help_resource: 'help_resource_id',
  strata_section: 'strata_section_id',
}

const modelFieldOverrides: Record<string, Record<string, string>> = {}

function escapeSQL(val: string): string {
  return val.replace(/'/g, "''")
}

function formatValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL'
  if (typeof val === 'boolean') return val ? 'true' : 'false'
  if (typeof val === 'number') return String(val)
  if (typeof val === 'string') return `'${escapeSQL(val)}'`
  return 'NULL'
}

/**
 * Parse a simple `where: { fieldName: value }` to extract an ID if present.
 */
function parseWhereId(whereStr: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const simpleWhere = /(\w+)\s*:\s*(\d+)/g
  let m: RegExpExecArray | null
  while ((m = simpleWhere.exec(whereStr)) !== null) {
    result[m[1]] = Number(m[2])
  }
  return result
}

/**
 * Parse the `create: { ... }` object from a single upsert call string.
 * Returns a record of field -> value (raw JS values).
 */
function parseCreateObject(createStr: string, _modelName: string): Record<string, unknown> | null {
  const result: Record<string, unknown> = {}

  // Remove outer braces
  let inner = createStr.trim()
  if (inner.startsWith('{')) inner = inner.slice(1)
  if (inner.endsWith('}')) inner = inner.slice(0, -1)
  inner = inner.trim()

  // Handle nested `service: { connect: { serviceName: "..." } }` for appointmentType
  const connectRegex = /service:\s*\{\s*connect:\s*\{\s*serviceName:\s*"([^"]+)"\s*\}\s*\}/
  const connectMatch = inner.match(connectRegex)
  if (connectMatch) {
    const svcName = connectMatch[1]
    const svcId = serviceNameToId[svcName]
    if (svcId) {
      result['serviceId'] = svcId
    }
    // Remove the nested object from the string so it doesn't confuse the field parser
    inner = inner.replace(connectRegex, '').trim()
    // Clean up trailing/leading commas
    inner = inner.replace(/,\s*,/g, ',').replace(/,\s*$/, '').replace(/^\s*,/, '')
  }

  // Now parse simple key: value pairs
  // We need to handle: strings (double or single quoted), numbers, booleans, null, new Date("...")
  const fieldRegex = /(\w+)\s*:\s*(?:new\s+Date\("([^"]+)"\)|"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'|(true|false|null|-?\d+(?:\.\d+)?))/g

  let match: RegExpExecArray | null
  while ((match = fieldRegex.exec(inner)) !== null) {
    const fieldName = match[1]
    if (match[2] !== undefined) {
      // new Date("...")
      result[fieldName] = match[2] // Store as ISO string
    } else if (match[3] !== undefined) {
      // Double-quoted string
      result[fieldName] = match[3].replace(/\\"/g, '"').replace(/\\n/g, '\n')
    } else if (match[4] !== undefined) {
      // Single-quoted string
      result[fieldName] = match[4].replace(/\\'/g, "'").replace(/\\n/g, '\n')
    } else if (match[5] !== undefined) {
      const raw = match[5]
      if (raw === 'true') result[fieldName] = true
      else if (raw === 'false') result[fieldName] = false
      else if (raw === 'null') result[fieldName] = null
      else result[fieldName] = Number(raw)
    }
  }

  if (Object.keys(result).length === 0) return null
  return result
}

function main() {
  const source = fs.readFileSync(INPUT, 'utf-8')
  const lines = source.split('\n')

  const sqlStatements: string[] = []
  sqlStatements.push('-- Auto-generated SQL seed from seed-backup.ts')
  sqlStatements.push(`-- Generated: ${new Date().toISOString()}`)
  sqlStatements.push('')
  sqlStatements.push('BEGIN;')
  sqlStatements.push('')

  // We need to collect multi-line upsert calls too (appointmentType spans multiple lines)
  // Strategy: join all lines, then split by `await prisma.`
  const joined = lines.join('\n')

  // Extract all upsert calls
  const upsertRegex = /await\s+prisma\.(\w+)\.upsert\(\s*\{([\s\S]*?)\}\s*\)/g

  let upsertMatch: RegExpExecArray | null
  let currentSection = ''
  const subQuestionEntries: { parentId: number; childId: number }[] = []

  while ((upsertMatch = upsertRegex.exec(joined)) !== null) {
    const modelName = upsertMatch[1]
    const bodyStr = upsertMatch[2]

    const tableName = modelToTable[modelName]
    if (!tableName) {
      console.warn(`Unknown model: ${modelName}, skipping`)
      continue
    }

    // Add section comment when model changes
    if (modelName !== currentSection) {
      if (currentSection) sqlStatements.push('')
      sqlStatements.push(`-- ${tableName}`)
      currentSection = modelName
    }

    // Extract the create: { ... } portion
    // Find `create:` then match the balanced braces
    const createIdx = bodyStr.indexOf('create:')
    if (createIdx === -1) continue

    let braceDepth = 0
    let startIdx = -1
    let endIdx = -1
    for (let i = createIdx + 7; i < bodyStr.length; i++) {
      if (bodyStr[i] === '{') {
        if (braceDepth === 0) startIdx = i
        braceDepth++
      } else if (bodyStr[i] === '}') {
        braceDepth--
        if (braceDepth === 0) {
          endIdx = i
          break
        }
      }
    }

    if (startIdx === -1 || endIdx === -1) continue

    const createBody = bodyStr.slice(startIdx, endIdx + 1)
    const fields = parseCreateObject(createBody, modelName)
    if (!fields) continue

    // Extract IDs from the where clause and merge into create data if missing
    const whereIdx = bodyStr.indexOf('where:')
    if (whereIdx !== -1) {
      let wBraceDepth = 0
      let wStart = -1
      let wEnd = -1
      for (let wi = whereIdx + 6; wi < bodyStr.length; wi++) {
        if (bodyStr[wi] === '{') {
          if (wBraceDepth === 0) wStart = wi
          wBraceDepth++
        } else if (bodyStr[wi] === '}') {
          wBraceDepth--
          if (wBraceDepth === 0) { wEnd = wi; break }
        }
      }
      if (wStart !== -1 && wEnd !== -1) {
        const whereBody = bodyStr.slice(wStart, wEnd + 1)
        const whereIds = parseWhereId(whereBody)
        for (const [wField, wVal] of Object.entries(whereIds)) {
          if (!(wField in fields)) {
            fields[wField] = wVal
          }
        }
      }
    }

    // Inject real IDs for lookup tables
    if (lookupIdMappings[modelName]) {
      if (!insertionCounters[modelName]) insertionCounters[modelName] = 0
      const idx = insertionCounters[modelName]
      const realId = lookupIdMappings[modelName][idx]
      const idField = lookupIdColumns[modelName]
      if (realId !== undefined && idField) {
        fields[idField] = realId
      }
      insertionCounters[modelName]++
    }

    // For question model: extract parentQuestionId into separate join table entries
    if (modelName === 'question' && fields.parentQuestionId != null) {
      const childId = fields.questionId as number
      const parentId = fields.parentQuestionId as number
      subQuestionEntries.push({ parentId, childId })
      delete fields.parentQuestionId
    }

    // Build column list and value list
    const columns: string[] = []
    const values: string[] = []

    for (const [fieldName, value] of Object.entries(fields)) {
      // Resolve column name
      let colName: string
      if (modelFieldOverrides[modelName]?.[fieldName]) {
        colName = modelFieldOverrides[modelName][fieldName]
      } else if (fieldToColumn[fieldName]) {
        colName = fieldToColumn[fieldName]
      } else {
        // fallback: just use the field name as-is (already snake_case or simple)
        colName = fieldName
      }

      columns.push(colName)

      // Format value - dates need special handling
      if (fieldName.toLowerCase().includes('date') && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        values.push(`'${value}'`)
      } else {
        values.push(formatValue(value))
      }
    }

    // Determine conflict target
    let conflictClause: string
    if (conflictTargets[tableName]) {
      conflictClause = `ON CONFLICT (${conflictTargets[tableName]}) DO NOTHING`
    } else if (primaryKeys[tableName]) {
      conflictClause = `ON CONFLICT (${primaryKeys[tableName]}) DO NOTHING`
    } else {
      // Fallback: use first column
      conflictClause = `ON CONFLICT (${columns[0]}) DO NOTHING`
    }

    const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')}) ${conflictClause};`
    sqlStatements.push(sql)
  }

  // Add question_sub_question entries
  if (subQuestionEntries.length > 0) {
    sqlStatements.push('')
    sqlStatements.push('-- question_sub_question')
    for (const entry of subQuestionEntries) {
      sqlStatements.push(
        `INSERT INTO question_sub_question (parent_question_id, sub_question_id, sort_order) VALUES (${entry.parentId}, ${entry.childId}, 0) ON CONFLICT (parent_question_id, sub_question_id) DO NOTHING;`
      )
    }
  }

  // Add sequence resets
  sqlStatements.push('')
  sqlStatements.push('-- Reset sequences')
  const sequences = [
    { table: 'appointment_time_slot', col: 'time_slot_id' },
    { table: 'appointment_type', col: 'appointment_type_id' },
    { table: 'appointment_type_time_slot', col: 'appointment_type_time_slot_id' },
    { table: 'company_holiday', col: 'company_holiday_id' },
    { table: 'question', col: 'question_id' },
    { table: 'multiple_choice_option', col: 'multiple_choice_option_id' },
    { table: 'question_property_type', col: 'question_property_type_id' },
    { table: 'question_service', col: 'question_service_id' },
    { table: 'question_type', col: 'question_type_id' },
    { table: 'legal_type', col: 'legal_type_id' },
    { table: 'property_type', col: 'property_type_id' },
    { table: 'section', col: 'section_id' },
    { table: 'document_type', col: 'document_type_id' },
    { table: 'service', col: 'service_id' },
    { table: 'location', col: 'location_id' },
    { table: 'review_status', col: 'review_status_id' },
    { table: 'user_type', col: 'user_type_id' },
  ]

  for (const seq of sequences) {
    sqlStatements.push(
      `SELECT setval(pg_get_serial_sequence('${seq.table}', '${seq.col}'), COALESCE((SELECT MAX(${seq.col}) FROM ${seq.table}), 0));`
    )
  }

  sqlStatements.push('')
  sqlStatements.push('COMMIT;')
  sqlStatements.push('')

  fs.writeFileSync(OUTPUT, sqlStatements.join('\n'), 'utf-8')
  console.log(`SQL seed written to: ${OUTPUT}`)
  console.log(`Total statements: ${sqlStatements.filter(s => s.startsWith('INSERT') || s.startsWith('SELECT setval')).length}`)
}

main()
