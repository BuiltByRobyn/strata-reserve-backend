export interface InAppNotificationRecord {
  notificationId: number;
  profileId: string;
  fileId: number | null;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  referenceId: number | null;
}
