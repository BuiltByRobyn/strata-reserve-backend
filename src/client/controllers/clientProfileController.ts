import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import prisma from '../../shared/lib/prismaClient';
import * as propertyTypeRequestService from '../../shared/services/propertyTypeRequestService';

export const getClientProfile = asyncHandler(async (c) => {
  const user = c.get('user');

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      strataProfiles: {
        include: {
          strata: {
            select: {
              strataPlan: true,
              complexName: true,
              strataPropertyTypes: {
                include: {
                  propertyType: {
                    select: { propertyTypeId: true, propertyTypeName: true }
                  }
                }
              }
            }
          },
          strataProfilePropertyTypes: {
            include: {
              propertyType: {
                select: { propertyTypeId: true, propertyTypeName: true }
              }
            }
          }
        },
        take: 1
      }
    }
  });

  if (!profile) {
    return error(c, 'Profile not found', 404);
  }

  const strataProfile = profile.strataProfiles[0];

  const strataPropertyTypes = strataProfile?.strata?.strataPropertyTypes?.map((s) => s.propertyType) ?? [];
  const strataPropertyTypeIds = new Set(strataPropertyTypes.map((p) => p.propertyTypeId));
  const propertyTypes = (strataProfile?.strataProfilePropertyTypes ?? [])
    .map((p) => p.propertyType)
    .filter((p) => strataPropertyTypeIds.has(p.propertyTypeId));

  return success(c, {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phoneNumber: profile.phoneNumber,
    companyName: profile.companyName,
    strataPlan: strataProfile?.strata?.strataPlan || null,
    strataPosition: strataProfile?.strataPosition || null,
    propertyTypes,
    strataPropertyTypes,
    role: 'client'
  });
}, 'Failed to fetch client profile');

export const updateClientProfile = asyncHandler(async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  const updatedProfile = await prisma.profile.update({
    where: { id: user.id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
      ...(body.companyName !== undefined && { companyName: body.companyName || null }),
    }
  });

  if (body.strataPosition !== undefined) {
    await prisma.strataProfile.updateMany({
      where: { profileId: user.id },
      data: { strataPosition: body.strataPosition }
    });
  }

  return success(c, {
    message: 'Profile updated successfully',
    profile: {
      firstName: updatedProfile.firstName,
      lastName: updatedProfile.lastName,
      email: updatedProfile.email,
      phoneNumber: updatedProfile.phoneNumber,
      strataPosition: body.strataPosition,
    }
  });
}, 'Failed to update client profile');

export const requestSectionChange = asyncHandler(async (c) => {
  const user = c.get('user');
  const { propertyTypeIds } = await c.req.json<{ propertyTypeIds: number[] }>();

  if (!propertyTypeIds || propertyTypeIds.length === 0) {
    return error(c, 'At least one property type must be selected', 400);
  }

  const strataProfile = await prisma.strataProfile.findFirst({
    where: { profileId: user.id }
  });

  if (!strataProfile) {
    return error(c, 'Strata profile not found', 404);
  }

  try {
    const request = await propertyTypeRequestService.create(
      strataProfile.strataProfileId,
      propertyTypeIds
    );
    return success(c, request);
  } catch (err: unknown) {
    const typed = err as Error & { code?: string };
    if (typed?.code === 'DUPLICATE') {
      return error(c, typed.message, 400);
    }
    throw err;
  }
}, 'Failed to submit section change request');
