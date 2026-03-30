import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import { isWithin48Hours } from '../../shared/helpers/dateUtils';
import { getAvailableSlots, checkDraftMeetingEligibility } from '../../shared/services/availabilityCalculationService';
import { getActiveByProfile } from '../../shared/services/fileNumberService';
import prisma from '../../shared/lib/prismaClient';
import type { AppointmentNotification } from '../../shared/types/appointment.types';
import { sendFileCompletionEmail, sendAdminAppointmentBookingRequestEmail } from '../../shared/lib/emailService';
import { cancelAppointment as cancelAppointmentService } from '../../shared/services/appointmentService';

export const getAvailability = asyncHandler(async (c) => {
  const user = c.get('user');
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const isDraftMeeting = c.req.query('isDraftMeeting') === 'true';

  if (!startDate || !endDate) {
    return error(c, 'startDate and endDate are required', 400);
  }

  const sr = await getActiveByProfile(user.id);
  if (!sr) return error(c, 'No active file number found', 404);

  const slots = await getAvailableSlots(startDate, endDate, sr.fileId, isDraftMeeting);
  return success(c, slots);
}, 'Failed to fetch availability');

export const createAppointmentRequest = asyncHandler(async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const {
    fileId,
    appointmentTypeId,
    firstChoiceDate,
    firstChoiceTimeSlotId,
    secondChoiceDate,
    secondChoiceTimeSlotId,
    specialRequirements
  } = body;

  if (!fileId || !appointmentTypeId || !firstChoiceDate || !firstChoiceTimeSlotId) {
    return error(c, 'Missing required fields', 400);
  }

  const sr = await prisma.fileNumber.findUnique({
    where: { fileId: parseInt(fileId) }
  });

  if (!sr || !sr.appointmentOfferedAt) {
    return error(c, 'Appointment booking is not currently available for this strata', 400);
  }

  const existingRequest = await prisma.appointmentRequest.findFirst({
    where: {
      fileId: parseInt(fileId),
      status: 'Pending Review'
    }
  });

  if (existingRequest) {
    return error(c, 'A pending appointment request already exists', 400);
  }

  const aptType = await prisma.appointmentType.findUnique({
    where: { appointmentTypeId: parseInt(appointmentTypeId) },
    select: { isDraftMeeting: true }
  });
  const isDraftMeeting = aptType?.isDraftMeeting ?? false;

  let result;
  try {
    result = await prisma.$transaction(async (tx) => {
      const dates = [firstChoiceDate, secondChoiceDate].filter(Boolean) as string[];
      const rangeStart = dates.reduce((a, b) => (a < b ? a : b));
      const rangeEnd = dates.reduce((a, b) => (a > b ? a : b));

      const availability = await getAvailableSlots(
        rangeStart,
        rangeEnd,
        parseInt(fileId),
        isDraftMeeting
      );

      const firstAvailable = availability.find(d =>
        d.date === firstChoiceDate && d.slots.some(s => s.timeSlotId === parseInt(firstChoiceTimeSlotId))
      );

      if (!firstAvailable) {
        throw new Error('Your first choice time slot is no longer available. Please choose a different date or time.');
      }

      if (secondChoiceDate && secondChoiceTimeSlotId) {
        const secondAvailable = availability.find(d =>
          d.date === secondChoiceDate && d.slots.some(s => s.timeSlotId === parseInt(secondChoiceTimeSlotId))
        );
        if (!secondAvailable) {
          throw new Error('Your second choice slot is no longer available. Please choose a different date or time.');
        }
      }

      await tx.fileNumber.update({
        where: { fileId: parseInt(fileId) },
        data: { rebookingRequestedAt: null }
      });

      return tx.appointmentRequest.create({
        data: {
          fileId: parseInt(fileId),
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
  } catch (err: any) {
    if (
      err.message?.includes('is no longer available') ||
      err.message?.includes('Please choose a different')
    ) {
      return error(c, err.message, 400);
    }
    throw err;
  }

  const [profile, fn] = await Promise.all([
    prisma.profile.findUnique({
      where: { id: user.id },
      select: { firstName: true, lastName: true, displayName: true, email: true, phoneNumber: true },
    }),
    prisma.fileNumber.findUnique({
      where: { fileId: parseInt(fileId) },
      select: {
        fileNumber: true,
        strata: { select: { strataPlan: true, complexName: true } },
      },
    }),
  ]);

  sendAdminAppointmentBookingRequestEmail({
    fileNumber: fn?.fileNumber || '',
    strataNumber: fn?.strata?.strataPlan || '',
    propertyAddress: fn?.strata?.complexName || fn?.strata?.strataPlan || '',
    clientName: profile?.displayName || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Unknown',
    clientEmail: profile?.email || '',
    clientPhone: profile?.phoneNumber || 'N/A',
    appointmentType: result.appointmentType.typeName,
    requestedDate1: result.firstChoiceDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
    requestedTime1: result.firstChoiceTimeSlot.slotName,
    requestedDate2: result.secondChoiceDate
      ? result.secondChoiceDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
      : 'N/A',
    requestedTime2: result.secondChoiceTimeSlot?.slotName || 'N/A',
  }).catch((err) => console.error('Failed to send admin appointment booking request email:', err));

  return success(c, result, 201);
}, 'Failed to create appointment request');

export const getActiveAppointment = asyncHandler(async (c) => {
  const user = c.get('user');

  const sr = await getActiveByProfile(user.id);
  if (!sr) return success(c, null);

  const pendingRequest = await prisma.appointmentRequest.findFirst({
    where: {
      fileId: sr.fileId,
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
      fileId: sr.fileId,
      status: { in: ['Scheduled', 'Rescheduled'] }
    },
    include: {
      appointmentType: true,
      timeSlot: true,
      inspector: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      fileNumber: {
        select: {
          appointmentOfferSecondInspector: { select: { id: true, firstName: true, lastName: true, displayName: true } }
        }
      },
    }
  });

  if (appointment) {
    const dateStr = appointment.appointmentDate.toISOString().split('T')[0];
    const [startHour] = appointment.timeSlot.slotTime.split(':').map(Number);
    const isDraft = appointment.appointmentType.isDraftMeeting;
    const isFullDay = appointment.appointmentType.durationType === 'Full Day';
    const endHour = isDraft ? startHour + 1 : isFullDay ? 18 : startHour + 4;
    const appointmentEnd = new Date(
      `${dateStr}T${String(endHour).padStart(2, '0')}:00:00Z`
    );

    if (appointmentEnd < new Date()) {
      await prisma.appointment.update({
        where: { appointmentId: appointment.appointmentId },
        data: { status: 'Completed', completedAt: new Date() }
      });
      // When a non-draft inspection auto-completes, sync the inspector to FileNumber
      // so the upcoming draft meeting defaults to the same inspector
      if (!isDraft && appointment.inspectorProfileId) {
        await prisma.fileNumber.update({
          where: { fileId: appointment.fileId },
          data: { appointmentOfferInspectorId: appointment.inspectorProfileId },
        });
      }
      if (isDraft) {
        const fn = await prisma.fileNumber.findUnique({
          where: { fileId: appointment.fileId },
          select: { strata: { select: { strataPlan: true } }, requestedBy: { select: { email: true } } },
        });
        if (fn?.requestedBy?.email) {
          sendFileCompletionEmail({
            to: fn.requestedBy.email,
            strataNumber: fn.strata?.strataPlan || '',
            completedDate: new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
          }).catch((err) => console.error('Failed to send file completion email:', err));
        }
        return success(c, { type: 'completed_draft' });
      }
      return success(c, null);
    }
    return success(c, { type: 'scheduled', data: appointment });
  }

  const completedDraft = await prisma.appointment.findFirst({
    where: { fileId: sr.fileId, status: 'Completed', appointmentType: { isDraftMeeting: true } },
    select: { appointmentId: true }
  });
  if (completedDraft) return success(c, { type: 'completed_draft' });

  return success(c, null);
}, 'Failed to fetch active appointment');

export const cancelAppointmentRequest = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const user = c.get('user');

  const request = await prisma.appointmentRequest.findUnique({
    where: { appointmentRequestId: id },
    include: {
      fileNumber: {
        select: {
          requestedByProfileId: true,
          strata: { select: { strataProfiles: { where: { profileId: user.id } } } },
        },
      },
    },
  });

  if (!request) return error(c, 'Appointment request not found', 404);

  const isOwner = request.requestedByProfileId === user.id
    || request.fileNumber.requestedByProfileId === user.id
    || (request.fileNumber.strata?.strataProfiles?.length ?? 0) > 0;

  if (!isOwner) return error(c, 'Appointment request not found', 404);

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
      appointmentType: { select: { typeName: true } },
      fileNumber: {
        select: {
          fileNumber: true,
          strata: {
            select: {
              strataPlan: true,
              complexName: true,
              strataProfiles: { where: { profileId: user.id } },
            },
          },
          requestedByProfileId: true,
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

  const body = await c.req.json().catch(() => ({}));
  const reason: string | undefined = typeof body?.reason === 'string' && body.reason.trim() ? body.reason.trim() : undefined;

  const updated = await cancelAppointmentService(id, reason);
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
          fileId: true,
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
    appointment.fileNumber.fileId,
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
  const user = c.get('user');

  const sr = await getActiveByProfile(user.id);
  if (!sr) return error(c, 'No active file number found', 404);

  const result = await checkDraftMeetingEligibility(sr.fileId);
  return success(c, result);
}, 'Failed to check draft meeting eligibility');

export const getNotifications = asyncHandler(async (c) => {
  const user = c.get('user');

  const sr = await getActiveByProfile(user.id);
  if (!sr) return success(c, []);

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [approvedRequests, rejectedRequests, cancelledAppointments, rescheduledAppointments] = await Promise.all([
    prisma.appointmentRequest.findMany({
      where: { fileId: sr.fileId, status: 'Approved', requestDate: { gte: oneWeekAgo } },
      orderBy: { requestDate: 'desc' },
      select: {
        appointmentRequestId: true,
        requestDate: true,
        firstChoiceDate: true,
        firstChoiceTimeSlot: { select: { slotName: true, slotTime: true } }
      }
    }),
    prisma.appointmentRequest.findMany({
      where: { fileId: sr.fileId, status: 'Rejected', requestDate: { gte: oneWeekAgo } },
      orderBy: { requestDate: 'desc' },
      include: {
        appointmentReviews: {
          orderBy: { reviewDate: 'desc' },
          take: 1,
          select: { rejectionReason: true, reviewDate: true }
        },
        firstChoiceTimeSlot: { select: { slotName: true, slotTime: true } }
      }
    }),
    prisma.appointment.findMany({
      where: { fileId: sr.fileId, status: 'Cancelled', appointmentDate: { gte: oneWeekAgo } },
      orderBy: { appointmentDate: 'desc' },
      select: { appointmentId: true, appointmentDate: true, cancellationReason: true }
    }),
    prisma.appointment.findMany({
      where: { fileId: sr.fileId, status: 'Rescheduled', appointmentDate: { gte: oneWeekAgo } },
      orderBy: { appointmentDate: 'desc' },
      select: { appointmentId: true, appointmentDate: true, rescheduleReason: true, timeSlot: { select: { slotTime: true, slotName: true } } }
    }),
  ]);

  const formatSlotTime = (time: string): string => {
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return m === 0 ? `${hour12} ${period}` : `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
  };

  const notifications: AppointmentNotification[] = [
    ...approvedRequests.map(r => {
      const dateLabel = r.firstChoiceDate
        ? new Date(r.firstChoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
        : null;
      const timeLabel = r.firstChoiceTimeSlot?.slotTime ? formatSlotTime(r.firstChoiceTimeSlot.slotTime) : null;
      const detail = dateLabel && timeLabel ? ` for ${dateLabel} at ${timeLabel}` : dateLabel ? ` for ${dateLabel}` : '';
      return {
        type: 'request_approved' as const,
        message: `Your appointment request${detail} was approved.`,
        reason: null,
        date: r.requestDate.toISOString()
      };
    }),
    ...rejectedRequests.map(r => {
      const dateLabel = r.firstChoiceDate
        ? new Date(r.firstChoiceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
        : null;
      const timeLabel = r.firstChoiceTimeSlot?.slotTime ? formatSlotTime(r.firstChoiceTimeSlot.slotTime) : null;
      const detail = dateLabel && timeLabel ? ` for ${dateLabel} at ${timeLabel}` : dateLabel ? ` for ${dateLabel}` : '';
      return {
        type: 'request_rejected' as const,
        message: `Your appointment request${detail} was rejected.`,
        reason: r.appointmentReviews[0]?.rejectionReason ?? null,
        date: (r.appointmentReviews[0]?.reviewDate ?? r.requestDate).toISOString()
      };
    }),
    ...cancelledAppointments.map(a => ({
      type: 'appointment_cancelled' as const,
      message: 'Your appointment was cancelled.',
      reason: a.cancellationReason,
      date: a.appointmentDate.toISOString()
    })),
    ...rescheduledAppointments.map(a => ({
      type: 'appointment_rescheduled' as const,
      message: 'Your appointment has been rescheduled.',
      reason: a.rescheduleReason,
      date: a.appointmentDate.toISOString(),
      previousDate: a.appointmentDate.toISOString().split('T')[0],
      previousSlotTime: a.timeSlot.slotTime,
      previousSlotName: a.timeSlot.slotName,
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const seen = new Set<string>();
  const deduped = notifications.filter((n) => {
    if (seen.has(n.type)) return false;
    seen.add(n.type);
    return true;
  });

  return success(c, deduped);
}, 'Failed to fetch notifications');
