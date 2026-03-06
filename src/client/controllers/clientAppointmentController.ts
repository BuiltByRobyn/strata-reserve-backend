import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import { isWithin48Hours } from '../../shared/helpers/dateUtils';
import { getAvailableSlots, isDraftMeetingEligible } from '../../shared/services/availabilityCalculationService';
import prisma from '../../shared/lib/prismaClient';

export const getAvailability = asyncHandler(async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const fileNumberId = c.req.query('fileNumberId');
  const isDraftMeeting = c.req.query('isDraftMeeting') === 'true';

  if (!startDate || !endDate || !fileNumberId) {
    return error(c, 'startDate, endDate, and fileNumberId are required', 400);
  }

  const slots = await getAvailableSlots(startDate, endDate, parseInt(fileNumberId), isDraftMeeting);
  return success(c, slots);
}, 'Failed to fetch availability');

export const createAppointmentRequest = asyncHandler(async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const {
    fileNumberId,
    appointmentTypeId,
    firstChoiceDate,
    firstChoiceTimeSlotId,
    secondChoiceDate,
    secondChoiceTimeSlotId,
    specialRequirements
  } = body;

  if (!fileNumberId || !appointmentTypeId || !firstChoiceDate || !firstChoiceTimeSlotId) {
    return error(c, 'Missing required fields', 400);
  }

  const sr = await prisma.fileNumber.findUnique({
    where: { fileNumberId: parseInt(fileNumberId) }
  });

  if (!sr || !sr.appointmentOfferedAt) {
    return error(c, 'Appointment has not been offered for this file number', 400);
  }

  const existingRequest = await prisma.appointmentRequest.findFirst({
    where: {
      fileNumberId: parseInt(fileNumberId),
      status: 'Pending Review'
    }
  });

  if (existingRequest) {
    return error(c, 'A pending appointment request already exists', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    const availability = await getAvailableSlots(
      firstChoiceDate,
      secondChoiceDate || firstChoiceDate,
      parseInt(fileNumberId),
      false
    );

    const firstAvailable = availability.find(d =>
      d.date === firstChoiceDate && d.slots.some(s => s.timeSlotId === parseInt(firstChoiceTimeSlotId))
    );

    if (!firstAvailable) {
      throw new Error('First choice slot is no longer available');
    }

    if (secondChoiceDate && secondChoiceTimeSlotId) {
      const secondAvailable = availability.find(d =>
        d.date === secondChoiceDate && d.slots.some(s => s.timeSlotId === parseInt(secondChoiceTimeSlotId))
      );
      if (!secondAvailable) {
        throw new Error('Second choice slot is no longer available');
      }
    }

    // Clear rebooking reminder flag when client books a new appointment
    await tx.fileNumber.update({
      where: { fileNumberId: parseInt(fileNumberId) },
      data: { rebookingRequestedAt: null }
    });

    return tx.appointmentRequest.create({
      data: {
        fileNumberId: parseInt(fileNumberId),
        appointmentTypeId: parseInt(appointmentTypeId),
        firstChoiceDate: new Date(firstChoiceDate + 'T00:00:00Z'),
        firstChoiceTimeSlotId: parseInt(firstChoiceTimeSlotId),
        secondChoiceDate: secondChoiceDate ? new Date(secondChoiceDate + 'T00:00:00Z') : null,
        secondChoiceTimeSlotId: secondChoiceTimeSlotId ? parseInt(secondChoiceTimeSlotId) : null,
        specialRequirements: specialRequirements?.trim() || null,
        status: 'Pending Review',
        requestedByProfileId: user.id,
      },
      include: {
        firstChoiceTimeSlot: true,
        secondChoiceTimeSlot: true,
        appointmentType: true,
      }
    });
  });

  return success(c, result, 201);
}, 'Failed to create appointment request');

