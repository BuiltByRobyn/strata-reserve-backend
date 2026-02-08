import { success, asyncHandler } from '../../shared/helpers/responseHelper';

export const getAdminProfile = asyncHandler(async (c) => {
  return success(c, {
    fullName: 'Admin User',
    email: 'admin@stratareserveplanning.com',
    permissions: ['read', 'write', 'delete', 'manage_users'],
    role: 'admin'
  });
}, 'Failed to fetch admin profile');

export const updateAdminProfile = asyncHandler(async (c) => {
  const body = await c.req.json();
  return success(c, {
    message: 'Profile updated successfully',
    profile: {
      fullName: body.fullName || 'Admin User',
      email: body.email || 'admin@stratareserveplanning.com',
    }
  });
}, 'Failed to update admin profile');
