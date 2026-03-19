import * as documentService from '../../shared/services/documentService';
import * as fnDocRequirementService from '../../shared/services/fnDocRequirementService';
import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getMyDocuments = asyncHandler(async (c) => {
  const user = c.get('user');
  const documents = await documentService.getDocumentsByProfile(user.id);
  return success(c, documents);
}, 'Failed to fetch documents');

export const getMyDocumentById = asyncHandler(async (c) => {
  const user = c.get('user');
  const id = parseIntParam(c, 'id');

  const document = await documentService.getDocumentByIdForProfile(user.id, id);
  if (!document) {
    return error(c, 'Document not found', 404);
  }

  return success(c, document);
}, 'Failed to fetch document');

export const searchMyDocuments = asyncHandler(async (c) => {
  const user = c.get('user');
  const query = c.req.query('q') || '';
  const documents = await documentService.searchDocumentsByProfile(user.id, query);
  return success(c, documents);
}, 'Failed to search documents');

export const getRequiredDocuments = asyncHandler(async (c) => {
  const user = c.get('user');
  const fileNumberId = parseIntParam(c, 'id');

  const sr = await documentService.getFileNumberByIdForProfile(user.id, fileNumberId);

  if (!sr) {
    return error(c, 'Service request not found', 404);
  }

  const [requiredDocs, uploadedDocs] = await Promise.all([
    fnDocRequirementService.getRequirementsBySR(fileNumberId),
    documentService.getDocumentsByFileNumberForProfile(user.id, fileNumberId)
  ]);

  const checklist = requiredDocs.map(req => ({
    ...req,
    uploadedDocument: uploadedDocs.find(
      doc => doc.documentTypeId === req.documentTypeId &&
        (req.propertyTypeId === null || doc.propertyTypeId === req.propertyTypeId)
    ) || null
  }));

  return success(c, checklist);
}, 'Failed to fetch requested documents');

export const getDocumentsByFileNumber = asyncHandler(async (c) => {
  const user = c.get('user');
  const fileNumberId = parseIntParam(c, 'id');

  const documents = await documentService.getDocumentsByFileNumberForProfile(user.id, fileNumberId);
  return success(c, documents);
}, 'Failed to fetch documents');
