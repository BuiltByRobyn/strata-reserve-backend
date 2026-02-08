import { success, asyncHandler } from '../../shared/helpers/responseHelper';

export const getClientProfile = asyncHandler(async (c) => {
  return success(c, {
    companyName: 'Sample Strata Corporation',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@sample.com',
    role: 'client'
  });
}, 'Failed to fetch client profile');

export const updateClientProfile = asyncHandler(async (c) => {
  const body = await c.req.json();
  return success(c, {
    message: 'Profile updated successfully',
    profile: {
      companyName: body.companyName || 'Sample Strata Corporation',
      firstName: body.firstName || 'John',
      lastName: body.lastName || 'Doe',
      email: body.email || 'john.doe@sample.com',
    }
  });
}, 'Failed to update client profile');
