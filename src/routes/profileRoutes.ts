import { Hono } from 'hono';
import { ProfileController } from '../controllers/profileController';
import { authMiddleware } from '../middleware/auth';

export const profileRoutes = new Hono();

profileRoutes.get('/', authMiddleware, ProfileController.index);