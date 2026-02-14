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
      strataSections: {
        include: { section: true }
      },
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
          },
          strataProfileSections: {
            include: { section: true }
          }
        }
      },
      strataServices: {
        include: {
          service: { select: { serviceId: true, serviceName: true, serviceDescription: true } }
        }
      },
      strataSections: {
        include: { section: true }
      }
    }
  });
};

export const createStrata = async (data: CreateStrataInput) => {
  const { sectionIds, ...strataData } = data;
  return prisma.strata.create({
    data: {
      strataPlan: strataData.strataPlan,
      complexName: strataData.complexName,
      unitNumber: strataData.unitNumber,
      streetName: strataData.streetName,
      town: strataData.town,
      province: strataData.province,
      postalCode: strataData.postalCode,
      country: strataData.country || 'Canada',
      website: strataData.website,
      legalTypeId: strataData.legalTypeId,
      propertyTypeId: strataData.propertyTypeId,
      companyId: strataData.companyId,
      ...(sectionIds?.length ? {
        strataSections: {
          create: sectionIds.map(sectionId => ({ sectionId }))
        }
      } : {})
    },
    include: { strataSections: { include: { section: true } } }
  });
};

export const updateStrata = async (id: number, data: UpdateStrataInput) => {
  const { sectionIds, ...strataData } = data;

  if (sectionIds !== undefined) {
    await prisma.strataSection.deleteMany({ where: { strataId: id } });
    if (sectionIds.length > 0) {
      await prisma.strataSection.createMany({
        data: sectionIds.map(sectionId => ({ strataId: id, sectionId }))
      });
    }
  }

  return prisma.strata.update({
    where: { strataId: id },
    data: strataData,
    include: { strataSections: { include: { section: true } } }
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
  const { sectionIds, ...profileData } = data;
  const strataProfile = await prisma.strataProfile.create({
    data: {
      strataId: profileData.strataId,
      profileId: profileData.profileId,
      strataPosition: profileData.strataPosition
    }
  });

  if (sectionIds?.length) {
    await prisma.strataProfileSection.createMany({
      data: sectionIds.map(sectionId => ({
        strataProfileId: strataProfile.strataProfileId,
        sectionId
      }))
    });
  }

  return strataProfile;
};

export const updateStrataProfileSections = async (strataProfileId: number, sectionIds: number[]) => {
  await prisma.strataProfileSection.deleteMany({ where: { strataProfileId } });
  if (sectionIds.length > 0) {
    await prisma.strataProfileSection.createMany({
      data: sectionIds.map(sectionId => ({ strataProfileId, sectionId }))
    });
  }
};

export const getSectionsByStrataId = async (strataId: number) => {
  const sections = await prisma.strataSection.findMany({
    where: { strataId },
    include: { section: true }
  });
  return sections.map(ss => ss.section);
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
