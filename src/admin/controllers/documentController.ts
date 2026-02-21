import * as documentService from '../../shared/services/documentService';
import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getDocuments = asyncHandler(async (c) => {
  const documents = await documentService.getDocuments();
  return success(c, documents);
}, 'Failed to fetch documents');

export const getDocumentById = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const document = await documentService.getDocumentById(id);
  if (!document) {
    return error(c, 'Document not found', 404);
  }
  return success(c, document);
}, 'Failed to fetch document');

export const updateDocumentStatus = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();
  if (!body.reviewStatusId) {
    return error(c, 'Review status ID is required', 400);
  }
  const document = await documentService.updateDocumentStatus(
    id,
    parseInt(body.reviewStatusId),
    body.notes?.trim()
  );
  return success(c, document);
}, 'Failed to update document status');

export const clearDocumentNotes = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  await documentService.clearDocumentNotes(id);
  return success(c, { message: 'Document notes cleared' });
}, 'Failed to clear document notes');

export const deleteDocument = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  await documentService.deleteDocument(id);
  return success(c, { message: 'Document deleted successfully' });
}, 'Failed to delete document');

export const searchDocuments = asyncHandler(async (c) => {
  const query = c.req.query('q') || '';
  const documents = await documentService.searchDocuments(query);
  return success(c, documents);
}, 'Failed to search documents');
