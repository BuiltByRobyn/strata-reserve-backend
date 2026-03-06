import { success, created, error, asyncHandler } from '../../shared/helpers/responseHelper';
import * as fileNumberService from '../../shared/services/fileNumberService';
import * as propertyTypeRequestService from '../../shared/services/propertyTypeRequestService';
import prisma from '../../shared/lib/prismaClient';

export const getActiveFileNumber = asyncHandler(async (c) => {
  const user = c.get('user');
  const fileNumber = await fileNumberService.getActiveByProfile(user.id);
  if (!fileNumber) return success(c, null);

  const clientProfile = await prisma.strataProfile.findFirst({
    where: { strataId: fileNumber.strataId, profileId: user.id },
    select: {
      strataProfilePropertyTypes: {
        select: { propertyTypeId: true }
      }
    }
  });

  return success(c, {
    ...fileNumber,
    clientPropertyTypes: clientProfile?.strataProfilePropertyTypes || []
  });
}, 'Failed to fetch active file number');

export const submitDocumentsForReview = asyncHandler(async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  const fileNumber = await fileNumberService.getActiveByProfile(user.id);
  if (!fileNumber || fileNumber.fileNumberId !== id) {
    return error(c, 'Service request not found or access denied', 404);
  }

  try {
    const updated = await fileNumberService.submitForReview(id);
    return success(c, updated);
  } catch (err: unknown) {
    const typed = err as Error & { code?: string };
    if (typed?.code === 'VALIDATION_ERROR') {
      return error(c, typed.message, 400);
    }
    throw err;
  }
}, 'Failed to submit documents for review');

export const getPropertyTypeRequest = asyncHandler(async (c) => {
  const user = c.get('user');
  const fileNumber = await fileNumberService.getActiveByProfile(user.id);
  if (!fileNumber) return success(c, null);

  const strataProfile = await prisma.strataProfile.findFirst({
    where: { strataId: fileNumber.strataId, profileId: user.id }
  });
  if (!strataProfile) return success(c, null);

  const request = await propertyTypeRequestService.getLatestByStrataProfile(strataProfile.strataProfileId);
  return success(c, request);
}, 'Failed to fetch property type request');

export const createPropertyTypeRequest = asyncHandler(async (c) => {
  const user = c.get('user');
  const { propertyTypeIds } = await c.req.json<{ propertyTypeIds: number[] }>();

  if (!propertyTypeIds || propertyTypeIds.length === 0) {
    return error(c, 'At least one property type must be selected', 400);
  }

  const fileNumber = await fileNumberService.getActiveByProfile(user.id);
  if (!fileNumber) return error(c, 'No active file number', 404);

  const strataProfile = await prisma.strataProfile.findFirst({
    where: { strataId: fileNumber.strataId, profileId: user.id }
  });
  if (!strataProfile) return error(c, 'Strata profile not found', 404);

  try {
    const request = await propertyTypeRequestService.create(
      strataProfile.strataProfileId,
      propertyTypeIds
    );
    return created(c, request);
  } catch (err: unknown) {
    const typed = err as Error & { code?: string };
    if (typed?.code === 'DUPLICATE') {
      return error(c, typed.message, 400);
    }
    throw err;
  }
}, 'Failed to create property type request');
