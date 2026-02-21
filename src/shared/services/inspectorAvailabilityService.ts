import prisma from '../lib/prismaClient';

const availabilityInclude = {
  inspectorProfile: {
    select: { id: true, firstName: true, lastName: true, displayName: true, email: true, phoneNumber: true }
  },
  locations: { select: { locationCode: true } }
};

export const getAvailableDates = async (inspectorProfileId?: string) => {
  const where = inspectorProfileId ? { inspectorProfileId } : {};

  return prisma.inspectorAvailableDate.findMany({
    where,
    orderBy: { availableStartDate: 'asc' },
    include: availabilityInclude
  });
};

export const getAvailableDateById = async (id: number) => {
  return prisma.inspectorAvailableDate.findUnique({
    where: { inspectorAvailableDateId: id },
    include: availabilityInclude
  });
};

export const createAvailableDate = async (data: {
  availableStartDate: Date;
  availableEndDate: Date;
  availableStartTime?: Date | null;
  availableEndTime?: Date | null;
  inspectorProfileId: string;
  locationCodes?: string[];
}) => {
  return prisma.inspectorAvailableDate.create({
    data: {
      availableStartDate: data.availableStartDate,
      availableEndDate: data.availableEndDate,
      availableStartTime: data.availableStartTime,
      availableEndTime: data.availableEndTime,
      inspectorProfileId: data.inspectorProfileId,
      ...(data.locationCodes?.length ? {
        locations: {
          create: data.locationCodes.map(code => ({ locationCode: code }))
        }
      } : {})
    },
    include: availabilityInclude
  });
};

export const updateAvailableDate = async (
  id: number,
  data: {
    availableStartDate?: Date;
    availableEndDate?: Date;
    availableStartTime?: Date | null;
    availableEndTime?: Date | null;
    locationCodes?: string[];
  }
) => {
  const { locationCodes, ...dateData } = data;

  if (locationCodes !== undefined) {
    await prisma.inspectorAvailableLocation.deleteMany({
      where: { inspectorAvailableDateId: id }
    });
    if (locationCodes.length > 0) {
      await prisma.inspectorAvailableLocation.createMany({
        data: locationCodes.map(code => ({
          inspectorAvailableDateId: id,
          locationCode: code
        }))
      });
    }
  }

  return prisma.inspectorAvailableDate.update({
    where: { inspectorAvailableDateId: id },
    data: dateData,
    include: availabilityInclude
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
  inspectorProfileId?: string,
  locationCodes?: string[]
) => {
  return prisma.inspectorAvailableDate.findMany({
    where: {
      availableStartDate: { lte: endDate },
      availableEndDate: { gte: startDate },
      ...(inspectorProfileId ? { inspectorProfileId } : {}),
      ...(locationCodes?.length ? {
        locations: { some: { locationCode: { in: locationCodes } } }
      } : {})
    },
    orderBy: { availableStartDate: 'asc' },
    include: availabilityInclude
  });
};
