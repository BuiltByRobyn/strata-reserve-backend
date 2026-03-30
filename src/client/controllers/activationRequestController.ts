import { success, error, created, asyncHandler } from '../../shared/helpers/responseHelper';
import * as activationRequestService from '../../shared/services/activationRequestService';
import prisma from '../../shared/lib/prismaClient';

export const getActivationRequest = asyncHandler(async (c) => {
  const user = c.get('user');

  const strataProfile = await prisma.strataProfile.findFirst({
    where: { profileId: user.id }
  });
  if (!strataProfile) return success(c, null);

  const request = await activationRequestService.getByStrataId(strataProfile.strataId);
  return success(c, request);
}, 'Failed to fetch activation request');

export const createActivationRequest = asyncHandler(async (c) => {
  const user = c.get('user');

  const strataProfile = await prisma.strataProfile.findFirst({
    where: { profileId: user.id }
  });
  if (!strataProfile) {
    return error(c, 'No strata account found for this profile', 400);
  }

  try {
    const request = await activationRequestService.create(strataProfile.strataProfileId);
    return created(c, request);
  } catch (err: unknown) {
    const typed = err as Error & { code?: string };
    if (typed?.code === 'DUPLICATE') {
      return c.json({ success: false, error: typed.message }, 409);
    }
    throw err;
  }
}, 'Failed to create activation request');
