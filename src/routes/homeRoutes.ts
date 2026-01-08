import { Hono } from 'hono';
import { HomeController } from '../controllers/homeController';

export const homeRoutes = new Hono();

homeRoutes.get('/', HomeController.index);
