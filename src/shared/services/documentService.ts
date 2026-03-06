import prisma from '../lib/prismaClient';
import { documentInclude, documentIncludeCompact } from '../constants/prismaIncludes';

const getVisibleSectionIdsForProfile = async (profileId: string): Promise<number[]> => {
  const profileSections = await prisma.strataProfileSection.findMany({
    where: { strataProfile: { profileId } },
    select: { sectionId: true },
  });
  return profileSections.map((s) => s.sectionId);
};

const sectionVisibilityWhere = (sectionIds: number[]) => {
  return sectionIds.length
    ? { OR: [{ sectionId: null }, { sectionId: { in: sectionIds } }] }
    : {};
};

export const getDocuments = async () => {
  return prisma.fileNumberDocument.findMany({
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
};

export const getDocumentById = async (id: number) => {
  return prisma.fileNumberDocument.findUnique({
    where: { fileNumberDocumentId: id },
    include: documentInclude
  });
};

export const getDocumentsByFileNumber = async (fileNumberId: number) => {
  return prisma.fileNumberDocument.findMany({
    where: { fileNumberId },
    orderBy: { uploadedAt: 'desc' },
    include: documentIncludeCompact
  });
};

export const updateDocumentStatus = async (id: number, reviewStatusId: number, notes?: string) => {
  return prisma.fileNumberDocument.update({
    where: { fileNumberDocumentId: id },
    data: {
      reviewStatusId,
      ...(notes !== undefined ? { notes } : {})
    },
    include: {
      reviewStatus: { select: { reviewStatusId: true, statusName: true } }
    }
  });
};

export const clearDocumentNotes = async (id: number) => {
  return prisma.fileNumberDocument.update({
    where: { fileNumberDocumentId: id },
    data: { notes: null }
  });
};

export const deleteDocument = async (id: number) => {
  return prisma.fileNumberDocument.delete({
    where: { fileNumberDocumentId: id }
  });
};

export const searchDocuments = async (query: string) => {
  return prisma.fileNumberDocument.findMany({
    where: {
      OR: [
        { fileName: { contains: query, mode: 'insensitive' } },
        { documentType: { typeName: { contains: query, mode: 'insensitive' } } },
        { fileNumber: { strata: { strataPlan: { contains: query, mode: 'insensitive' } } } },
        { fileNumber: { strata: { complexName: { contains: query, mode: 'insensitive' } } } }
      ]
    },
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
};

export const getDocumentsByProfile = async (profileId: string) => {
  const sectionIds = await getVisibleSectionIdsForProfile(profileId);

  return prisma.fileNumberDocument.findMany({
    where: {
      fileNumber: {
        strata: {
          strataProfiles: { some: { profileId } }
        }
      },
      ...sectionVisibilityWhere(sectionIds),
    },
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
};

export const getDocumentByIdForProfile = async (profileId: string, id: number) => {
  const sectionIds = await getVisibleSectionIdsForProfile(profileId);

  return prisma.fileNumberDocument.findFirst({
    where: {
      fileNumberDocumentId: id,
      fileNumber: {
        strata: {
          strataProfiles: { some: { profileId } }
        }
      },
      ...sectionVisibilityWhere(sectionIds),
    },
    include: documentInclude
  });
};

export const searchDocumentsByProfile = async (profileId: string, query: string) => {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return getDocumentsByProfile(profileId);
  }

  const sectionIds = await getVisibleSectionIdsForProfile(profileId);

  return prisma.fileNumberDocument.findMany({
    where: {
      AND: [
        {
          fileNumber: {
            strata: {
              strataProfiles: { some: { profileId } }
            }
          }
        },
        ...(sectionIds.length ? [sectionVisibilityWhere(sectionIds)] : []),
        {
          OR: [
            { fileName: { contains: trimmedQuery, mode: 'insensitive' } },
            { documentType: { typeName: { contains: trimmedQuery, mode: 'insensitive' } } },
            { fileNumber: { strata: { strataPlan: { contains: trimmedQuery, mode: 'insensitive' } } } },
            { fileNumber: { strata: { complexName: { contains: trimmedQuery, mode: 'insensitive' } } } }
          ]
        }
      ]
    },
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
};

export const getFileNumberByIdForProfile = async (profileId: string, fileNumberId: number) => {
  return prisma.fileNumber.findFirst({
    where: {
      fileNumberId,
      strata: {
        strataProfiles: { some: { profileId } }
      }
    },
    select: {
      fileNumberId: true,
      serviceId: true,
      strata: {
        select: {
          strataPropertyTypes: { select: { propertyTypeId: true } }
        }
      }
    }
  });
};

export const getDocumentsByFileNumberForProfile = async (profileId: string, fileNumberId: number) => {
  const sectionIds = await getVisibleSectionIdsForProfile(profileId);

  return prisma.fileNumberDocument.findMany({
    where: {
      fileNumberId,
      fileNumber: {
        strata: {
          strataProfiles: { some: { profileId } }
        }
      },
      ...sectionVisibilityWhere(sectionIds),
    },
    orderBy: { uploadedAt: 'desc' },
    include: documentIncludeCompact
  });
};
