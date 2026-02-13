import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';

export const getClientProfile = asyncHandler(async (c) => {
  const user = c.get('user');
  const { default: prisma } = await import('../../shared/lib/prismaClient');

  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: {
      strataProfiles: {
        include: {
          strata: {
            select: { strataPlan: true, complexName: true }
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

  return success(c, {
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    phoneNumber: profile.phoneNumber,
    companyName: profile.companyName,
    strataPlan: strataProfile?.strata?.strataPlan || null,
    strataPosition: strataProfile?.strataPosition || null,
    role: 'client'
  });
}, 'Failed to fetch client profile');

export const updateClientProfile = asyncHandler(async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { default: prisma } = await import('../../shared/lib/prismaClient');

  console.log('[updateClientProfile] user.id:', user?.id);
  console.log('[updateClientProfile] body:', JSON.stringify(body));

  // Update profile fields
  const updatedProfile = await prisma.profile.update({
    where: { id: user.id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      phoneNumber: body.phoneNumber,
    }
  });

  console.log('[updateClientProfile] profile updated:', updatedProfile.firstName, updatedProfile.lastName);

  // Update strata position if provided
  if (body.strataPosition !== undefined) {
    const result = await prisma.strataProfile.updateMany({
      where: { profileId: user.id },
      data: { strataPosition: body.strataPosition }
    });
    console.log('[updateClientProfile] strataProfile updateMany count:', result.count);
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
