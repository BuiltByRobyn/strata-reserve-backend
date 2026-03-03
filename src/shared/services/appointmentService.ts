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
      serviceRequest: {
        select: {
          serviceRequestId: true,
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
      serviceRequest: {
        include: {
          strata: {
            include: {
              company: { select: { companyId: true, companyName: true } }
            }
          },
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
  const updateData: { status: string; completionNote?: string; completedAt?: Date } = { status };

  if (status === 'Completed') {
    updateData.completedAt = new Date();
    if (completionNote) {
      updateData.completionNote = completionNote;
    }
  }

  return prisma.appointment.update({
    where: { appointmentId: id },
    data: updateData
  });
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
  options?: { inspectorProfileId?: string; reason?: string }
) => {
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
      serviceRequest: {
        select: {
          serviceRequestId: true,
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
      serviceRequest: {
        select: {
          serviceRequestId: true,
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
          serviceRequestId: request.serviceRequestId,
          appointmentTypeId: request.appointmentTypeId,
          appointmentRequestId: request.appointmentRequestId,
          inspectorProfileId: data.inspectorProfileId || null,
        }
      });

      await tx.serviceRequest.update({
        where: { serviceRequestId: request.serviceRequestId },
        data: { status: 'Appointment Scheduled' }
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
