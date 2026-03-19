import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import * as activationRequestService from '../../shared/services/activationRequestService';

export const getPendingRequests = asyncHandler(async (c) => {
  const requests = await activationRequestService.getPending();
  return success(c, requests);
}, 'Failed to fetch pending activation requests');

export const approveRequest = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const user = c.get('user');

  const result = await activationRequestService.approve(id, user.id);
  return success(c, result);
}, 'Failed to approve activation request');

export const rejectRequest = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const user = c.get('user');
  const { rejectionReason } = await c.req.json<{ rejectionReason: string }>();

  if (!rejectionReason?.trim()) {
    return error(c, 'Rejection reason is required', 400);
  }

  const result = await activationRequestService.reject(id, user.id, rejectionReason.trim());
  return success(c, result);
}, 'Failed to reject activation request');
