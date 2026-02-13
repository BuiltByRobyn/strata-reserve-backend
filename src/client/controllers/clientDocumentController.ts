import * as documentService from '../../shared/services/documentService';
import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam, parseIntQuery, parseOptionalIntQuery } from '../../shared/helpers/parseParams';

export const getMyDocuments = asyncHandler(async (c) => {
  const user = c.get('user');
  const documents = await documentService.getDocumentsByProfile(user.id);
  return success(c, documents);
}, 'Failed to fetch documents');

export const getRequiredDocuments = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'id');
  const serviceId = parseIntQuery(c, 'serviceId');
  const propertyTypeId = parseOptionalIntQuery(c, 'propertyTypeId');

  const [requiredDocs, uploadedDocs] = await Promise.all([
    documentService.getRequiredDocuments(serviceId, propertyTypeId),
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
