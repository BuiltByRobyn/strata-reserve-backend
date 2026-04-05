import * as documentService from '../../shared/services/documentService';
import * as fileNumberService from '../../shared/services/fileNumberService';
import * as emailService from '../../shared/lib/emailService';
import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import prisma from '../../shared/lib/prismaClient';
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

  return success(c, { updated: true });
}, 'Failed to mark document as uploaded');

export const finalizeDocuments = asyncHandler(async (c) => {
  const user = c.get('user');
  const fileId = parseIntParam(c, 'id');

  const fn = await prisma.fileNumber.findFirst({
    where: { fileId },
    select: {
      fileNumber: true,
      submittedForReviewDate: true,
      strata: { select: { strataPlan: true, complexName: true } },
    },
  });

  if (!fn) return error(c, 'File number not found', 404);

  const finalizedByProfile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { displayName: true, firstName: true, lastName: true },
  });

  const documentCount = await prisma.fileNumberDocumentRequirement.count({
    where: { fileId },
  });

  const strataNumber = fn.strata?.strataPlan || '';
  const propertyAddress = fn.strata?.complexName || strataNumber;
  const clientName = finalizedByProfile?.displayName
    || [finalizedByProfile?.firstName, finalizedByProfile?.lastName].filter(Boolean).join(' ')
    || 'Unknown';
  const finalizedBy = finalizedByProfile?.displayName
    || [finalizedByProfile?.firstName, finalizedByProfile?.lastName].filter(Boolean).join(' ')
    || 'Client';

  emailService.sendAdminDocumentsFinalizedEmail({
    fileNumber: fn.fileNumber || '',
    strataNumber,
    propertyAddress,
    clientName,
    documentCount,
    finalizedBy,
    surveyCompleted: fn.submittedForReviewDate ? 'Yes' : 'No',
  }).catch((err) => console.error('Failed to send admin documents finalized email:', err));

  await fileNumberService.tryFinalizeApplication(fileId);

  return success(c, { finalized: true });
}, 'Failed to finalize documents');
