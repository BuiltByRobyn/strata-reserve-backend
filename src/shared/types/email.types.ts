export interface NewStrataEmailParams {
  strataPlan: string;
  complexName?: string;
  town?: string;
  province?: string;
}

export interface MeetingStatusUpdateEmailParams {
  to: string;
  strataNumber: string;
  meetingType: string;
  status: 'Approved' | 'Rejected' | 'Rescheduled';
  meetingDate?: string;
  meetingTime?: string;
}

export interface PropertyTypeUpdatedEmailParams {
  to: string;
  strataNumber: string;
  status: string;
  decisionDate: string;
}

export interface FileCompletionEmailParams {
  to: string;
  strataNumber: string;
  completedDate: string;
}

export interface SurveyFinalizedEmailParams {
  to: string;
  strataNumber: string;
  finalizedDate: string;
}

export interface AdminSurveyFinalizedEmailParams {
  fileNumber: string;
  strataNumber: string;
  propertyAddress: string;
  clientName: string;
  surveyDate: string;
  surveyCompleted: string;
}

export interface AdminDocumentsFinalizedEmailParams {
  fileNumber: string;
  strataNumber: string;
  propertyAddress: string;
  clientName: string;
  documentCount: number;
  finalizedBy: string;
  surveyCompleted: string;
}

export interface AdminPropertyTypeChangeRequestEmailParams {
  fileNumber: string;
  strataNumber: string;
  propertyAddress: string;
  clientName: string;
  currentPropertyType: string;
  requestedPropertyType: string;
  requestedAt: string;
  clientNote: string;
}

export interface AdminAppointmentBookingRequestEmailParams {
  fileNumber: string;
  strataNumber: string;
  propertyAddress: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  appointmentType: string;
  requestedDate1: string;
  requestedTime1: string;
  requestedDate2: string;
  requestedTime2: string;
}

export interface PhoneNumberUpdatedEmailParams {
  to: string;
  newPhone: string;
}

export interface AdminPhoneNumberUpdatedEmailParams {
  clientName: string;
  clientEmail: string;
  oldPhone: string;
  newPhone: string;
  changedAt: string;
}

export interface AdminAppointmentCancelledEmailParams {
  fileNumber: string;
  strataNumber: string;
  propertyAddress: string;
  clientName: string;
  clientEmail: string;
  appointmentType: string;
  appointmentDate: string;
  appointmentTime: string;
  cancelledAt: string;
  cancellationReason: string;
}

export interface DocumentsFinalizedEmailParams {
  to: string;
  strataNumber: string;
  finalizedDate: string;
}

export interface AppointmentBookingOpenEmailParams {
  to: string;
  strataNumber: string;
  meetingType: string;
  bookingDeadline?: string;
}

export interface AdminAppointmentBookingOpenEmailParams {
  fileNumber: string;
  strataNumber: string;
  meetingType: string;
  bookingDeadline: string;
}

export interface PasswordUpdatedEmailParams {
  to: string;
}

export interface FileCreatedEmailParams {
  to: string;
  strataNumber: string;
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
