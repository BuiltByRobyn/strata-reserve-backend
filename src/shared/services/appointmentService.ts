import prisma from '../lib/prismaClient';

export const getAppointments = async () => {
  return prisma.appointment.findMany({
    orderBy: { appointmentDate: 'desc' },
    include: {
      appointmentType: {
        select: { appointmentTypeId: true, typeName: true, durationType: true }
      },
      timeSlot: {
        select: { timeSlotId: true, slotTime: true, slotName: true }
      },
      serviceRequest: {
        select: {
          serviceRequestId: true,
          strata: {
            select: { strataId: true, complexName: true, strataPlan: true }
          },
          service: {
            select: { serviceId: true, serviceName: true }
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

export const cancelAppointment = async (id: number) => {
  return prisma.appointment.update({
    where: { appointmentId: id },
    data: { status: 'Cancelled' }
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
  timeSlotId: number
) => {
  return prisma.appointment.update({
    where: { appointmentId: id },
    data: {
      appointmentDate,
      timeSlotId,
      status: 'Rescheduled'
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
