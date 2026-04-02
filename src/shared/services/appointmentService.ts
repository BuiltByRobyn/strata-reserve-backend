import prisma from '../lib/prismaClient';
import { sendMeetingStatusUpdateEmail, sendFileCompletionEmail, sendAdminAppointmentCancelledEmail } from '../lib/emailService';
import { canInspectorTakeSlot } from './availabilityCalculationService';

const FULL_DAY_INSPECTION_TYPE_NAME = 'Full Day Inspection';
const FULL_DAY_INSPECTION_REQUIRED_SLOT_TIME = '10:00';
const DRAFT_MEETING_REQUIRED_SLOT_TIME = '19:00';

const fullDayInspectionSlotError = () =>
  new Error(
    'Full Day Inspection appointments must begin at 10:00 AM'
  );

const draftMeetingSlotError = () =>
  new Error('Draft Meeting appointments are only available at 7:00 PM.');

const schedulingConflictError = () =>
  new Error(
    'A conflicting appointment is already scheduled for this date. Please choose a different timeslot.'
  );

const normalize = (v?: string | null) => (v || '').trim().toLowerCase();

function isFullDay(appointmentType: { durationType?: string | null; typeName?: string | null }): boolean {
  return normalize(appointmentType.durationType) === 'full day' ||
    normalize(appointmentType.typeName) === normalize(FULL_DAY_INSPECTION_TYPE_NAME);
}

async function assertAppointmentTypeTimeSlot(appointmentTypeId: number, timeSlotId: number) {
  const [appointmentType, timeSlot] = await Promise.all([
    prisma.appointmentType.findUnique({
      where: { appointmentTypeId },
      select: { typeName: true, isDraftMeeting: true },
    }),
    prisma.appointmentTimeSlot.findUnique({
      where: { timeSlotId },
      select: { slotTime: true },
    }),
  ]);
  if (!appointmentType || !timeSlot) return;
  if (appointmentType.isDraftMeeting && timeSlot.slotTime !== DRAFT_MEETING_REQUIRED_SLOT_TIME) {
    throw draftMeetingSlotError();
  }
  if (
    appointmentType.typeName === FULL_DAY_INSPECTION_TYPE_NAME &&
    timeSlot.slotTime !== FULL_DAY_INSPECTION_REQUIRED_SLOT_TIME
  ) {
    throw fullDayInspectionSlotError();
  }
}

/**
 * Per-inspector scheduling conflict check at appointment creation/approval/reschedule time.
 * Ensures each inspector can take the proposed slot given their existing appointments.
 */
async function assertNoInspectorSchedulingConflict(
  db: any,
  params: {
    appointmentTypeId: number;
    appointmentDate: Date;
    timeSlotId: number;
    fileId: number;
    inspectorProfileIds: string[];
    excludeAppointmentId?: number;
  }
) {
  const { appointmentTypeId, appointmentDate, timeSlotId, fileId, excludeAppointmentId } = params;
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
      select: { strata: { select: { location: { select: { locationCode: true } } } } },
    }),
  ]);

  if (!appointmentType || !timeSlot) return;

  const newIsDraft = appointmentType.isDraftMeeting === true;
  const newIsFullDay = isFullDay(appointmentType);
  const newLocationCode = fileRow?.strata?.location?.locationCode ?? null;

  const day = new Date(appointmentDate);
  day.setUTCHours(0, 0, 0, 0);
  const nextDay = new Date(day);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const sameDayAppointments = await db.appointment.findMany({
    where: {
      appointmentDate: { gte: day, lt: nextDay },
      status: { not: 'Cancelled' },
      ...(excludeAppointmentId ? { appointmentId: { not: excludeAppointmentId } } : {}),
    },
    select: {
      inspectorProfileId: true,
      timeSlot: { select: { slotTime: true } },
      appointmentType: { select: { isDraftMeeting: true, durationType: true, typeName: true } },
      fileNumber: {
        select: {
          appointmentOfferSecondInspectorId: true,
          strata: { select: { location: { select: { locationCode: true } } } },
        },
      },
    },
  });

  // For each inspector, build their day's existing appointments and validate
  for (const inspId of inspectorProfileIds) {
    const existing = sameDayAppointments
      .filter((a: any) => {
        const aptInspectors = [a.inspectorProfileId, a.fileNumber?.appointmentOfferSecondInspectorId]
          .filter(Boolean);
        return aptInspectors.includes(inspId);
      })
      .map((a: any) => ({
        slotTime: a.timeSlot.slotTime as string,
        isDraftMeeting: a.appointmentType.isDraftMeeting === true,
        isFullDay: isFullDay(a.appointmentType),
        locationCode: (a.fileNumber?.strata?.location?.locationCode ?? null) as string | null,
      }));

    if (!canInspectorTakeSlot(existing, timeSlot.slotTime, newIsDraft, newIsFullDay, newIsDraft ? null : newLocationCode)) {
      throw schedulingConflictError();
    }
  }
}

