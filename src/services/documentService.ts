// Document Service - CRUD operations for document management
import prisma from '../lib/prismaClient';

// ============================================
// Get All Documents (Admin)
// ============================================
export const getDocuments = async () => {
  return prisma.serviceRequestDocument.findMany({
    orderBy: { uploadedAt: 'desc' },
    include: {
      documentType: { select: { documentTypeId: true, typeName: true } },
      serviceRequest: {
        select: {
          serviceRequestId: true,
          strata: { select: { strataId: true, strataPlan: true, complexName: true } }
        }
      },
      uploadedBy: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      reviewStatus: { select: { reviewStatusId: true, statusName: true } }
    }
  });
};

// ============================================
// Get Document by ID
// ============================================
export const getDocumentById = async (id: number) => {
  return prisma.serviceRequestDocument.findUnique({
    where: { serviceRequestDocumentId: id },
    include: {
      documentType: { select: { documentTypeId: true, typeName: true } },
      serviceRequest: {
        select: {
          serviceRequestId: true,
          strata: { select: { strataId: true, strataPlan: true, complexName: true } }
        }
      },
      uploadedBy: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      reviewStatus: { select: { reviewStatusId: true, statusName: true } }
    }
  });
};

// ============================================
// Get Documents by Service Request
// ============================================
export const getDocumentsByServiceRequest = async (serviceRequestId: number) => {
  return prisma.serviceRequestDocument.findMany({
    where: { serviceRequestId },
    orderBy: { uploadedAt: 'desc' },
    include: {
      documentType: { select: { documentTypeId: true, typeName: true } },
      uploadedBy: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      reviewStatus: { select: { reviewStatusId: true, statusName: true } }
    }
  });
};

// ============================================
// Get Required Documents for a Service
// ============================================
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

// ============================================
// Update Document Status (Admin)
// ============================================
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

// ============================================
// Delete Document
// ============================================
export const deleteDocument = async (id: number) => {
  return prisma.serviceRequestDocument.delete({
    where: { serviceRequestDocumentId: id }
  });
};

// ============================================
// Search Documents
// ============================================
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
    include: {
      documentType: { select: { documentTypeId: true, typeName: true } },
      serviceRequest: {
        select: {
          serviceRequestId: true,
          strata: { select: { strataId: true, strataPlan: true, complexName: true } }
        }
      },
      uploadedBy: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      reviewStatus: { select: { reviewStatusId: true, statusName: true } }
    }
  });
};

// ============================================
// Get Documents by Profile (Client)
// ============================================
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
    include: {
      documentType: { select: { documentTypeId: true, typeName: true } },
      serviceRequest: {
        select: {
          serviceRequestId: true,
          strata: { select: { strataId: true, strataPlan: true, complexName: true } }
        }
      },
      uploadedBy: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      reviewStatus: { select: { reviewStatusId: true, statusName: true } }
    }
  });
};
