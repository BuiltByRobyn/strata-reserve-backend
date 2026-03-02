import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import type { QuestionDef } from '../../src/shared/types/question.types'
import { TEMPLATE_TO_PROPERTY_TYPES } from '../../src/shared/config/propertyTypeQuestionMapping'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// =============================================================================
// ALL QUESTIONS — gapless IDs 1–255
//
// Layout:
//   1–23   : New questions (from missing_db_questions.csv)
//   24–116 : Existing parent questions (previously 929–1149)
//   117–244: Existing sub-questions   (previously 930–1140)
//   245–255: New sub-questions        (from missing_db_questions.csv)
//
// Each QuestionDef includes an explicit `id` so the seed always produces
// the same IDs regardless of execution order.
// =============================================================================

// ─────────────────────────────────────────────────────────────────────────────
// NEW — Septic Fields intake questions  (IDs 1–8)
// ─────────────────────────────────────────────────────────────────────────────
const SEPTIC_FIELDS_NEW: QuestionDef[] = [
  { id: 1,  text: 'Does the wastewater system carry waste water to septic field on the lots, to a community holding tank or a biodigester system?', category: 'Septic Fields', type: 'multiple_choice', propertyTypes: ['Common Septic Field'], informationText: 'Select the type of wastewater system used in your strata', multipleChoiceOptions: ['Individual Septic Fields', 'Community holding tank', 'Biodigester'] },
  { id: 2,  text: 'Please describe the community septic system',                                                                                    category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { id: 3,  text: 'Who is responsible for the pump(s) to carry wastewater to the holding/septic tank?',                                             category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { id: 4,  text: 'How many pumps are between the residence and the holding tank(s)?',                                                               category: 'Septic Fields', type: 'number',   propertyTypes: ['Common Septic Field'] },
  { id: 5,  text: 'Please describe the composition, number and capacity of holding tanks (if known)',                                                category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { id: 6,  text: 'Please describe the size, capacity, make and model of biodigester',                                                              category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { id: 7,  text: 'Number and replacement history of holding tanks between biodigester and community septic fields',                                 category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { id: 8,  text: 'Number and replacement history of pumps between biodigester and community septic field',                                          category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// NEW — Clubhouse questions  (IDs 9–13)
// ─────────────────────────────────────────────────────────────────────────────
const CLUBHOUSE_NEW: QuestionDef[] = [
  { id: 9,  text: 'When was the clubhouse envelope, including siding, windows, doors and roofing last replaced, and at what cost?',               category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'] },
  { id: 10, text: 'When were the clubhouse interior, including flooring, painting, doors and lighting last replaced and at what cost?',           category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'] },
  { id: 11, text: 'Clubhouse mechanical equipment replacement history including boilers, hot water tanks, or heat pumps, including cost?',        category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'] },
  { id: 12, text: 'What is the history of the clubhouse furniture and equipment including in the Lounge, Gym, Kitchen, appliances, Chairs, Tables, Etc.', category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'] },
  { id: 13, text: 'Are there any repairs or replacement work planned for the future?',                                                           category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// NEW — Amenity Room, Legal, Council Concerns  (IDs 14–19)
// ─────────────────────────────────────────────────────────────────────────────
const AMENITY_LEGAL_COUNCIL_NEW: QuestionDef[] = [
  {
    id: 14,
    text: 'Please indicate amenity package',
    category: 'Amenity Room',
    type: 'checkbox',
    propertyTypes: ['Amenity Room'],
    informationText: 'Select all amenities available in your strata',
    multipleChoiceOptions: [
      'Common Room', 'Guest Room', 'Sauna', 'Gym', 'Library', 'Pool',
      'Changing Rooms', 'Tennis', 'Playground', 'Concierge', 'Caretakers Suite',
      'Badminton Courts', 'Rooftop Garden', 'Steam Room', 'Workshop', 'Theater',
      'Pond/Fountain', 'Other',
    ],
  },
  { id: 15, text: 'Have there been lawsuits or arbitration decisions that affected the Contingency Reserve Fund (CRF)?',                                                                         category: 'Legal',            type: 'none_or_explain', propertyTypes: ['Administration'], informationText: 'Check "None" if not applicable, or provide explanation' },
  { id: 16, text: 'Are there pending litigation/CRT claims that may affect the building?',                                                                                                       category: 'Legal',            type: 'none_or_explain', propertyTypes: ['Administration'], informationText: 'Check "None" if not applicable, or provide explanation' },
  { id: 17, text: 'Please provide a list of strata lots that have taken responsibility/alteration agreement for changes to common property or attachments/alterations of the building envelope', category: 'Legal',            type: 'textarea',        propertyTypes: ['Administration'] },
  { id: 18, text: 'Please indicate any issues that the strata has or Council is concerned about',                                                                                                category: 'Council Concerns', type: 'none_or_explain', propertyTypes: ['Administration'], informationText: 'Check "None" if not applicable, or provide explanation' },
  { id: 19, text: 'Please summary any issues the strata had with the prior Depreciation Report?',                                                                                                category: 'Council Concerns', type: 'none_or_explain', propertyTypes: ['Administration'], informationText: 'Check "None" if not applicable, or provide explanation' },
]

// ─────────────────────────────────────────────────────────────────────────────
// NEW — Misc parent questions  (IDs 20–23)
//   20 = attic areas parent            → sub 245
//   21 = boiler / DHW (Amenity Room)
//   22 = community septic tanks parent → subs 250, 251
//   23 = biodigester parent            → subs 253, 254
// ─────────────────────────────────────────────────────────────────────────────
const MISC_NEW_PARENTS: QuestionDef[] = [
  { id: 20, text: 'Are the attic areas in the townhomes common area (if any)?',                                                                        category: 'Exterior',     type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { id: 21, text: 'When did you last replace or do work on the boiler for hydronic heat, domestic hot water heat, or domestic hot water storage tanks?', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'] },
  { id: 22, text: 'Are there community septic tanks to hold the wastewater from the residences?',                                                       category: 'Services',     type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { id: 23, text: 'Is there a biodigester system in place?',                                                                                            category: 'Services',     type: 'textarea', propertyTypes: ['Common Septic Field'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Apartment / Townhouse / Commercial  (IDs 24–60, subs 117–183)
// ─────────────────────────────────────────────────────────────────────────────
const APARTMENT_TOWNHOUSE_COMMERCIAL: QuestionDef[] = [
  { id: 24, text: 'When was the last time you completed any work on the exterior siding? This includes painting the building.',                              category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 117, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 118, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 25, text: 'If you have brick or stone veneer, when was the last time you completed any work?',                                                      category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 119, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 120, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 26, text: 'When was the last time you completed any work on the building envelope?',                                                                category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 121, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 122, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 27, text: 'When was the last time you completed any work on the windows?',                                                                          category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 123, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 124, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 28, text: 'When was the last time you completed any work on the sliding doors?',                                                                    category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 125, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 126, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 29, text: 'If you have balconies, when was the last time you completed any work?',                                                                  category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 127, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 128, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 30, text: 'When was the last time you completed any work on the front door(s)?',                                                                    category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 129, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 130, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 31, text: 'When was the last time you completed any work on the enter phone or security system?',                                                   category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 131, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 132, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 32, text: 'When was the last time you completed any work on the garage door, or the motor?',                                                        category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 133, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 134, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 33, text: 'When was the last time you completed any work on the roof?',                                                                             category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 135, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 136, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 34, text: 'When was the last time you completed any work on the skylights, if any?',                                                                category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 137, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 138, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 35, text: 'When was the last time you replaced the metal flashing?',                                                                                category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 139, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 140, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 36, text: 'Did you replace the roof access hatch during the re-roofing project or independently?',                                                  category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 141, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 142, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 37, text: 'Are the attic areas in the townhomes common area (if any)?',                                                                              category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 143, label: 'a', text: 'When did you do any repair or replacement work on them?', type: 'textarea' }, { id: 256, label: 'b', text: 'How much did you spend?', type: 'textarea' }] },
  { id: 38, text: 'When was the last time you completed any work on the downspouts or gutters?',                                                            category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 144, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 145, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 39, text: 'When was the last time you completed any work on the elevator?',                                                                         category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 146, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 147, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 40, text: 'When was the last time you painted the interior of the building? Please separate the painting in the common rooms from the hallways.',   category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 148, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 149, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 41, text: 'When was the last time you completed any flooring? Please separate the flooring in the common amenity rooms from the hallways.',         category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 150, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 151, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 42, text: 'When was the last time you refreshed the lobby area?',                                                                                   category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 152, label: 'a', text: 'What was the cost?', type: 'textarea' }] },
  { id: 43, text: 'When was the last time you completed any work on the interior lights?',                                                                  category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 153, label: 'a', text: 'What was the cost?', type: 'textarea' }] },
  { id: 44, text: 'When was the last time you completed any work on the interior furniture?',                                                               category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 154, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 155, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 45, text: 'Are any of the service doors in need of work, and have any of them been replaced?',                                                      category: 'Interior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 156, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 157, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 46, text: 'When did you last replace or do work on the boiler for hydronic heat (if any)? Hydronic heat is water-based baseboard heat.',            category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 158, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 159, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 47, text: 'When did you last replace the boiler for domestic hot water heat (if any)? Bathrooms and kitchens.',                                     category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 160, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 161, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 48, text: 'When did you last replace the domestic hot water storage tanks (if any)?',                                                               category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 162, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 163, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 49, text: 'When did you install the expansion tanks (if any)?',                                                                                     category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 164, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 165, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 50, text: 'When was the last time you completed any work on the water, sanitary or sewer systems, or the sump pump?',                               category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 166, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 167, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 51, text: 'When was the last time you completed any work on the rooftop HVAC or Make-up air system?',                                               category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 168, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 169, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 52, text: 'When was the last time you completed any work on the parking exhaust system, fans, or gas monitors, if you have them?',                  category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 170, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 171, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 53, text: 'When was the last time you completed any work on the fire panel or emergency alarm system?',                                             category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 172, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 173, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 54, text: 'When was the last time you completed any work on the irrigation system?',                                                                category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 174, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 175, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 55, text: 'When was the last time you completed any repair or replacement work on the landscaping, exterior lighting or internal roadways, driveways or parkade ramps?', category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 176, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 177, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 56, text: 'When was the last time you completed any repair or replacement work on the security gate, or the motor?',                                category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 178, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 179, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 57, text: 'When was the last time you completed any work on the fences? Do you share costs for the maintenance of fences, etc.?',                   category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 180, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 181, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 58, text: 'When was the last time you completed any repair or replacement work on the loading doors, or the motor?',                                category: 'Exterior', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'], subQuestions: [{ id: 182, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 183, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 59, text: 'Has anything been replaced in the past few years that is not included in the above questions?',                                          category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
  { id: 60, text: 'Are you planning any work in the future around the items discussed above?',                                                              category: 'Services', type: 'textarea', propertyTypes: ['Apartments', 'Townhomes', 'Mixed-Use: Commercial'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Amenity Area or Clubhouse (Interiors)  (IDs 61–72, subs 184–198)
// ─────────────────────────────────────────────────────────────────────────────
const AMENITY_CLUBHOUSE_INTERIOR: QuestionDef[] = [
  { id: 61, text: 'Is there an Amenity Room (including Guest Suites)?',                                                                                          category: 'Amenity Room', type: 'boolean',  propertyTypes: ['Amenity Room'] },
  { id: 62, text: 'When was the last time you painted the interior of the amenity areas?',                                                                       category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: [{ id: 184, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 185, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 63, text: 'When was the last time you completed any flooring in the interior of the amenity areas?',                                                     category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: [{ id: 186, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 187, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 64, text: 'When was the last time you completed any repair or replacement work on the interior lights?',                                                 category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: [{ id: 188, label: 'a', text: 'What was the cost?', type: 'textarea' }] },
  { id: 65, text: 'Are any of the services doors in need of work, and have any of them been replaced?',                                                          category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: [{ id: 189, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 190, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 66, text: 'When was the last time you completed any repair or replacement work on the amenity rooms not discussed above? Please specify the specific rooms.', category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: [{ id: 191, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 192, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 67, text: 'What is the history of the Furniture and Equipment and the Common Rooms and Areas?',                                                          category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'] },
  { id: 68, text: 'When did you last replace or do work on the boiler for hydronic heat (if one)? Hydronic heat is water-based baseboard heat.',                 category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: [{ id: 193, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 194, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 69, text: 'When did you last replace the boiler for domestic hot water heat (if one)? Bathrooms and kitchen.',                                           category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: [{ id: 195, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 196, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 70, text: 'When did you last replace the domestic hot water storage tanks (if one)?',                                                                    category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'], subQuestions: [{ id: 197, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 198, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 71, text: 'Has anything been replaced in the amenities area during the past few years that is not included in the above questions?',                     category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'] },
  { id: 72, text: 'Are you planning any repair or replacement work in the future around the items discussed above?',                                             category: 'Amenity Room', type: 'textarea', propertyTypes: ['Amenity Room'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Clubhouse (Exterior) – Separate Building  (IDs 73–82, subs 199–218)
// ─────────────────────────────────────────────────────────────────────────────
const CLUBHOUSE_EXTERIOR: QuestionDef[] = [
  { id: 73, text: 'When was the last time you completed any repair or replacement work on the exterior siding? This includes painting the buildings.',          category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: [{ id: 199, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 200, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 74, text: 'If you have brick or stone veneer, when was the last time you completed any repair or replacement work?',                                    category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: [{ id: 201, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 202, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 75, text: 'When was the last time you completed any repair or replacement work on the building envelope? What was done?',                               category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: [{ id: 203, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 204, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 76, text: 'When was the last time you completed any repair or replacement work on the windows?',                                                        category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: [{ id: 205, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 206, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 77, text: 'When was the last time you completed any repair or replacement work on the sliding doors?',                                                  category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: [{ id: 207, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 208, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 78, text: 'When was the last time you completed any repair or replacement work on the front doors?',                                                    category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: [{ id: 209, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 210, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 79, text: 'When was the last time you completed any repair or replacement work on the roof?',                                                           category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: [{ id: 211, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 212, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 80, text: 'When was the clubhouse roof last replaced?',                                                                                                category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: [{ id: 213, label: 'a', text: 'Who was the installer?', type: 'textarea' }, { id: 214, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 81, text: 'When was the last time you completed any repair or replacement work on the skylights, if any?',                                              category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: [{ id: 215, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 216, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 82, text: 'When was the last time you replaced the flashing?',                                                                                         category: 'Clubhouse', type: 'textarea', propertyTypes: ['Clubhouse'], subQuestions: [{ id: 217, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 218, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Common Septic Field  (IDs 83–94, subs 219–226)
// ─────────────────────────────────────────────────────────────────────────────
const COMMON_SEPTIC_FIELD: QuestionDef[] = [
  { id: 83, text: 'Is there a Common Septic Field? Please describe the system.',                                                                                                                                                               category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { id: 84, text: 'Are there pumps to carry the wastewater from the residences to the septic tanks? If the pumps are owned by Owners, go to Question 6.',                                                                                       category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { id: 85, text: 'If the pumps are owned by the Strata, how many? Have they been replaced?',                                                                                                                                                  category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'], subQuestions: [{ id: 219, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 220, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 86, text: 'Are the septic tanks on the strata lots? If so, proceed to Question 6.',                                                                                                                                                    category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { id: 87, text: 'Are there community septic tanks to hold the wastewater from the residences? If so, how many? Please describe the system and recent work completed.',                                                                        category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { id: 88, text: 'How many pumps are there to carry the wastewater from the septic tanks to the community septic field distribution (holding) tanks or biodigester system (if applicable)? Have they been replaced?',                         category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'], subQuestions: [{ id: 221, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 222, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 89, text: 'Is there a biodigester system in place? If No, go to Question 8. If Yes, please describe the system and recent work completed.',                                                                                            category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { id: 90, text: 'How many pumps are there to carry the wastewater from the biodigester to the distribution (holding) tanks? Have they been replaced?',                                                                                       category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'], subQuestions: [{ id: 223, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 224, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 91, text: 'How many septic tanks hold the wastewater from the biodigester to the community septic field distribution (holding) tanks? If so, how many? Please describe the system and recent work completed.',                         category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { id: 92, text: 'Is the community Septic Tank original from construction? Has it been replaced?',                                                                                                                                            category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'], subQuestions: [{ id: 225, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 226, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 93, text: 'Does the Septic System have Pumps to move the wastewater from community septic field distribution (holding) tanks to the district sewer system? Please describe costs and history.',                                        category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
  { id: 94, text: 'Are you planning any work in the future with the Septic System?',                                                                                                                                                           category: 'Septic Fields', type: 'textarea', propertyTypes: ['Common Septic Field'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Bare Land Complex  (IDs 95–102, subs 227–236)
// ─────────────────────────────────────────────────────────────────────────────
const BARE_LAND: QuestionDef[] = [
  { id: 95,  text: 'When was the last time you completed any work on the security system?',                                                                    category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'], subQuestions: [{ id: 227, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 228, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 96,  text: 'When was the last time you completed any repair or replacement work on the security gate, or the motor?',                                  category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'], subQuestions: [{ id: 229, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 230, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 97,  text: 'When was the last time you completed any repair or replacement work on the water, sanitary or sewer systems, or the sump pump?',           category: 'Services', type: 'textarea', propertyTypes: ['Bare Land'], subQuestions: [{ id: 231, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 232, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 98,  text: 'When was the last time you completed any repair or replacement work on the irrigation system?',                                            category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'], subQuestions: [{ id: 233, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 234, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 99,  text: 'Do you share costs for maintenance of fences, etc.?',                                                                                     category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
  { id: 100, text: 'When was the last time you completed any repair or replacement work on the landscaping, exterior lighting or internal roadways, driveways or parkade ramps?', category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'], subQuestions: [{ id: 235, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 236, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 101, text: 'Are you planning any repair or replacement work in the future around the items discussed above?',                                          category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
  { id: 102, text: 'Has anything been replaced in the past few years that is not included in the above questions?',                                           category: 'Exterior', type: 'textarea', propertyTypes: ['Bare Land'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Industrial Complex  (IDs 103–108, subs 237–244)
// ─────────────────────────────────────────────────────────────────────────────
const INDUSTRIAL: QuestionDef[] = [
  { id: 103, text: 'When was the last time you completed any repair or replacement work on the loading doors, or the motor?',                                   category: 'Exterior', type: 'textarea', propertyTypes: ['Industrial'], subQuestions: [{ id: 237, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 238, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 104, text: 'When was the last time you completed any repair or replacement work on the water, sanitary or sewer systems, or the sump pump?',            category: 'Services', type: 'textarea', propertyTypes: ['Industrial'], subQuestions: [{ id: 239, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 240, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 105, text: 'When was the last time you completed any work on the fire panel or emergency alarm system?',                                                category: 'Services', type: 'textarea', propertyTypes: ['Industrial'], subQuestions: [{ id: 241, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 242, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 106, text: 'Do you share costs for maintenance of fences, etc.?',                                                                                     category: 'Exterior', type: 'textarea', propertyTypes: ['Industrial'] },
  { id: 107, text: 'When was the last time you completed any repair or replacement work on the landscaping, exterior lighting or internal roadways, driveways or parkade ramps?', category: 'Exterior', type: 'textarea', propertyTypes: ['Industrial'], subQuestions: [{ id: 243, label: 'a', text: 'Who was the supplier?', type: 'textarea' }, { id: 244, label: 'b', text: 'What was the cost?', type: 'textarea' }] },
  { id: 108, text: 'Has anything been replaced in the commercial section during the past few years that is not included in the above questions?',               category: 'Exterior', type: 'textarea', propertyTypes: ['Industrial'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Administration  (IDs 109–116)
// ─────────────────────────────────────────────────────────────────────────────
const ADMINISTRATION: QuestionDef[] = [
  { id: 109, text: 'Are there recent Engineers Reports?',                                                                                                       category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { id: 110, text: 'Are there prior Depreciation Reports?',                                                                                                     category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { id: 111, text: 'Are any reports recommending work that will require a specific Levy in the near future?',                                                   category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { id: 112, text: 'Are there any Reciprocal Cost sharing agreements?',                                                                                         category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { id: 113, text: 'Are there lawsuits or arbitration decisions that impact common assets?',                                                                    category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { id: 114, text: 'Does the Strata have an Easement, Legal agreement to provide Services, Air Parcel agreement, or other legal agreements?',                   category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { id: 115, text: 'Are there any alteration agreements where specific owners have taken responsibility of change to common property or attachments/alterations of the building envelope?', category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
  { id: 116, text: 'Has the Strata taken responsibility for a component on/in a strata lot?',                                                                   category: 'Legal', type: 'none_or_explain', propertyTypes: ['Administration'] },
]

// ─────────────────────────────────────────────────────────────────────────────
// NEW standalone sub-questions  (IDs 245–255)
// These reference parent questions already in the lists above.
// ─────────────────────────────────────────────────────────────────────────────
const NEW_SUBS: Array<{
  id: number
  parentId: number
  label: string
  text: string
  category: string
  type: 'textarea'
}> = [
  { id: 245, parentId: 20,  label: 'a', text: 'When did you do any repair or replacement work on them and how much did you spend?', category: 'Exterior',  type: 'textarea' },
  { id: 246, parentId: 40,  label: 'c', text: 'Please separate the painting in the common rooms from the hallways?',               category: 'Interior',  type: 'textarea' },
  { id: 247, parentId: 41,  label: 'c', text: 'Please separate the flooring in the common amenity rooms from the hallways?',       category: 'Interior',  type: 'textarea' },
  { id: 248, parentId: 75,  label: 'a', text: 'What was done?',                                                                    category: 'Clubhouse', type: 'textarea' },
  { id: 249, parentId: 88,  label: 'b', text: 'Have they been replaced?',                                                         category: 'Services',  type: 'textarea' },
  { id: 250, parentId: 22,  label: 'a', text: 'If so, how many?',                                                                  category: 'Services',  type: 'textarea' },
  { id: 251, parentId: 22,  label: 'b', text: 'Please describe the system and recent work completed?',                             category: 'Services',  type: 'textarea' },
  { id: 252, parentId: 46,  label: 'a', text: 'Have they been replaced?',                                                         category: 'Services',  type: 'textarea' },
  { id: 253, parentId: 23,  label: 'a', text: 'If Yes, please describe the system and recent work completed?',                     category: 'Services',  type: 'textarea' },
  { id: 254, parentId: 23,  label: 'b', text: 'How many pumps and septic tanks are involved?',                                     category: 'Services',  type: 'textarea' },
  { id: 255, parentId: 46,  label: 'a', text: 'Has it been replaced?',                                                             category: 'Services',  type: 'textarea' },
]

const ALL_QUESTIONS = [
  ...SEPTIC_FIELDS_NEW,
  ...CLUBHOUSE_NEW,
  ...AMENITY_LEGAL_COUNCIL_NEW,
  ...MISC_NEW_PARENTS,
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
  'Bare Land',
  'Industrial',
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

  // ─── Wipe existing questions 1-255 to ensure a clean slate ───────────────
  console.log('Clearing existing questions (IDs 1-255) to prevent conflicts...')
  const idsToClear = Array.from({ length: 255 }, (_, i) => i + 1)

  // Sub-questions of parents we're about to delete (even if their own IDs are > 255)
  const subQs = await prisma.question.findMany({
    where: { parentQuestionId: { in: idsToClear } },
    select: { questionId: true },
  })
  const allQIdsToDelete = [...new Set([...idsToClear, ...subQs.map(q => q.questionId)])]

  if (allQIdsToDelete.length > 0) {
    // 1. Delete associated responses
    await prisma.questionResponse.deleteMany({ where: { questionId: { in: allQIdsToDelete } } })
    // 2. Delete questionService links
    await prisma.questionService.deleteMany({ where: { questionId: { in: allQIdsToDelete } } })
    
    // 3. Delete sub-questions (self-referential)
    await prisma.question.deleteMany({ 
      where: { 
        questionId: { in: allQIdsToDelete },
        parentQuestionId: { not: null }
      } 
    })
    
    // 4. Delete the remaining questions (parents)
    await prisma.question.deleteMany({ 
      where: { questionId: { in: allQIdsToDelete } } 
    })
  }
  console.log(`  Cleared previous questions in the 1-255 range.\n`)

  console.log('Creating questions...')
  let created = 0
  let subCreated = 0

  // ─── Create parent questions + their inline sub-questions ──────────────────
  for (let i = 0; i < ALL_QUESTIONS.length; i++) {
    const q = ALL_QUESTIONS[i]
    const questionTypeId = qtMap.get(q.type)
    if (!questionTypeId) {
      console.error(`  Question type "${q.type}" not found, skipping: ${q.text.slice(0, 50)}...`)
      continue
    }

    const actualNames = new Set<string>()
    for (const tg of q.propertyTypes) {
      const mapped = TEMPLATE_TO_PROPERTY_TYPES[tg]
      if (mapped) mapped.forEach(n => actualNames.add(n))
    }
    const propertyTypeIds = [...actualNames]
      .map(name => ptMap.get(name))
      .filter((id): id is number => id !== undefined)

    // Create the parent question with an explicit questionId
    const parent = await prisma.question.create({
      data: {
        questionId: q.id,
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

    // Create inline sub-questions with explicit IDs
    if (q.subQuestions && q.subQuestions.length > 0) {
      const textareaTypeId = qtMap.get('textarea')
      for (const sub of q.subQuestions) {
        const subTypeId = qtMap.get(sub.type) ?? textareaTypeId
        if (!subTypeId) continue

        await prisma.question.create({
          data: {
            questionId: sub.id,
            questionText: sub.text,
            subLabel: sub.label,
            parentQuestionId: parent.questionId,
            isRequired: true,
            questionCategory: q.category,
            questionTypeId: subTypeId,
            ...(propertyTypeIds.length > 0
              ? { questionPropertyTypes: { create: propertyTypeIds.map(id => ({ propertyTypeId: id })) } }
              : {}),
          }
        })
        subCreated++
      }
    }
  }

  // ─── Create new standalone sub-questions (IDs 245–255) ────────────────────
  console.log('\nCreating new standalone sub-questions (245–255)...')
  const textareaTypeId = qtMap.get('textarea')
  if (textareaTypeId) {
    for (const sub of NEW_SUBS) {
      // Inherit property types from parent
      const parentQ = await prisma.question.findUnique({
        where: { questionId: sub.parentId },
        include: { questionPropertyTypes: true },
      })
      const parentPropTypeIds = parentQ?.questionPropertyTypes.map(pt => pt.propertyTypeId) ?? []

      await prisma.question.create({
        data: {
          questionId: sub.id,
          questionText: sub.text,
          subLabel: sub.label,
          parentQuestionId: sub.parentId,
          isRequired: true,
          questionCategory: sub.category,
          questionTypeId: textareaTypeId,
          ...(parentPropTypeIds.length > 0
            ? { questionPropertyTypes: { create: parentPropTypeIds.map(id => ({ propertyTypeId: id })) } }
            : {}),
        }
      })
      subCreated++
    }
  }

  // ─── Reset sequence so future inserts start after 255 ─────────────────────
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('question', 'question_id'), 255, true)`
  )

  const virtualTypes = ['Amenity Room', 'Clubhouse', 'Common Septic Field', 'Administration']
  for (const name of virtualTypes) {
    const pt = await prisma.propertyType.findUnique({ where: { propertyTypeName: name } })
    if (!pt) continue
    await prisma.strataPropertyType.deleteMany({ where: { propertyTypeId: pt.propertyTypeId } })
    await prisma.questionPropertyType.deleteMany({ where: { propertyTypeId: pt.propertyTypeId } })
    await prisma.propertyType.delete({ where: { propertyTypeId: pt.propertyTypeId } })
    console.log(`  Removed fake property type: ${name}`)
  }

  console.log(`\n  Parent questions created: ${created}`)
  console.log(`  Sub-questions created:    ${subCreated}`)
  console.log(`  Total: ${created + subCreated}`)
  console.log(`  IDs:   1–255 (gapless)\n`)
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
