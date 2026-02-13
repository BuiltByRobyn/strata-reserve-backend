import prisma from '../lib/prismaClient';
import { supabase } from '../lib/supabaseClient';
import { getDropboxTemporaryLink } from './dropboxService';

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

// NEW: Generate signed URL for document preview
export const getDocumentPreviewUrl = async (id: number, profileId: string, isAdmin: boolean = false) => {
  // First, verify the document exists and user has access
  // Admins can view any document, clients need strata profile relationship
  const document = await prisma.serviceRequestDocument.findFirst({
    where: isAdmin 
      ? { serviceRequestDocumentId: id }
      : {
          serviceRequestDocumentId: id,
          serviceRequest: {
            strata: {
              strataProfiles: { some: { profileId } }
            }
          }
        },
    select: {
      serviceRequestDocumentId: true,
      filePath: true,
      fileName: true,
      documentType: {
        select: { typeName: true }
      }
    }
  });

  if (!document) {
    throw new Error('Document not found or access denied');
  }

  // The filePath stored is like "ABC 12345/filename.pdf"
  // Add prefix for Dropbox folder structure
  const dropboxPath = `/${document.filePath}`;

  try {
    const result = await getDropboxTemporaryLink(dropboxPath);
    
    return {
      documentId: document.serviceRequestDocumentId,
      fileName: document.fileName,
      documentType: document.documentType.typeName,
      signedUrl: result.link,
      expiresIn: 3600
    };
  } catch (error) {
    console.error('Error getting Dropbox link:', error);
    throw new Error('Failed to generate document preview URL');
  }
};
