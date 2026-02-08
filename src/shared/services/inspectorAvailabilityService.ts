import prisma from '../lib/prismaClient';

export const getAvailableDates = async (inspectorProfileId?: string) => {
  const where = inspectorProfileId ? { inspectorProfileId } : {};

  return prisma.inspectorAvailableDate.findMany({
    where,
    orderBy: { availableDate: 'asc' },
    include: {
      inspectorProfile: {
        select: { id: true, firstName: true, lastName: true, displayName: true }
      }
    }
  });
};

export const getAvailableDateById = async (id: number) => {
  return prisma.inspectorAvailableDate.findUnique({
    where: { inspectorAvailableDateId: id },
    include: {
      inspectorProfile: {
        select: { id: true, firstName: true, lastName: true, displayName: true, email: true }
      }
    }
  });
};

export const createAvailableDate = async (data: {
  availableDate: Date;
  availableStartTime?: Date | null;
  availableEndTime?: Date | null;
  inspectorProfileId: string;
}) => {
  return prisma.inspectorAvailableDate.create({
    data: {
      availableDate: data.availableDate,
      availableStartTime: data.availableStartTime,
      availableEndTime: data.availableEndTime,
      inspectorProfileId: data.inspectorProfileId
    },
    include: {
      inspectorProfile: {
        select: { id: true, firstName: true, lastName: true, displayName: true }
      }
    }
  });
};

export const updateAvailableDate = async (
  id: number,
  data: {
    availableDate?: Date;
    availableStartTime?: Date | null;
    availableEndTime?: Date | null;
  }
) => {
  return prisma.inspectorAvailableDate.update({
    where: { inspectorAvailableDateId: id },
    data,
    include: {
      inspectorProfile: {
        select: { id: true, firstName: true, lastName: true, displayName: true }
      }
    }
  });
};

export const deleteAvailableDate = async (id: number) => {
  return prisma.inspectorAvailableDate.delete({
    where: { inspectorAvailableDateId: id }
  });
};

export const getAvailableDatesByRange = async (
  startDate: Date,
  endDate: Date,
  inspectorProfileId?: string
) => {
  const where: {
    availableDate: { gte: Date; lte: Date };
    inspectorProfileId?: string;
  } = {
    availableDate: {
      gte: startDate,
      lte: endDate
    }
  };

  if (inspectorProfileId) {
    where.inspectorProfileId = inspectorProfileId;
  }

  return prisma.inspectorAvailableDate.findMany({
    where,
    orderBy: { availableDate: 'asc' },
    include: {
      inspectorProfile: {
        select: { id: true, firstName: true, lastName: true, displayName: true }
      }
    }
  });
};