export const getAppointments = async (inspectorProfileId?: string) => {
  return prisma.appointment.findMany({
    where: inspectorProfileId ? { inspectorProfileId } : undefined,
    orderBy: { appointmentDate: 'desc' },
    include: {
      appointmentType: {
        select: { appointmentTypeId: true, typeName: true, durationType: true, isDraftMeeting: true }
      },
      timeSlot: {
        select: { timeSlotId: true, slotTime: true, slotName: true }
      },
      fileNumber: {
        select: {
          fileId: true,
          strata: {
            select: { strataId: true, complexName: true, strataPlan: true, town: true, location: { select: { locationId: true, locationName: true } } }
          },
          service: {
            select: { serviceId: true, serviceName: true }
          },
          appointmentOfferSecondInspector: {
            select: { id: true, firstName: true, lastName: true, displayName: true }
          }
        }
      },
      inspector: {
        select: { id: true, firstName: true, lastName: true, displayName: true }
      }
    }
  });
};

export const getRecentCancellations = async (hoursAgo: number) => {
  const since = new Date();
  since.setHours(since.getHours() - hoursAgo);

  return prisma.appointment.findMany({
    where: {
      status: 'Cancelled',
      cancelledAt: { gte: since },
    },
    orderBy: { cancelledAt: 'desc' },
    select: {
      appointmentId: true,
      appointmentDate: true,
      cancellationReason: true,
      cancelledAt: true,
      appointmentType: { select: { typeName: true } },
      fileNumber: {
        select: {
          fileId: true,
          fileNumber: true,
          strata: { select: { complexName: true, strataPlan: true } },
        },
      },
    },
  });
};

export const getAppointmentById = async (id: number) => {
  return prisma.appointment.findUnique({
    where: { appointmentId: id },
    include: {
      appointmentType: true,
      timeSlot: true,
      fileNumber: {
        include: {
          strata: true,
          service: true,
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, displayName: true, email: true }
          }
        }
      },
      appointmentRequest: {
        include: {
          firstChoiceTimeSlot: true,
          secondChoiceTimeSlot: true,
          appointmentReviews: {
            include: {
              reviewStatus: true,
              reviewedBy: {
                select: { id: true, firstName: true, lastName: true, displayName: true }
              }
            }
          }
        }
      },
      inspector: {
        select: { id: true, firstName: true, lastName: true, displayName: true, email: true, phoneNumber: true }
      }
    }
  });
};

