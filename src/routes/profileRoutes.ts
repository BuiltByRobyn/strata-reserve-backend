import { Hono } from 'hono';
import { ProfileController } from '../controllers/profileController';

export const profileRoutes = new Hono();

profileRoutes.get('/', ProfileController.index);