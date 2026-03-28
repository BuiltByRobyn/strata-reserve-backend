/*
  Blocks same-day appointments for the same inspector when both are physical (on-site)
  inspections in different regions with insufficient time between them.
  Draft meetings are virtual — they do not participate in this geographic constraint.
*/

const FULL_DAY_INSPECTION_TYPE_NAME = 'Full Day Inspection';

// Minimum hours between end of one physical visit and start of another when regions differ.
export const MIN_HOURS_BETWEEN_DIFFERENT_REGION_PHYSICAL = 4;

const SLOT_WINDOWS: Record<string, { startHour: number; endHour: number }> = {
  '10:00': { startHour: 10, endHour: 14 },
  '14:00': { startHour: 14, endHour: 18 },
  '19:00': { startHour: 19, endHour: 20 },
};

function normalize(v?: string | null) {
  return (v || '').trim().toLowerCase();
}

function isFullDayInspection(appointmentType: {
  typeName: string | null;
  durationType: string | null;
}): boolean {
  return (
    normalize(appointmentType.durationType) === 'full day' ||
    normalize(appointmentType.typeName) === normalize(FULL_DAY_INSPECTION_TYPE_NAME)
  );
}

// Time window in minutes from midnight for physical on-site presence. Null = not a physical visit (e.g. draft).
export function getPhysicalTimeWindowMinutes(
  appointmentType: { isDraftMeeting: boolean; typeName: string | null; durationType: string | null },
  slotTime: string
): { startMin: number; endMin: number } | null {
  if (appointmentType.isDraftMeeting) return null;
  if (isFullDayInspection(appointmentType) && slotTime === '10:00') {
    return { startMin: 10 * 60, endMin: 18 * 60 };
  }
  const w = SLOT_WINDOWS[slotTime];
  if (!w) {
    const h = parseInt(slotTime.split(':')[0] || '9', 10);
    return { startMin: h * 60, endMin: (h + 4) * 60 };
  }
  return { startMin: w.startHour * 60, endMin: w.endHour * 60 };
}

function intervalsConflictDifferentRegion(
  locA: string,
  locB: string,
  windowA: { startMin: number; endMin: number },
  windowB: { startMin: number; endMin: number }
): boolean {
  if (locA === locB) return false;
  const [first, second] =
    windowA.startMin <= windowB.startMin ? [windowA, windowB] : [windowB, windowA];
  if (first.endMin > second.startMin) return true;
  const gapHours = (second.startMin - first.endMin) / 60;
  return gapHours < MIN_HOURS_BETWEEN_DIFFERENT_REGION_PHYSICAL;
}

function collectInspectorIdsForRow(
  inspectorProfileId: string | null,
  secondInspectorId: string | null | undefined
): string[] {
  const ids = [inspectorProfileId, secondInspectorId].filter((id): id is string => !!id);
  return [...new Set(ids)];
}

const crossRegionError = (a: string, b: string) =>
  new Error(
    `Stratas must be located in the same region for same day appointments. Please change inspector, or select a different day. (Except for draft meetings.)`
  );

import type { PrismaClient } from '@prisma/client';

// Prisma client or interactive transaction client
type Db = Pick<
  PrismaClient,
  'appointment' | 'appointmentType' | 'appointmentTimeSlot' | 'fileNumber'
>;

/*
  Ensures no inspector assigned to this appointment would overlap insufficiently with another
  physical inspection in a different strata region on the same calendar day.
*/
export async function assertNoInspectorSameDayCrossRegionConflict(
  db: Db,
  params: {
    appointmentDate: Date;
    timeSlotId: number;
    appointmentTypeId: number;
    fileId: number;
    /** Primary and second inspector (deduped); empty skips check */
    inspectorProfileIds: string[];
    excludeAppointmentId?: number;
  }
): Promise<void> {
  const { appointmentDate, timeSlotId, appointmentTypeId, fileId, excludeAppointmentId } = params;
  const inspectorProfileIds = [...new Set(params.inspectorProfileIds.filter(Boolean))];
  if (inspectorProfileIds.length === 0) return;

  const [appointmentType, timeSlot, fileRow] = await Promise.all([
    db.appointmentType.findUnique({
      where: { appointmentTypeId },
      select: { isDraftMeeting: true, typeName: true, durationType: true },
    }),
    db.appointmentTimeSlot.findUnique({
      where: { timeSlotId },
      select: { slotTime: true },
    }),
    db.fileNumber.findUnique({
      where: { fileId },
      select: {
        strata: { select: { location: { select: { locationCode: true, locationName: true } } } },
      },
    }),
  ]);

  if (!appointmentType || !timeSlot) return;
  if (appointmentType.isDraftMeeting) return;

  const newLocCode = fileRow?.strata?.location?.locationCode ?? null;
  const newLocLabel =
    fileRow?.strata?.location?.locationName || newLocCode || 'unknown region';
  const newWindow = getPhysicalTimeWindowMinutes(appointmentType, timeSlot.slotTime);
  if (!newWindow) return;

  const day = new Date(appointmentDate);
  day.setUTCHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const sameDay = await db.appointment.findMany({
    where: {
      appointmentDate: { gte: day, lt: nextDay },
      status: { not: 'Cancelled' },
      ...(excludeAppointmentId ? { appointmentId: { not: excludeAppointmentId } } : {}),
    },
    select: {
      appointmentId: true,
      inspectorProfileId: true,
      appointmentType: { select: { isDraftMeeting: true, typeName: true, durationType: true } },
      timeSlot: { select: { slotTime: true } },
      fileNumber: {
        select: {
          appointmentOfferSecondInspectorId: true,
          strata: { select: { location: { select: { locationCode: true, locationName: true } } } },
        },
      },
    },
  });

  for (const other of sameDay) {
    const otherInspectors = collectInspectorIdsForRow(
      other.inspectorProfileId,
      other.fileNumber.appointmentOfferSecondInspectorId
    );
    const shared = inspectorProfileIds.filter((id) => otherInspectors.includes(id));
    if (shared.length === 0) continue;

    if (other.appointmentType.isDraftMeeting) continue;

    const otherWindow = getPhysicalTimeWindowMinutes(
      other.appointmentType,
      other.timeSlot.slotTime
    );
    if (!otherWindow) continue;

    const otherLocCode = other.fileNumber.strata?.location?.locationCode ?? null;
    const otherLocLabel =
      other.fileNumber.strata?.location?.locationName || otherLocCode || 'unknown region';

    if (!newLocCode || !otherLocCode) continue;

    if (
      intervalsConflictDifferentRegion(newLocCode, otherLocCode, newWindow, otherWindow)
    ) {
      throw crossRegionError(newLocLabel, otherLocLabel);
    }
  }
}