export const updateAppointmentStatus = async (id: number, status: string, completionNote?: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId: id },
    select: {
      fileId: true,
      inspectorProfileId: true,
      appointmentType: { select: { isDraftMeeting: true } },
      fileNumber: {
        select: {
          fileNumber: true,
          strata: { select: { strataPlan: true } },
          requestedBy: { select: { email: true } },
        },
      },
    },
  });

  const updateData: { status: string; completionNote?: string; completedAt?: Date } = { status };
  if (status === 'Completed') {
    updateData.completedAt = new Date();
    if (completionNote) updateData.completionNote = completionNote;
  }

  const updated = await prisma.appointment.update({
    where: { appointmentId: id },
    data: updateData,
  });

  if (status === 'Completed' && appointment) {
    if (!appointment.appointmentType.isDraftMeeting && appointment.inspectorProfileId) {
      await prisma.fileNumber.update({
        where: { fileId: appointment.fileId },
        data: { appointmentOfferInspectorId: appointment.inspectorProfileId },
      });
    }

    if (appointment.appointmentType.isDraftMeeting && appointment.fileNumber?.requestedBy?.email) {
      sendFileCompletionEmail({
        to: appointment.fileNumber.requestedBy.email,
        strataNumber: appointment.fileNumber.strata?.strataPlan || '',
        completedDate: new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
      }).catch((err) => console.error('Failed to send file completion email:', err));
    }
  }

  return updated;
};

export const cancelAppointment = async (id: number, reason?: string) => {
  const appointment = await prisma.appointment.findUnique({
    where: { appointmentId: id },
    select: {
      appointmentDate: true,
      timeSlot: { select: { slotName: true } },
      appointmentType: { select: { typeName: true } },
      fileNumber: {
        select: {
          fileNumber: true,
          strata: { select: { strataId: true, strataPlan: true, complexName: true } },
          requestedBy: { select: { firstName: true, lastName: true, displayName: true, email: true } },
        },
      },
    },
  });

  const updated = await prisma.appointment.update({
    where: { appointmentId: id },
    data: {
      status: 'Cancelled',
      cancellationReason: reason ?? null,
      cancelledAt: new Date(),
    }
  });

  await prisma.fileNumber.update({
    where: { fileId: updated.fileId },
    data: { rebookingRequestedAt: new Date() }
  });

  if (appointment) {
    const { fileNumber, appointmentType, appointmentDate, timeSlot } = appointment;
    const client = fileNumber?.requestedBy;
    sendAdminAppointmentCancelledEmail({
      fileNumber: fileNumber?.fileNumber || '',
      strataNumber: fileNumber?.strata?.strataPlan || '',
      propertyAddress: fileNumber?.strata?.complexName || fileNumber?.strata?.strataPlan || '',
      clientName: client?.displayName || [client?.firstName, client?.lastName].filter(Boolean).join(' ') || 'Unknown',
      clientEmail: client?.email || '',
      appointmentType: appointmentType?.typeName || '',
      appointmentDate: appointmentDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }),
      appointmentTime: timeSlot?.slotName || '',
      cancelledAt: new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
      cancellationReason: reason || 'No reason provided',
    }).catch((err) => console.error('Failed to send admin appointment cancelled email:', err));

    const strataId = fileNumber?.strata?.strataId;
    if (strataId) {
      prisma.strataProfile.findFirst({
        where: { strataId, profile: { userTypeId: 3 } },
        select: { profile: { select: { email: true } } },
      }).then((clientStrataProfile) => {
        const clientEmail = clientStrataProfile?.profile?.email;
        if (clientEmail) {
          const meetingType = appointmentType?.typeName || 'Appointment';
          sendMeetingStatusUpdateEmail({
            to: clientEmail,
            strataNumber: fileNumber?.strata?.strataPlan || '',
            meetingType,
            status: 'Rejected',
          }).catch((err) => console.error('Failed to send client appointment cancelled email:', err));
        }
      }).catch((err) => console.error('Failed to fetch client profile for cancellation email:', err));
    }
  }

  return updated;
};

export const assignInspector = async (id: number, inspectorProfileId: string) => {
  return prisma.appointment.update({
    where: { appointmentId: id },
    data: { inspectorProfileId }
  });
};

