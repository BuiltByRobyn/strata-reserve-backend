import * as documentService from '../../shared/services/documentService';
import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getMyDocuments = asyncHandler(async (c) => {
  const user = c.get('user');
  const documents = await documentService.getDocumentsByProfile(user.id);
  return success(c, documents);
}, 'Failed to fetch documents');

export const getRequiredDocuments = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'id');

  const { default: prisma } = await import('../../shared/lib/prismaClient');
  const sr = await prisma.serviceRequest.findUnique({
    where: { serviceRequestId },
    include: { strata: { select: { propertyTypeId: true } } }
  });

  if (!sr) {
    return error(c, 'Service request not found', 404);
  }

  const [requiredDocs, uploadedDocs] = await Promise.all([
    documentService.getRequiredDocuments(sr.serviceId, sr.strata.propertyTypeId ?? undefined),
    documentService.getDocumentsByServiceRequest(serviceRequestId)
  ]);

  const checklist = requiredDocs.map(req => ({
    ...req,
    uploadedDocument: uploadedDocs.find(
      doc => doc.documentTypeId === req.documentTypeId
    ) || null
  }));

  return success(c, checklist);
}, 'Failed to fetch required documents');

export const getDocumentsByServiceRequest = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'id');
  const documents = await documentService.getDocumentsByServiceRequest(serviceRequestId);
  return success(c, documents);
}, 'Failed to fetch documents');

// NEW: Get document preview URL
export const getDocumentPreview = asyncHandler(async (c) => {
  const documentId = parseIntParam(c, 'id');
  const user = c.get('user');
  
  const previewData = await documentService.getDocumentPreviewUrl(documentId, user.id);
  
  return success(c, previewData);
}, 'Failed to generate document preview');
