import { Context } from 'hono';

export const getClientProfile = async (c: Context) => {
  // In a real app, you would get this from the authenticated user
  return c.json({
    companyName: 'Sample Strata Corporation',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@sample.com',
    role: 'client'
  });
};

export const updateClientProfile = async (c: Context) => {
  const body = await c.req.json();
  
  return c.json({
    message: 'Profile updated successfully',
    profile: {
      companyName: body.companyName || 'Sample Strata Corporation',
      firstName: body.firstName || 'John',
      lastName: body.lastName || 'Doe',
      email: body.email || 'john.doe@sample.com',
    }
  });
};