export const rescheduleAppointment = async (
  id: number,
  appointmentDate: Date,
  timeSlotId: number,
  options?: { inspectorProfileId?: string; secondInspectorProfileId?: string; reason?: string }
) => {
  const [aptInfo, newTimeSlot] = await Promise.all([
    prisma.appointment.findUnique({
      where: { appointmentId: id },
      select: {
        fileId: true,
        appointmentId: true,
        appointmentTypeId: true,
        inspectorProfileId: true,
        appointmentType: { select: { typeName: true, isDraftMeeting: true } },
        fileNumber: {
          select: {
            fileNumber: true,
            appointmentOfferSecondInspectorId: true,
            requestedBy: { select: { email: true } },
            strata: { select: { strataPlan: true } },
          },
        },
      },
    }),
    prisma.appointmentTimeSlot.findUnique({
      where: { timeSlotId },
      select: { slotName: true, slotTime: true },
    }),
  ]);

  if (aptInfo?.appointmentType?.isDraftMeeting && newTimeSlot?.slotTime !== DRAFT_MEETING_REQUIRED_SLOT_TIME) {
    throw draftMeetingSlotError();
  }
  if (
    aptInfo?.appointmentType?.typeName === FULL_DAY_INSPECTION_TYPE_NAME &&
    newTimeSlot?.slotTime !== FULL_DAY_INSPECTION_REQUIRED_SLOT_TIME
  ) {
    throw fullDayInspectionSlotError();
  }
  if (aptInfo?.fileId && aptInfo?.appointmentId && aptInfo?.appointmentTypeId) {
    const primaryInspector =
      options?.inspectorProfileId !== undefined ? options.inspectorProfileId : aptInfo.inspectorProfileId;
    const secondInspector =
      options?.secondInspectorProfileId !== undefined
        ? options.secondInspectorProfileId
        : aptInfo.fileNumber?.appointmentOfferSecondInspectorId;
    const rescheduleInspectorIds = [primaryInspector, secondInspector].filter((id): id is string => !!id);
    if (rescheduleInspectorIds.length > 0) {
      await assertNoInspectorSchedulingConflict(prisma, {
        appointmentTypeId: aptInfo.appointmentTypeId,
        appointmentDate,
        timeSlotId,
        fileId: aptInfo.fileId,
        inspectorProfileIds: [...new Set(rescheduleInspectorIds)],
        excludeAppointmentId: aptInfo.appointmentId,
      });
    }
  }

  if (aptInfo?.fileId && options?.secondInspectorProfileId !== undefined) {
    await prisma.fileNumber.update({
      where: { fileId: aptInfo.fileId },
      data: { appointmentOfferSecondInspectorId: options.secondInspectorProfileId || null },
    });
  }

  const updated = await prisma.appointment.update({
    where: { appointmentId: id },
    data: {
      appointmentDate,
      timeSlotId,
      status: 'Rescheduled',
      inspectorProfileId: options?.inspectorProfileId !== undefined ? options.inspectorProfileId : undefined,
      rescheduleReason: options?.reason ?? null,
    }
  });

  const email = aptInfo?.fileNumber?.requestedBy?.email;
  if (email) {
    const meetingType = aptInfo?.appointmentType?.isDraftMeeting ? 'Draft Meeting' : 'Inspection';
    sendMeetingStatusUpdateEmail({
      to: email,
      strataNumber: aptInfo?.fileNumber?.strata?.strataPlan || '',
      meetingType,
      status: 'Rescheduled',
      meetingDate: appointmentDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
      meetingTime: newTimeSlot?.slotName || newTimeSlot?.slotTime || undefined,
    }).catch((err) => console.error('Failed to send rescheduled email:', err));
  }

  return updated;
};