export const getActiveAppointment = asyncHandler(async (c) => {
  const user = c.get('user');

  const sr = await prisma.fileNumber.findFirst({
    where: {
      archived: false,
      OR: [
        { strata: { strataProfiles: { some: { profileId: user.id } } } },
        { requestedByProfileId: user.id }
      ]
    },
    select: { fileNumberId: true }
  });

  if (!sr) return success(c, null);

  const pendingRequest = await prisma.appointmentRequest.findFirst({
    where: {
      fileNumberId: sr.fileNumberId,
      status: 'Pending Review'
    },
    include: {
      firstChoiceTimeSlot: true,
      secondChoiceTimeSlot: true,
      appointmentType: true,
    }
  });

  if (pendingRequest) {
    return success(c, { type: 'pending_request', data: pendingRequest });
  }

  const appointment = await prisma.appointment.findFirst({
    where: {
      fileNumberId: sr.fileNumberId,
      status: { in: ['Scheduled', 'Rescheduled'] }
    },
    include: {
      appointmentType: true,
      timeSlot: true,
      inspector: { select: { id: true, firstName: true, lastName: true, displayName: true } },
    }
  });

  if (appointment) {
    return success(c, { type: 'scheduled', data: appointment });
  }

  return success(c, null);
}, 'Failed to fetch active appointment');

export const cancelAppointmentRequest = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const user = c.get('user');

  const request = await prisma.appointmentRequest.findUnique({
    where: { appointmentRequestId: id }
  });

  if (!request || request.requestedByProfileId !== user.id) {
    return error(c, 'Appointment request not found', 404);
  }

  if (request.status !== 'Pending Review') {
    return error(c, 'Only pending requests can be cancelled', 400);
  }

  const updated = await prisma.appointmentRequest.update({
    where: { appointmentRequestId: id },
    data: { status: 'Cancelled' }
  });

  return success(c, updated);
}, 'Failed to cancel appointment request');

export const cancelAppointment = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const user = c.get('user');

  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId: id },
    include: {
      timeSlot: true,
      fileNumber: {
        select: {
          strata: { select: { strataProfiles: { where: { profileId: user.id } } } },
          requestedByProfileId: true
        }
      }
    }
  });

  if (!appointment) return error(c, 'Appointment not found', 404);

  const isOwner = appointment.fileNumber.requestedByProfileId === user.id
    || appointment.fileNumber.strata.strataProfiles.length > 0;

  if (!isOwner) return error(c, 'Unauthorized', 403);

  if (isWithin48Hours(appointment.appointmentDate.toISOString(), appointment.timeSlot.slotTime)) {
    return error(c, 'Cannot cancel within 48 hours of the appointment. Please call SRP at (604) 638-4960.', 400);
  }

  const updated = await prisma.appointment.update({
    where: { appointmentId: id },
    data: { status: 'Cancelled' }
  });

  return success(c, updated);
}, 'Failed to cancel appointment');

export const rescheduleAppointment = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const user = c.get('user');
  const body = await c.req.json();

  const { newDate, newTimeSlotId } = body;
  if (!newDate || !newTimeSlotId) {
    return error(c, 'newDate and newTimeSlotId are required', 400);
  }

  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId: id },
    include: {
      timeSlot: true,
      fileNumber: {
        select: {
          fileNumberId: true,
          strata: { select: { strataProfiles: { where: { profileId: user.id } } } },
          requestedByProfileId: true
        }
      }
    }
  });

  if (!appointment) return error(c, 'Appointment not found', 404);

  const isOwner = appointment.fileNumber.requestedByProfileId === user.id
    || appointment.fileNumber.strata.strataProfiles.length > 0;

  if (!isOwner) return error(c, 'Unauthorized', 403);

  if (isWithin48Hours(appointment.appointmentDate.toISOString(), appointment.timeSlot.slotTime)) {
    return error(c, 'Cannot reschedule within 48 hours of the appointment. Please call SRP at (604) 638-4960.', 400);
  }

  const availability = await getAvailableSlots(
    newDate, newDate,
    appointment.fileNumber.fileNumberId,
    false
  );

  const slotAvailable = availability.some(d =>
    d.date === newDate && d.slots.some(s => s.timeSlotId === parseInt(newTimeSlotId))
  );

  if (!slotAvailable) {
    return error(c, 'Selected slot is no longer available', 400);
  }

  const updated = await prisma.appointment.update({
    where: { appointmentId: id },
    data: {
      appointmentDate: new Date(newDate + 'T00:00:00Z'),
      timeSlotId: parseInt(newTimeSlotId),
      status: 'Rescheduled'
    }
  });

  return success(c, updated);
}, 'Failed to reschedule appointment');

export const getDraftMeetingEligibility = asyncHandler(async (c) => {
  const fileNumberId = c.req.query('fileNumberId');
  if (!fileNumberId) {
    return error(c, 'fileNumberId is required', 400);
  }

  const eligible = await isDraftMeetingEligible(parseInt(fileNumberId));
  return success(c, { eligible });
}, 'Failed to check draft meeting eligibility');
