import prisma from '../lib/prismaClient';
import { documentInclude, documentIncludeCompact } from '../constants/prismaIncludes';

const getVisibleSectionIdsForProfile = async (profileId: string): Promise<number[]> => {
  const profileSections = await prisma.strataProfileSection.findMany({
    where: { strataProfile: { profileId } },
    select: { sectionId: true },
  });
  return profileSections.map((s) => s.sectionId);
};

export const getDocuments = async () => {
  return prisma.serviceRequestDocument.findMany({
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
};

export const getDocumentById = async (id: number) => {
  return prisma.serviceRequestDocument.findUnique({
    where: { serviceRequestDocumentId: id },
    include: documentInclude
  });
};

export const getDocumentsByServiceRequest = async (serviceRequestId: number) => {
  return prisma.serviceRequestDocument.findMany({
    where: { serviceRequestId },
    orderBy: { uploadedAt: 'desc' },
    include: documentIncludeCompact
  });
};

export const updateDocumentStatus = async (id: number, reviewStatusId: number, notes?: string) => {
  return prisma.serviceRequestDocument.update({
    where: { serviceRequestDocumentId: id },
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
  return prisma.serviceRequestDocument.update({
    where: { serviceRequestDocumentId: id },
    data: { notes: null }
  });
};

export const deleteDocument = async (id: number) => {
  return prisma.serviceRequestDocument.delete({
    where: { serviceRequestDocumentId: id }
  });
};

export const searchDocuments = async (query: string) => {
  return prisma.serviceRequestDocument.findMany({
    where: {
      OR: [
        { fileName: { contains: query, mode: 'insensitive' } },
        { documentType: { typeName: { contains: query, mode: 'insensitive' } } },
        { serviceRequest: { strata: { strataPlan: { contains: query, mode: 'insensitive' } } } },
        { serviceRequest: { strata: { complexName: { contains: query, mode: 'insensitive' } } } }
      ]
    },
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
};

export const getDocumentsByProfile = async (profileId: string) => {
  const sectionIds = await getVisibleSectionIdsForProfile(profileId);

  return prisma.serviceRequestDocument.findMany({
    where: {
      serviceRequest: {
        strata: {
          strataProfiles: { some: { profileId } }
        }
      },
      ...(sectionIds.length ? {
        OR: [
          { sectionId: null },
          { sectionId: { in: sectionIds } }
        ]
      } : {}),
    },
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
};

export const getDocumentByIdForProfile = async (profileId: string, id: number) => {
  const sectionIds = await getVisibleSectionIdsForProfile(profileId);

  return prisma.serviceRequestDocument.findFirst({
    where: {
      serviceRequestDocumentId: id,
      serviceRequest: {
        strata: {
          strataProfiles: { some: { profileId } }
        }
      },
      ...(sectionIds.length ? {
        OR: [
          { sectionId: null },
          { sectionId: { in: sectionIds } }
        ]
      } : {}),
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

  return prisma.serviceRequestDocument.findMany({
    where: {
      AND: [
        {
          serviceRequest: {
            strata: {
              strataProfiles: { some: { profileId } }
            }
          }
        },
        ...(sectionIds.length ? [{
          OR: [
            { sectionId: null },
            { sectionId: { in: sectionIds } }
          ]
        }] : []),
        {
          OR: [
            { fileName: { contains: trimmedQuery, mode: 'insensitive' } },
            { documentType: { typeName: { contains: trimmedQuery, mode: 'insensitive' } } },
            { serviceRequest: { strata: { strataPlan: { contains: trimmedQuery, mode: 'insensitive' } } } },
            { serviceRequest: { strata: { complexName: { contains: trimmedQuery, mode: 'insensitive' } } } }
          ]
        }
      ]
    },
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
};

export const getServiceRequestByIdForProfile = async (profileId: string, serviceRequestId: number) => {
  return prisma.serviceRequest.findFirst({
    where: {
      serviceRequestId,
      strata: {
        strataProfiles: { some: { profileId } }
      }
    },
    select: {
      serviceRequestId: true,
      serviceId: true,
      strata: {
        select: {
          strataPropertyTypes: { select: { propertyTypeId: true } }
        }
      }
    }
  });
};

export const getDocumentsByServiceRequestForProfile = async (profileId: string, serviceRequestId: number) => {
  const sectionIds = await getVisibleSectionIdsForProfile(profileId);

  return prisma.serviceRequestDocument.findMany({
    where: {
      serviceRequestId,
      serviceRequest: {
        strata: {
          strataProfiles: { some: { profileId } }
        }
      },
      ...(sectionIds.length ? {
        OR: [
          { sectionId: null },
          { sectionId: { in: sectionIds } }
        ]
      } : {}),
    },
    orderBy: { uploadedAt: 'desc' },
    include: documentIncludeCompact
  });
};
