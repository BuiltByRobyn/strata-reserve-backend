import * as documentService from '../../shared/services/documentService';
import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import type { BatchDocumentReviewInput } from '../../shared/types/document.types';

export const getDocumentReview = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'id');
  const result = await documentService.getLatestDocumentReview(fileId);
  return success(c, result);
}, 'Failed to fetch document review');

export const submitDocumentReview = asyncHandler(async (c) => {
  const user = c.get('user');
  const fileId = parseIntParam(c, 'id');
  const { items } = await c.req.json() as BatchDocumentReviewInput;

  if (!Array.isArray(items) || items.length === 0) {
    return error(c, 'Review items are required', 400);
  }

  const review = await documentService.submitBatchDocumentReview(fileId, user.id, items);

  const reviewItems = review.items.map((item) => ({
    documentTypeName: item.requirement.documentType.typeName,
    versionLabel: item.requirement.versionLabel,
    propertyTypeName: item.requirement.propertyType?.propertyTypeName ?? null,
    statusName: item.reviewStatus.statusName,
    notes: item.notes,
  }));

  await documentService.createClientReviewCompleteNotification(fileId, review.reviewId, reviewItems);

  return success(c, review);
}, 'Failed to submit document review');
