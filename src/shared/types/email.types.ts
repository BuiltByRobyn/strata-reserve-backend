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

export interface AdminSurveyFinalizedEmailParams {
  fileNumber: string;
  propertyAddress: string;
  clientName: string;
  surveyDate: string;
}

export interface AdminDocumentsFinalizedEmailParams {
  fileNumber: string;
  propertyAddress: string;
  clientName: string;
  documentCount: number;
  finalizedBy: string;
}

export interface AdminPropertyTypeChangeRequestEmailParams {
  fileNumber: string;
  propertyAddress: string;
  clientName: string;
  currentPropertyType: string;
  requestedPropertyType: string;
  requestedAt: string;
  clientNote: string;
}

export interface AdminAppointmentBookingRequestEmailParams {
  fileNumber: string;
  propertyAddress: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  appointmentType: string;
  requestedDate: string;
  requestedTime: string;
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
