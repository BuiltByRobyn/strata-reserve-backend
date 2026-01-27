import { Context } from 'hono';

export const getAuthProfile = async (c: Context) => {
  // In a real app, you would:
  // 1. Extract the JWT token from the Authorization header
  // 2. Verify the token with Supabase
  // 3. Look up the user in your database to get their role
  // 4. Return the appropriate user profile based on role
  
  // For demo purposes, we'll check if email contains 'admin'
  const authHeader = c.req.header('Authorization');
  
  // Mock logic: in production, decode JWT and check user record
  // For now, return mock data based on a simple check
  
  // If you want to test admin flow, use an email with 'admin' in it
  // If you want to test client flow, use any other email
  
  return c.json({
    role: 'client', // Default to client for safety
    companyName: 'Sample Strata Corporation',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@sample.com'
  });
};
