import { Hono } from 'hono';
import { DashboardController } from '../controllers/dashboardController';
import { authMiddleware } from '../middleware/auth';

export const dashboardRoutes = new Hono();

dashboardRoutes.get('/', authMiddleware, DashboardController.index);
