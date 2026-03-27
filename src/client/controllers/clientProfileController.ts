import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import prisma from '../../shared/lib/prismaClient';
import * as propertyTypeRequestService from '../../shared/services/propertyTypeRequestService';
import { logProfileChange } from '../../shared/services/clientActivityService';
import { sendPhoneNumberUpdatedEmail, sendAdminPhoneNumberUpdatedEmail } from '../../shared/lib/emailService';

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

  const currentProfile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { firstName: true, lastName: true, phoneNumber: true, companyName: true },
  });

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

  if (currentProfile) {
    const changed: Record<string, { from: unknown; to: unknown }> = {};
    if (body.firstName !== undefined && body.firstName !== currentProfile.firstName)
      changed.firstName = { from: currentProfile.firstName, to: body.firstName };
    if (body.lastName !== undefined && body.lastName !== currentProfile.lastName)
      changed.lastName = { from: currentProfile.lastName, to: body.lastName };
    if (body.phoneNumber !== undefined && body.phoneNumber !== currentProfile.phoneNumber) {
      changed.phoneNumber = { from: currentProfile.phoneNumber, to: body.phoneNumber };
      if (body.phoneNumber) {
        const changedAt = new Date().toLocaleString('en-CA', {
          year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
        });
        const clientName = [updatedProfile.firstName, updatedProfile.lastName].filter(Boolean).join(' ') || 'Unknown';

        if (updatedProfile.email) {
          sendPhoneNumberUpdatedEmail({
            to: updatedProfile.email,
            newPhone: body.phoneNumber,
          }).catch((err) => console.error('Failed to send phone number updated email:', err));
        }

        sendAdminPhoneNumberUpdatedEmail({
          clientName,
          clientEmail: updatedProfile.email || '',
          oldPhone: currentProfile.phoneNumber || 'N/A',
          newPhone: body.phoneNumber,
          changedAt,
        }).catch((err) => console.error('Failed to send admin phone number updated email:', err));
      }
    }
    if (body.companyName !== undefined && (body.companyName || null) !== currentProfile.companyName)
      changed.companyName = { from: currentProfile.companyName, to: body.companyName || null };
    if (Object.keys(changed).length > 0) {
      const strataProfile = await prisma.strataProfile.findFirst({ where: { profileId: user.id }, select: { strataProfileId: true } });
      if (strataProfile) {
        await logProfileChange(strataProfile.strataProfileId, changed);
      }
    }
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
