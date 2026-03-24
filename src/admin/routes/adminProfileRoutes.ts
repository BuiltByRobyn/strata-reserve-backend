import { Hono } from 'hono';
import { getAdminProfile, updateAdminProfile } from '../controllers/adminProfileController';
import { getProfileActivities } from '../controllers/adminActivityController';

const adminProfileRoutes = new Hono();

adminProfileRoutes.get('/profile', getAdminProfile);
adminProfileRoutes.put('/profile', updateAdminProfile);
adminProfileRoutes.get('/profile-activities', getProfileActivities);

export { adminProfileRoutes };
