import { Hono } from 'hono';
import { DashboardController } from '../controllers/dashboardController';

export const dashboardRoutes = new Hono();

dashboardRoutes.get('/', DashboardController.index);
