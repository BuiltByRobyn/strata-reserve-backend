import prisma from '../lib/prismaClient';
import { isWeekend, formatDateStr } from '../helpers/dateUtils';
import type { AvailableSlot, AvailableDay } from '../types/appointment.types';

const SLOT_REQUIREMENTS: Record<string, { startHour: number; endHour: number; durationHours: number }> = {
  '10:00': { startHour: 10, endHour: 14, durationHours: 4 },
  '14:00': { startHour: 14, endHour: 18, durationHours: 4 },
  '19:00': { startHour: 19, endHour: 20, durationHours: 1 },
};

function inspectorCoversSlot(
  startTime: string | null,
  endTime: string | null,
  slotTime: string
): boolean {
  const req = SLOT_REQUIREMENTS[slotTime];
  if (!req) return false;

  if (!startTime || !endTime) return true;

  const parseHour = (t: string) => {
    const parts = t.split(':');
    return parseInt(parts[0], 10) + parseInt(parts[1] || '0', 10) / 60;
  };

  const availStart = parseHour(startTime);
  const availEnd = parseHour(endTime);

  return availStart <= req.startHour && availEnd >= req.endHour;
}

export async function getAvailableSlots(
  startDate: string,
  endDate: string,
  fileId: number,
  isDraftMeeting = false
): Promise<AvailableDay[]> {
  const sr = await prisma.fileNumber.findUnique({
    where: { fileId: fileId },
    include: {
      strata: {
        include: { location: true }
      }
    }
  });
  if (!sr) throw new Error('Service request not found');

  const locationCode = isDraftMeeting ? 'Virtual' : sr.strata.location?.locationCode;

  const assignedInspectorIds: string[] = [];
  if (!isDraftMeeting) {
    if (sr.appointmentOfferInspectorId) assignedInspectorIds.push(sr.appointmentOfferInspectorId);
    if (sr.appointmentOfferSecondInspectorId) assignedInspectorIds.push(sr.appointmentOfferSecondInspectorId);
  }

  const start = new Date(startDate + 'T00:00:00Z');
  const end = new Date(endDate + 'T00:00:00Z');

  const holidays = await prisma.companyHoliday.findMany();
  const holidayDates = new Set<string>();
  for (const h of holidays) {
    const hDate = formatDateStr(h.holidayDate);
    if (h.isRecurringAnnually) {
      const mmdd = hDate.slice(5);
      for (let y = start.getUTCFullYear(); y <= end.getUTCFullYear(); y++) {
        holidayDates.add(`${y}-${mmdd}`);
      }
    } else {
      holidayDates.add(hDate);
    }
  }

  const timeSlots = await prisma.appointmentTimeSlot.findMany({
    orderBy: { slotTime: 'asc' }
  });

  const availabilityRecords = await prisma.inspectorAvailableDate.findMany({
    where: {
      availableStartDate: { lte: end },
      availableEndDate: { gte: start },
      ...(locationCode ? {
        OR: [
          { locations: { some: { locationCode } } },
          { locations: { none: {} } }
        ]
      } : {}),
      ...(assignedInspectorIds.length > 0 ? {
        inspectorProfileId: { in: assignedInspectorIds }
      } : {})
    },
    include: {
      inspectorProfile: { select: { id: true } },
      locations: { select: { locationCode: true } }
    }
  });

  if (availabilityRecords.length === 0 && process.env.NODE_ENV === 'development') {
    console.warn('[Availability] No inspector availability records found for', {
      fileId,
      locationCode,
      dateRange: { startDate, endDate },
      assignedInspectorIds,
    });
  }

  const existingAppointments = await prisma.appointment.findMany({
    where: {
      appointmentDate: { gte: start, lte: end },
      status: { not: 'Cancelled' }
    },
    select: {
      appointmentDate: true,
      timeSlotId: true,
      inspectorProfileId: true,
    }
  });

  const pendingRequests = await prisma.appointmentRequest.findMany({
    where: {
      status: 'Pending Review',
      OR: [
        { firstChoiceDate: { gte: start, lte: end } },
        { secondChoiceDate: { gte: start, lte: end } },
      ]
    },
    select: {
      firstChoiceDate: true,
      secondChoiceDate: true,
      firstChoiceTimeSlotId: true,
      secondChoiceTimeSlotId: true,
    }
  });

  const heldSlots = new Set<string>();
  for (const req of pendingRequests) {
    heldSlots.add(`${formatDateStr(req.firstChoiceDate)}_${req.firstChoiceTimeSlotId}`);
    if (req.secondChoiceDate && req.secondChoiceTimeSlotId) {
      heldSlots.add(`${formatDateStr(req.secondChoiceDate)}_${req.secondChoiceTimeSlotId}`);
    }
  }

  const inspectorBookedSlots = new Map<string, Set<string>>();
  for (const apt of existingAppointments) {
    const dateStr = formatDateStr(apt.appointmentDate);
    if (apt.inspectorProfileId) {
      const key = apt.inspectorProfileId;
      if (!inspectorBookedSlots.has(key)) inspectorBookedSlots.set(key, new Set());
      inspectorBookedSlots.get(key)!.add(`${dateStr}_${apt.timeSlotId}`);
    }
  }

  const results: AvailableDay[] = [];
  const today = formatDateStr(new Date());

  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const dateStr = formatDateStr(d);

    if (dateStr <= today) continue;
    if (isWeekend(d)) continue;
    if (holidayDates.has(dateStr)) continue;

    const dayAvailability = availabilityRecords.filter(a => {
      const aStart = formatDateStr(a.availableStartDate);
      const aEnd = formatDateStr(a.availableEndDate);
      return dateStr >= aStart && dateStr <= aEnd;
    });

    if (dayAvailability.length === 0) continue;

    const availableSlots: AvailableSlot[] = [];

    for (const slot of timeSlots) {
      if (!isDraftMeeting && slot.slotTime === '19:00') continue;

      const slotKey = `${dateStr}_${slot.timeSlotId}`;
      if (heldSlots.has(slotKey)) continue;

      const inspectorCanCoverSlot = (inspId: string) => {
        const inspAvail = dayAvailability.filter(a => a.inspectorProfile.id === inspId);
        if (inspAvail.length === 0) return false;

        return inspAvail.some(a => {
          const startTime = a.availableStartTime
            ? a.availableStartTime.toISOString().slice(11, 16)
            : null;
          const endTime = a.availableEndTime
            ? a.availableEndTime.toISOString().slice(11, 16)
            : null;
          if (!inspectorCoversSlot(startTime, endTime, slot.slotTime)) return false;
          const inspBookings = inspectorBookedSlots.get(inspId);
          if (inspBookings?.has(`${dateStr}_${slot.timeSlotId}`)) return false;
          return true;
        });
      };

      let slotAvailable: boolean;
      if (assignedInspectorIds.length > 0) {
        // All assigned inspectors must be available for this slot
        slotAvailable = assignedInspectorIds.every(id => inspectorCanCoverSlot(id));
      } else {
        // No specific inspector assigned — any available inspector works
        slotAvailable = dayAvailability.some(a => {
          const startTime = a.availableStartTime
            ? a.availableStartTime.toISOString().slice(11, 16)
            : null;
          const endTime = a.availableEndTime
            ? a.availableEndTime.toISOString().slice(11, 16)
            : null;
          if (!inspectorCoversSlot(startTime, endTime, slot.slotTime)) return false;
          const inspId = a.inspectorProfile.id;
          const inspBookings = inspectorBookedSlots.get(inspId);
          if (inspBookings?.has(`${dateStr}_${slot.timeSlotId}`)) return false;
          return true;
        });
      }

      if (slotAvailable) {
        availableSlots.push({
          timeSlotId: slot.timeSlotId,
          slotTime: slot.slotTime,
          slotName: slot.slotName,
        });
      }
    }

    if (availableSlots.length > 0) {
      results.push({ date: dateStr, slots: availableSlots });
    }
  }

  return results;
}

export async function isDraftMeetingEligible(fileId: number): Promise<boolean> {
  const [completedInspection, fn] = await Promise.all([
    prisma.appointment.findFirst({
      where: { fileId: fileId, status: 'Completed', appointmentType: { isDraftMeeting: false } }
    }),
    prisma.fileNumber.findUnique({
      where: { fileId: fileId },
      include: { appointmentOfferType: { select: { isDraftMeeting: true } } }
    })
  ]);
  return !!completedInspection || !!fn?.appointmentOfferType?.isDraftMeeting;
}
