import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import * as profileService from '../../shared/services/profileService';

export const getAdminProfile = asyncHandler(async (c) => {
  const user = c.get('user');
  if (!user) return error(c, 'Unauthorized', 401);

  const profile = await profileService.getProfileById(user.id);
  if (!profile) return error(c, 'Profile not found', 404);

  const fullName = profile.displayName
    || [profile.firstName, profile.lastName].filter(Boolean).join(' ')
    || '';

  return success(c, {
    fullName,
    email: profile.email || user.email || '',
    phoneNumber: profile.phoneNumber || '',
    role: profile.userType?.userTypeName || 'Unknown',
    companyName: profile.companyName || 'Strata Reserve Planning',
  });
}, 'Failed to fetch admin profile');

export const updateAdminProfile = asyncHandler(async (c) => {
  const user = c.get('user');
  if (!user) return error(c, 'Unauthorized', 401);

  const body = await c.req.json();
  const { fullName, phoneNumber, companyName } = body;

  const nameParts = (fullName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || null;
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null;

  await profileService.updateProfile(user.id, {
    firstName,
    lastName,
    displayName: fullName || null,
    phoneNumber: phoneNumber || null,
  });

  const updated = await profileService.getProfileById(user.id);

  const updatedFullName = updated?.displayName
    || [updated?.firstName, updated?.lastName].filter(Boolean).join(' ')
    || '';

  return success(c, {
    message: 'Profile updated successfully',
    profile: {
      fullName: updatedFullName,
      email: updated?.email || user.email || '',
      phoneNumber: updated?.phoneNumber || '',
      role: updated?.userType?.userTypeName || 'Unknown',
      companyName: updated?.companyName || 'Strata Reserve Planning',
    },
  });
}, 'Failed to update admin profile');
