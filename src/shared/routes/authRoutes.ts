import { Hono } from 'hono';
import { getAuthProfile } from '../controllers/authController';

const authRoutes = new Hono();

authRoutes.get('/profile', getAuthProfile);

export { authRoutes };