export const requestRebooking = async (appointmentId: number) => {
  const apt = await prisma.appointment.findUnique({
    where: { appointmentId },
    select: { fileId: true, status: true }
  });
  if (!apt) throw new Error('Appointment not found');
  if (apt.status !== 'Cancelled') throw new Error('Only cancelled appointments can request rebooking');

  await prisma.fileNumber.update({
    where: { fileId: apt.fileId },
    data: { rebookingRequestedAt: new Date() }
  });
  return { success: true };
};

export const getAppointmentRequests = async (status?: string) => {
  return prisma.appointmentRequest.findMany({
    where: status ? { status } : undefined,
    orderBy: { requestDate: 'desc' },
    include: {
      appointmentType: true,
      firstChoiceTimeSlot: true,
      secondChoiceTimeSlot: true,
      requestedBy: {
        select: { id: true, firstName: true, lastName: true, displayName: true, email: true }
      },
      fileNumber: {
        select: {
          fileId: true,
          status: true,
          requestDate: true,
          strata: {
            select: { strataId: true, complexName: true, strataPlan: true, town: true, location: { select: { locationId: true, locationName: true } } }
          },
          service: {
            select: { serviceId: true, serviceName: true }
          },
          requestedBy: {
            select: { id: true, firstName: true, lastName: true, displayName: true }
          },
          appointmentOfferInspector: {
            select: { id: true, firstName: true, lastName: true, displayName: true }
          },
          appointmentOfferSecondInspector: {
            select: { id: true, firstName: true, lastName: true, displayName: true }
          },
        }
      }
    }
  });
};

export const getAppointmentRequestById = async (id: number) => {
  return prisma.appointmentRequest.findUnique({
    where: { appointmentRequestId: id },
    include: {
      appointmentType: true,
      firstChoiceTimeSlot: true,
      secondChoiceTimeSlot: true,
      requestedBy: {
        select: { id: true, firstName: true, lastName: true, displayName: true, email: true }
      },
      fileNumber: {
        select: {
          fileId: true,
          status: true,
          strata: {
            select: { strataId: true, complexName: true, strataPlan: true, town: true, location: { select: { locationId: true, locationName: true } } }
          },
          service: {
            select: { serviceId: true, serviceName: true }
          }
        }
      },
      appointmentReviews: {
        include: {
          reviewStatus: true,
          reviewedBy: {
            select: { id: true, firstName: true, lastName: true, displayName: true }
          }
        }
      }
    }
  });
};

