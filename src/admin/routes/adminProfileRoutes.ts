import { Hono } from 'hono';
import { getAdminProfile, updateAdminProfile } from '../controllers/adminProfileController';

const adminProfileRoutes = new Hono();

adminProfileRoutes.get('/profile', getAdminProfile);
adminProfileRoutes.put('/profile', updateAdminProfile);

export { adminProfileRoutes };
