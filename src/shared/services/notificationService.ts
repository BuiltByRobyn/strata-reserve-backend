import prisma from '../lib/prismaClient';

export const getNotificationsForProfile = async (profileId: string) => {
  return prisma.inAppNotification.findMany({
    where: { profileId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

export const markNotificationRead = async (notificationId: number, profileId: string) => {
  return prisma.inAppNotification.updateMany({
    where: { notificationId, profileId },
    data: { isRead: true },
  });
};
