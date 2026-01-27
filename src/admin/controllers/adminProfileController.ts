import { Context } from 'hono';

export const getAdminProfile = async (c: Context) => {
  // In a real app, you would get this from the authenticated user
  return c.json({
    fullName: 'Admin User',
    email: 'admin@stratareserveplanning.com',
    permissions: ['read', 'write', 'delete', 'manage_users'],
    role: 'admin'
  });
};

export const updateAdminProfile = async (c: Context) => {
  const body = await c.req.json();
  
  return c.json({
    message: 'Profile updated successfully',
    profile: {
      fullName: body.fullName || 'Admin User',
      email: body.email || 'admin@stratareserveplanning.com',
    }
  });
};
