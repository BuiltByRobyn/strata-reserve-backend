import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import * as propertyTypeRequestService from '../../shared/services/propertyTypeRequestService';

export const getPendingRequests = asyncHandler(async (c) => {
  const requests = await propertyTypeRequestService.getPending();
  return success(c, requests);
}, 'Failed to fetch pending property type requests');

export const approveRequest = asyncHandler(async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user');

  const result = await propertyTypeRequestService.approve(id, user.id);
  return success(c, result);
}, 'Failed to approve property type request');

export const rejectRequest = asyncHandler(async (c) => {
  const id = parseInt(c.req.param('id'));
  const user = c.get('user');
  const { rejectionReason } = await c.req.json<{ rejectionReason: string }>();

  if (!rejectionReason?.trim()) {
    return error(c, 'Rejection reason is required', 400);
  }

  const result = await propertyTypeRequestService.reject(id, user.id, rejectionReason.trim());
  return success(c, result);
}, 'Failed to reject property type request');
