import prisma from '../lib/prismaClient';
import { isWeekend, formatDateStr } from '../helpers/dateUtils';
import type { AvailableSlot, AvailableDay } from '../types/appointment.types';

const SLOT_REQUIREMENTS: Record<string, { startHour: number; endHour: number; durationHours: number }> = {
  '10:00': { startHour: 10, endHour: 14, durationHours: 4 },
  '14:00': { startHour: 14, endHour: 18, durationHours: 4 },
  '18:00': { startHour: 18, endHour: 19, durationHours: 1 },
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
  serviceRequestId: number,
  isDraftMeeting = false
): Promise<AvailableDay[]> {
  const sr = await prisma.serviceRequest.findUnique({
    where: { serviceRequestId },
    include: {
      strata: {
        include: { location: true }
      }
    }
  });
  if (!sr) throw new Error('Service request not found');

  const locationCode = sr.strata.location?.locationCode;

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
        locations: { some: { locationCode } }
      } : {})
    },
    include: {
      inspectorProfile: { select: { id: true } },
      locations: { select: { locationCode: true } }
    }
  });

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

  const bookedSlots = new Set<string>();
  const inspectorBookedDates = new Map<string, Set<string>>();
  for (const apt of existingAppointments) {
    const dateStr = formatDateStr(apt.appointmentDate);
    bookedSlots.add(`${dateStr}_${apt.timeSlotId}`);
    if (apt.inspectorProfileId) {
      const key = apt.inspectorProfileId;
      if (!inspectorBookedDates.has(key)) inspectorBookedDates.set(key, new Set());
      inspectorBookedDates.get(key)!.add(dateStr);
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
      if (isDraftMeeting && slot.slotTime !== '18:00') continue;
      if (!isDraftMeeting && slot.slotTime === '18:00') continue;

      const slotKey = `${dateStr}_${slot.timeSlotId}`;
      if (bookedSlots.has(slotKey)) continue;
      if (heldSlots.has(slotKey)) continue;

      const hasAvailableInspector = dayAvailability.some(a => {
        const startTime = a.availableStartTime
          ? a.availableStartTime.toISOString().slice(11, 16)
          : null;
        const endTime = a.availableEndTime
          ? a.availableEndTime.toISOString().slice(11, 16)
          : null;

        if (!inspectorCoversSlot(startTime, endTime, slot.slotTime)) return false;

        const inspId = a.inspectorProfile.id;
        const inspBookings = inspectorBookedDates.get(inspId);
        if (inspBookings?.has(dateStr)) return false;

        return true;
      });

      if (hasAvailableInspector) {
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

export async function isDraftMeetingEligible(serviceRequestId: number): Promise<boolean> {
  const completedInspection = await prisma.appointment.findFirst({
    where: {
      serviceRequestId,
      status: 'Completed',
      appointmentType: { isDraftMeeting: false }
    }
  });
  return !!completedInspection;
}