export const reviewAppointmentRequest = async (data: {
  appointmentRequestId: number;
  reviewedByProfileId: string;
  approved: boolean;
  approvedDateChoice?: number;
  rejectionReason?: string;
  inspectorProfileId?: string;
  secondInspectorProfileId?: string;
  comments?: string;
}) => {
  const requestInfo = await prisma.appointmentRequest.findUnique({
    where: { appointmentRequestId: data.appointmentRequestId },
    select: {
      firstChoiceDate: true,
      secondChoiceDate: true,
      firstChoiceTimeSlot: { select: { slotName: true, slotTime: true } },
      secondChoiceTimeSlot: { select: { slotName: true, slotTime: true } },
      appointmentType: { select: { typeName: true, isDraftMeeting: true } },
      requestedBy: { select: { email: true } },
      fileNumber: {
        select: { fileNumber: true, strata: { select: { strataPlan: true } } },
      },
    },
  });

  const result = await prisma.$transaction(async (tx) => {
    const request = await tx.appointmentRequest.findUnique({
      where: { appointmentRequestId: data.appointmentRequestId },
      include: {
        firstChoiceTimeSlot: true,
        secondChoiceTimeSlot: true,
      }
    });

    if (!request) throw new Error('Appointment request not found');
    if (request.status !== 'Pending Review') throw new Error('Request was already reviewed');

    const reviewStatus = await tx.reviewStatus.findFirst({
      where: { statusName: data.approved ? 'Approved' : 'Rejected' }
    });

    await tx.appointmentReview.create({
      data: {
        appointmentRequestId: data.appointmentRequestId,
        reviewedByProfileId: data.reviewedByProfileId,
        reviewStatusId: reviewStatus?.reviewStatusId || (data.approved ? 1 : 2),
        approvedDateChoice: data.approved ? (data.approvedDateChoice || 1) : null,
        rejectionReason: data.rejectionReason || null,
        comments: data.comments || null,
      }
    });

    if (data.approved) {
      const choiceNum = data.approvedDateChoice || 1;
      const appointmentDate = choiceNum === 1 ? request.firstChoiceDate : request.secondChoiceDate!;
      const timeSlotId = choiceNum === 1 ? request.firstChoiceTimeSlotId : request.secondChoiceTimeSlotId!;

      const reviewInspectorIds = [data.inspectorProfileId, data.secondInspectorProfileId]
        .filter((id): id is string => !!id);
      if (reviewInspectorIds.length > 0) {
        await assertNoInspectorSchedulingConflict(tx, {
          appointmentTypeId: request.appointmentTypeId,
          appointmentDate,
          timeSlotId,
          fileId: request.fileId,
          inspectorProfileIds: reviewInspectorIds,
        });
      }

      await tx.appointmentRequest.update({
        where: { appointmentRequestId: data.appointmentRequestId },
        data: { status: 'Approved' }
      });

      const appointment = await tx.appointment.create({
        data: {
          appointmentDate,
          timeSlotId,
          status: 'Scheduled',
          fileId: request.fileId,
          appointmentTypeId: request.appointmentTypeId,
          appointmentRequestId: request.appointmentRequestId,
          inspectorProfileId: data.inspectorProfileId || null,
        }
      });

      await tx.fileNumber.update({
        where: { fileId: request.fileId },
        data: {
          status: 'Appointment Scheduled',
          rebookingRequestedAt: null,
          ...(data.secondInspectorProfileId !== undefined && {
            appointmentOfferSecondInspectorId: data.secondInspectorProfileId || null,
          }),
        },
      });

      return appointment;
    } else {
      await tx.appointmentRequest.update({
        where: { appointmentRequestId: data.appointmentRequestId },
        data: { status: 'Rejected' }
      });

      return { rejected: true };
    }
  });

  if (requestInfo?.requestedBy?.email) {
    const choiceNum = data.approvedDateChoice || 1;
    const chosenDate = choiceNum === 1 ? requestInfo.firstChoiceDate : requestInfo.secondChoiceDate;
    const chosenSlot = choiceNum === 1 ? requestInfo.firstChoiceTimeSlot : requestInfo.secondChoiceTimeSlot;
    const meetingType = requestInfo.appointmentType?.isDraftMeeting ? 'Draft Meeting' : 'Inspection';

    sendMeetingStatusUpdateEmail({
      to: requestInfo.requestedBy.email,
      strataNumber: requestInfo.fileNumber?.strata?.strataPlan || '',
      meetingType,
      status: data.approved ? 'Approved' : 'Rejected',
      meetingDate: chosenDate ? chosenDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }) : undefined,
      meetingTime: chosenSlot?.slotName || chosenSlot?.slotTime || undefined,
    }).catch((err) => console.error('Failed to send meeting status email:', err));
  }

  return result;
};

