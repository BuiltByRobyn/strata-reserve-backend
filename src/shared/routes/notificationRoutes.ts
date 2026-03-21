import { Hono } from 'hono';
import * as notificationController from '../controllers/notificationController';

export const notificationRoutes = new Hono();

notificationRoutes.get('/notifications', notificationController.getNotifications);
notificationRoutes.put('/notifications/:id/read', notificationController.markAsRead);
