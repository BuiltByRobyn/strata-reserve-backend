import prisma from '../lib/prismaClient';
import { documentInclude, documentIncludeCompact } from '../constants/prismaIncludes';

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

export const getRequiredDocuments = async (serviceId: number, propertyTypeId?: number) => {
  return prisma.requiredDocument.findMany({
    where: {
      serviceId,
      ...(propertyTypeId ? { OR: [{ propertyTypeId }, { propertyTypeId: null }] } : {})
    },
    include: {
      documentType: { select: { documentTypeId: true, typeName: true } }
    },
    orderBy: { requiredDocumentId: 'asc' }
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
  return prisma.serviceRequestDocument.findMany({
    where: {
      serviceRequest: {
        strata: {
          strataProfiles: { some: { profileId } }
        }
      }
    },
    orderBy: { uploadedAt: 'desc' },
    include: documentInclude
  });
};
