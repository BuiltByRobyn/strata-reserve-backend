import prisma from '../lib/prismaClient';

export const getAppointments = async () => {
  return prisma.appointment.findMany({
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
    select: { fileId: true, inspectorProfileId: true, appointmentType: { select: { isDraftMeeting: true } } },
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

  // When a non-draft inspection is manually marked Completed, sync the inspector
  // to FileNumber so the upcoming draft meeting defaults to the same inspector
  if (status === 'Completed' && appointment && !appointment.appointmentType.isDraftMeeting && appointment.inspectorProfileId) {
    await prisma.fileNumber.update({
      where: { fileId: appointment.fileId },
      data: { appointmentOfferInspectorId: appointment.inspectorProfileId },
    });
  }

  return updated;
};

export const cancelAppointment = async (id: number, reason?: string) => {
  return prisma.appointment.update({
    where: { appointmentId: id },
    data: {
      status: 'Cancelled',
      cancellationReason: reason ?? null,
    }
  });
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
  if (options?.secondInspectorProfileId !== undefined) {
    const apt = await prisma.appointment.findUnique({ where: { appointmentId: id }, select: { fileId: true } });
    if (apt) {
      await prisma.fileNumber.update({
        where: { fileId: apt.fileId },
        data: { appointmentOfferSecondInspectorId: options.secondInspectorProfileId || null },
      });
    }
  }

  return prisma.appointment.update({
    where: { appointmentId: id },
    data: {
      appointmentDate,
      timeSlotId,
      status: 'Rescheduled',
      inspectorProfileId: options?.inspectorProfileId !== undefined ? options.inspectorProfileId : undefined,
      rescheduleReason: options?.reason ?? null,
    }
  });
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
  return prisma.$transaction(async (tx) => {
    const request = await tx.appointmentRequest.findUnique({
      where: { appointmentRequestId: data.appointmentRequestId },
      include: {
        firstChoiceTimeSlot: true,
        secondChoiceTimeSlot: true,
      }
    });

    if (!request) throw new Error('Appointment request not found');
    if (request.status !== 'Pending Review') throw new Error('Request is not pending review');

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
      throw new Error('The selected inspector is already booked for this time slot on the selected date. Please choose a different inspector, date, or time slot.');
    }
  }

  if (data.secondInspectorProfileId !== undefined) {
    await prisma.fileNumber.update({
      where: { fileId: data.fileId },
      data: { appointmentOfferSecondInspectorId: data.secondInspectorProfileId || null },
    });
  }

  return prisma.appointment.create({
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
