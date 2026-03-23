import * as notificationService from '../services/notificationService';
import { success, asyncHandler } from '../helpers/responseHelper';
import { parseIntParam } from '../helpers/parseParams';

export const getNotifications = asyncHandler(async (c) => {
  const user = c.get('user');
  const notifications = await notificationService.getNotificationsForProfile(user.id);
  return success(c, notifications);
}, 'Failed to fetch notifications');

export const markAsRead = asyncHandler(async (c) => {
  const user = c.get('user');
  const id = parseIntParam(c, 'id');
  await notificationService.markNotificationRead(id, user.id);
  return success(c, { updated: true });
}, 'Failed to mark notification as read');
