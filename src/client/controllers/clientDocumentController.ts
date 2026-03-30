import * as documentService from '../../shared/services/documentService';
import * as fnDocRequirementService from '../../shared/services/fnDocRequirementService';
import * as fileNumberService from '../../shared/services/fileNumberService';
import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import type { NaStatusValue } from '../../shared/types/document.types';

export const getMyDocuments = asyncHandler(async (c) => {
  const user = c.get('user');
  const documents = await documentService.getDocumentsByProfile(user.id);
  return success(c, documents);
}, 'Failed to fetch documents');

export const getMyDocumentById = asyncHandler(async (c) => {
  const user = c.get('user');
  const id = parseIntParam(c, 'id');
  const document = await documentService.getDocumentByIdForProfile(user.id, id);
  if (!document) return error(c, 'Document not found', 404);
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
  const fileId = parseIntParam(c, 'id');
  const checklist = await documentService.getRequiredDocumentsChecklist(user.id, fileId);
  if (!checklist) return error(c, 'Service request not found', 404);
  return success(c, checklist);
}, 'Failed to fetch requested documents');

export const getDocumentsByFileNumber = asyncHandler(async (c) => {
  const user = c.get('user');
  const fileId = parseIntParam(c, 'id');
  const documents = await documentService.getDocumentsByFileNumberForProfile(user.id, fileId);
  return success(c, documents);
}, 'Failed to fetch documents');

export const setNaStatus = asyncHandler(async (c) => {
  const user = c.get('user');
  const fileId = parseIntParam(c, 'id');
  const reqId = parseIntParam(c, 'reqId');
  const { status } = await c.req.json() as { status: NaStatusValue };

  await documentService.setNaStatus(reqId, status, user.id);

  await documentService.createAdminDocResubmittedNotification(fileId);

  const allAnswered = await fnDocRequirementService.checkAllRequirementsAnswered(fileId);
  if (allAnswered) {
    await documentService.createAdminReadyForReviewNotification(fileId);
    await fileNumberService.tryFinalizeApplication(fileId);
  }

  return success(c, { updated: true });
}, 'Failed to set document status');

export const clearNaStatus = asyncHandler(async (c) => {
  const reqId = parseIntParam(c, 'reqId');
  await documentService.clearNaStatus(reqId);
  return success(c, { cleared: true });
}, 'Failed to clear document status');

export const markDocumentUploaded = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'id');
  const reqId = parseIntParam(c, 'reqId');

  await documentService.clearNaStatus(reqId);

  const body = await c.req.json().catch(() => ({})) as { isReplace?: boolean };
  if (!body.isReplace) {
    await documentService.handleDuplicateUpload(fileId, reqId);
  }

  await documentService.createAdminDocResubmittedNotification(fileId);

  const allAnswered = await fnDocRequirementService.checkAllRequirementsAnswered(fileId);
  if (allAnswered) {
    await documentService.createAdminReadyForReviewNotification(fileId);
    await fileNumberService.tryFinalizeApplication(fileId);
  }

  return success(c, { updated: true });
}, 'Failed to mark document as uploaded');
