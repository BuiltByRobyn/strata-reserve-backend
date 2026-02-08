import prisma from '../lib/prismaClient';
import type {
  CreateStrataInput,
  UpdateStrataInput,
  CreateStrataProfileInput,
  CreateStrataServiceInput,
  CreateStrataNoteInput
} from '../types/strata.types';

export const getStratas = async () => {
  return prisma.strata.findMany({
    orderBy: { strataPlan: 'asc' },
    include: {
      company: { select: { companyId: true, companyName: true } },
      legalType: { select: { legalTypeId: true, legalTypeName: true } },
      propertyType: { select: { propertyTypeId: true, propertyTypeName: true } },
      _count: {
        select: { strataNotes: true, strataProfiles: true, strataServices: true }
      }
    }
  });
};

export const getStrataById = async (id: number) => {
  return prisma.strata.findUnique({
    where: { strataId: id },
    include: {
      company: true,
      legalType: true,
      propertyType: true,
      strataNotes: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, displayName: true }
          }
        }
      },
      strataProfiles: {
        include: {
          profile: {
            select: { id: true, firstName: true, lastName: true, displayName: true, email: true }
          }
        }
      },
      strataServices: {
        include: {
          service: { select: { serviceId: true, serviceName: true, serviceDescription: true } }
        }
      }
    }
  });
};

export const createStrata = async (data: CreateStrataInput) => {
  return prisma.strata.create({
    data: {
      strataPlan: data.strataPlan,
      complexName: data.complexName,
      unitNumber: data.unitNumber,
      streetName: data.streetName,
      town: data.town,
      province: data.province,
      postalCode: data.postalCode,
      country: data.country || 'Canada',
      website: data.website,
      legalTypeId: data.legalTypeId,
      propertyTypeId: data.propertyTypeId,
      companyId: data.companyId
    }
  });
};

export const updateStrata = async (id: number, data: UpdateStrataInput) => {
  return prisma.strata.update({
    where: { strataId: id },
    data
  });
};

export const deleteStrata = async (id: number) => {
  return prisma.strata.delete({
    where: { strataId: id }
  });
};

export const addStrataNote = async (data: CreateStrataNoteInput) => {
  return prisma.strataNotes.create({
    data: {
      strataId: data.strataId,
      noteMessage: data.noteMessage,
      createdByProfileId: data.createdByProfileId,
      createdByUser: data.createdByUser
    }
  });
};

export const deleteStrataNote = async (noteId: number) => {
  return prisma.strataNotes.delete({
    where: { noteId }
  });
};

export const assignEmployeeToStrata = async (data: CreateStrataProfileInput) => {
  return prisma.strataProfile.create({
    data: {
      strataId: data.strataId,
      profileId: data.profileId,
      strataPosition: data.strataPosition
    }
  });
};

export const updateStrataProfilePosition = async (strataProfileId: number, position: string) => {
  return prisma.strataProfile.update({
    where: { strataProfileId },
    data: { strataPosition: position }
  });
};

export const removeProfileFromStrata = async (strataProfileId: number) => {
  return prisma.strataProfile.delete({
    where: { strataProfileId }
  });
};

export const getStratasByEmployee = async (profileId: string) => {
  return prisma.strataProfile.findMany({
    where: { profileId },
    include: {
      strata: {
        include: {
          company: { select: { companyId: true, companyName: true } }
        }
      }
    }
  });
};

export const addServiceToStrata = async (data: CreateStrataServiceInput) => {
  return prisma.strataService.create({
    data: {
      strataId: data.strataId,
      serviceId: data.serviceId
    }
  });
};

export const removeServiceFromStrata = async (strataServiceId: number) => {
  return prisma.strataService.delete({
    where: { strataServiceId }
  });
};

export const searchStratas = async (query: string) => {
  return prisma.strata.findMany({
    where: {
      OR: [
        { strataPlan: { contains: query, mode: 'insensitive' } },
        { complexName: { contains: query, mode: 'insensitive' } },
        { town: { contains: query, mode: 'insensitive' } }
      ]
    },
    include: {
      company: { select: { companyId: true, companyName: true } }
    },
    orderBy: { strataPlan: 'asc' }
  });
};
