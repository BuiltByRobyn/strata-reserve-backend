export interface NewStrataEmailParams {
  strataPlan: string;
  complexName?: string;
  town?: string;
  province?: string;
}

export interface MeetingStatusUpdateEmailParams {
  to: string;
  fileNumber: string;
  meetingType: string;
  status: 'Approved' | 'Rejected' | 'Rescheduled';
  meetingDate?: string;
  meetingTime?: string;
  denialReason?: string;
}

export interface PropertyTypeUpdatedEmailParams {
  to: string;
  fileNumber: string;
  oldPropertyType: string;
  newPropertyType: string;
  changedDate: string;
}

export interface FileCompletionEmailParams {
  to: string;
  fileNumber: string;
  completedDate: string;
}

export interface SurveyFinalizedEmailParams {
  to: string;
  fileNumber: string;
  finalizedDate: string;
}

export interface DocumentsFinalizedEmailParams {
  to: string;
  fileNumber: string;
  finalizedDate: string;
}

export interface AppointmentBookingOpenEmailParams {
  to: string;
  fileNumber: string;
  meetingType: string;
  bookingDeadline?: string;
}

export interface FileCreatedEmailParams {
  to: string;
  fileNumber: string;
}

export interface DocumentReviewReadyEmailParams {
  to: string;
  firstName: string | null;
  strataName: string;
  fileNumber: string;
}

export interface DocumentReviewResultEmailParams {
  to: string;
  firstName: string | null;
  strataName: string;
  fileNumber: string;
  items: Array<{
    documentTypeName: string;
    versionLabel: string;
    propertyTypeName: string | null;
    statusName: string;
    notes: string | null;
  }>;
}
