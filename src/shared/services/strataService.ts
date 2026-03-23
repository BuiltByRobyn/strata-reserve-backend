import prisma from '../lib/prismaClient';
import type {
  CreateStrataInput,
  UpdateStrataInput,
  CreateStrataProfileInput,
  CreateStrataNoteInput
} from '../types/strata.types';

export const getStratas = async () => {
  return prisma.strata.findMany({
    orderBy: { strataPlan: 'asc' },
    include: {
      legalType: { select: { legalTypeId: true, legalTypeName: true } },
      propertyType: { select: { propertyTypeId: true, propertyTypeName: true } },
      location: { select: { locationId: true, locationCode: true, locationName: true } },
      strataSections: {
        include: { section: true }
      },
      strataPropertyTypes: {
        include: { propertyType: { select: { propertyTypeId: true, propertyTypeName: true } } }
      },
      _count: {
        select: {
          strataNotes: true,
          strataProfiles: true,
          fileNumbers: { where: { archived: false } }
        }
      }
    }
  });
};

export const getStrataById = async (id: number) => {
  return prisma.strata.findUnique({
    where: { strataId: id },
    include: {
      legalType: true,
      propertyType: true,
      location: true,
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
      strataSections: {
        include: { section: true }
      },
      strataPropertyTypes: {
        include: { propertyType: { select: { propertyTypeId: true, propertyTypeName: true } } }
      },
      fileNumbers: {
        select: {
          fileNumberDocuments: {
            where: { notes: { not: null } },
            select: {
              fileNumberDocumentId: true,
              notes: true,
              uploadedAt: true,
              fileName: true,
              uploadedBy: {
                select: { id: true, firstName: true, lastName: true, displayName: true }
              }
            },
            orderBy: { uploadedAt: 'desc' }
          }
        }
      }
    }
  });
};

export const createStrata = async (data: CreateStrataInput) => {
  const { sectionIds, propertyTypeIds, fiscalYearEnd, locationId, ...strataData } = data;
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
      companyName: strataData.companyName,
      locationId: locationId !== undefined ? locationId : undefined,
      fiscalYearEnd: fiscalYearEnd ? new Date(fiscalYearEnd.split('T')[0] + 'T00:00:00Z') : fiscalYearEnd === null ? null : undefined,
      ...(sectionIds?.length ? {
        strataSections: {
          create: sectionIds.map(sectionId => ({ sectionId }))
        }
      } : {}),
      ...(propertyTypeIds?.length ? {
        strataPropertyTypes: {
          create: propertyTypeIds.map(propertyTypeId => ({ propertyTypeId }))
        }
      } : {})
    },
    include: {
      strataSections: { include: { section: true } },
      strataPropertyTypes: { include: { propertyType: true } }
    }
  });
};

export const updateStrata = async (id: number, data: UpdateStrataInput) => {
  const { sectionIds, propertyTypeIds, fiscalYearEnd, locationId, ...strataData } = data;
  const fiscalYearEndDate = fiscalYearEnd ? new Date(fiscalYearEnd.split('T')[0] + 'T00:00:00Z') : fiscalYearEnd === null ? null : undefined;

  if (sectionIds !== undefined) {
    await prisma.strataSection.deleteMany({ where: { strataId: id } });
    if (sectionIds.length > 0) {
      await prisma.strataSection.createMany({
        data: sectionIds.map(sectionId => ({ strataId: id, sectionId }))
      });
    }
  }

  if (propertyTypeIds !== undefined) {
    await prisma.strataPropertyType.deleteMany({ where: { strataId: id } });
    if (propertyTypeIds.length > 0) {
      await prisma.strataPropertyType.createMany({
        data: propertyTypeIds.map(propertyTypeId => ({ strataId: id, propertyTypeId }))
      });
    }
    // Sync scalar field
    strataData.propertyTypeId = propertyTypeIds.length > 0 ? propertyTypeIds[0] : null;

    // Cascade: Remove survey and document requirements for this strata's file numbers 
    // that belong to property types no longer associated with the strata.
    if (propertyTypeIds.length === 0) {
      // If all property types removed, remove all related requirements
      await prisma.fileNumberSurveyRequirement.deleteMany({
        where: { fileNumber: { strataId: id } }
      });
      await prisma.fileNumberDocumentRequirement.deleteMany({
        where: { fileNumber: { strataId: id }, propertyTypeId: { not: null } }
      });
    } else {
      // Remove requirements not in the new list
      await prisma.fileNumberSurveyRequirement.deleteMany({
        where: {
          fileNumber: { strataId: id },
          propertyTypeId: { notIn: propertyTypeIds }
        }
      });
      await prisma.fileNumberDocumentRequirement.deleteMany({
        where: {
          fileNumber: { strataId: id },
          propertyTypeId: { notIn: propertyTypeIds, not: null }
        }
      });
    }
  }

  const updated = await prisma.strata.update({
    where: { strataId: id },
    data: {
      ...strataData,
      ...(fiscalYearEndDate !== undefined ? { fiscalYearEnd: fiscalYearEndDate } : {}),
      ...(locationId !== undefined ? { locationId } : {}),
    },
    include: {
      strataSections: { include: { section: true } },
      strataPropertyTypes: { include: { propertyType: true } }
    }
  });

  // Sync fiscalYearEnd to all active FileNumbers for this strata
  if (fiscalYearEndDate !== undefined) {
    await prisma.fileNumber.updateMany({
      where: { strataId: id, archived: false },
      data: { fiscalYearEnd: fiscalYearEndDate ?? null }
    });
  }

  return updated;
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
      strata: true
    }
  });
};



export const getSectionNamesByProfileId = async (profileId: string): Promise<string[]> => {
  const profileSections = await prisma.strataProfileSection.findMany({
    where: { strataProfile: { profileId } },
    include: { section: { select: { sectionName: true } } },
  });
  return profileSections.map((ps) => ps.section.sectionName);
};

export const getPropertyTypeIdsByProfileId = async (profileId: string): Promise<number[]> => {
  const profilePropertyTypes = await prisma.strataProfilePropertyType.findMany({
    where: { strataProfile: { profileId } },
    select: { propertyTypeId: true },
  });
  return profilePropertyTypes.map((pt) => pt.propertyTypeId);
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
      strataPropertyTypes: {
        include: { propertyType: { select: { propertyTypeId: true, propertyTypeName: true } } }
      }
    },
    orderBy: { strataPlan: 'asc' }
  });
};
