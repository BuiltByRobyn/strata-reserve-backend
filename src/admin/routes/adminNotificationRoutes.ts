import { Hono } from 'hono';
import * as notificationController from '../../shared/controllers/notificationController';

export const adminNotificationRoutes = new Hono();

adminNotificationRoutes.get('/notifications', notificationController.getNotifications);
adminNotificationRoutes.put('/notifications/:id/read', notificationController.markAsRead);