export const createAppointment = async (data: {
  appointmentDate: Date;
  timeSlotId: number;
  fileId: number;
  appointmentTypeId: number;
  inspectorProfileId?: string | null;
  secondInspectorProfileId?: string | null;
}) => {
  // Validate date is not in the past
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (data.appointmentDate < today) {
    throw new Error('Cannot create an appointment in the past. Please choose a future date.');
  }

  await assertAppointmentTypeTimeSlot(data.appointmentTypeId, data.timeSlotId);

  const createInspectorIds = [data.inspectorProfileId, data.secondInspectorProfileId].filter(
    (id): id is string => !!id
  );
  if (createInspectorIds.length > 0) {
    await assertNoInspectorSchedulingConflict(prisma, {
      appointmentTypeId: data.appointmentTypeId,
      appointmentDate: data.appointmentDate,
      timeSlotId: data.timeSlotId,
      fileId: data.fileId,
      inspectorProfileIds: [...new Set(createInspectorIds)],
    });
  }

  // Check for conflicting appointment on same date + slot
  const existing = await prisma.appointment.findFirst({
    where: {
      appointmentDate: data.appointmentDate,
      timeSlotId: data.timeSlotId,
      fileId: data.fileId,
      status: { not: 'Cancelled' },
    },
  });
  if (existing) {
    throw new Error('This time slot is already booked for this strata on the selected date. Please choose a different date or time slot.');
  }

  // Check inspector availability if assigned
  if (data.inspectorProfileId) {
    const inspectorConflict = await prisma.appointment.findFirst({
      where: {
        appointmentDate: data.appointmentDate,
        timeSlotId: data.timeSlotId,
        inspectorProfileId: data.inspectorProfileId,
        status: { not: 'Cancelled' },
      },
    });
    if (inspectorConflict) {
      throw new Error('The selected inspector is already booked for this time slot. Please adjust date, time or staff member.');
    }
  }

  await prisma.fileNumber.update({
    where: { fileId: data.fileId },
    data: {
      rebookingRequestedAt: null,
      ...(data.secondInspectorProfileId !== undefined && {
        appointmentOfferSecondInspectorId: data.secondInspectorProfileId || null,
      }),
    },
  });

  const appointment = await prisma.appointment.create({
    data: {
      appointmentDate: data.appointmentDate,
      timeSlotId: data.timeSlotId,
      fileId: data.fileId,
      appointmentTypeId: data.appointmentTypeId,
      inspectorProfileId: data.inspectorProfileId || null,
      status: 'Scheduled',
    },
    include: {
      appointmentType: { select: { appointmentTypeId: true, typeName: true, durationType: true, isDraftMeeting: true } },
      timeSlot: { select: { timeSlotId: true, slotTime: true, slotName: true } },
      fileNumber: {
        select: {
          fileId: true,
          strata: { select: { strataId: true, complexName: true, strataPlan: true, town: true, location: { select: { locationId: true, locationName: true } } } },
          service: { select: { serviceId: true, serviceName: true } },
          appointmentOfferSecondInspector: { select: { id: true, firstName: true, lastName: true, displayName: true } },
        },
      },
      inspector: { select: { id: true, firstName: true, lastName: true, displayName: true } },
    },
  });

  const strataId = appointment.fileNumber?.strata?.strataId;
  if (strataId) {
    const clientStrataProfile = await prisma.strataProfile.findFirst({
      where: { strataId, profile: { userTypeId: 3 } },
      select: { profile: { select: { email: true } } },
    });
    const clientEmail = clientStrataProfile?.profile?.email;
    if (clientEmail) {
      const meetingType = appointment.appointmentType?.isDraftMeeting ? 'Draft Meeting' : 'Inspection';
      sendMeetingStatusUpdateEmail({
        to: clientEmail,
        strataNumber: appointment.fileNumber?.strata?.strataPlan || '',
        meetingType,
        status: 'Approved',
        meetingDate: data.appointmentDate.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
        meetingTime: appointment.timeSlot?.slotName || appointment.timeSlot?.slotTime || undefined,
      }).catch((err) => console.error('Failed to send new appointment notification email:', err));
    }
  }

  return appointment;
};

export const getTimeSlots = async () => {
  return prisma.appointmentTimeSlot.findMany({
    orderBy: { slotTime: 'asc' }
  });
};

export const getAppointmentTypes = async () => {
  return prisma.appointmentType.findMany({
    include: {
      service: { select: { serviceId: true, serviceName: true } }
    },
    orderBy: { typeName: 'asc' }
  });
};
