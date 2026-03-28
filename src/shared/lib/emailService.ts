import { Resend } from 'resend';
import type {
  NewStrataEmailParams,
  DocumentReviewReadyEmailParams,
  DocumentReviewResultEmailParams,
  FileCreatedEmailParams,
  MeetingStatusUpdateEmailParams,
  AppointmentBookingOpenEmailParams,
  DocumentsFinalizedEmailParams,
  SurveyFinalizedEmailParams,
  FileCompletionEmailParams,
  PropertyTypeUpdatedEmailParams,
  AdminSurveyFinalizedEmailParams,
  AdminDocumentsFinalizedEmailParams,
  AdminPropertyTypeChangeRequestEmailParams,
  AdminAppointmentBookingRequestEmailParams,
  AdminAppointmentCancelledEmailParams,
  PhoneNumberUpdatedEmailParams,
  AdminPhoneNumberUpdatedEmailParams,
  PasswordUpdatedEmailParams,
  AdminAppointmentBookingOpenEmailParams,
} from '../types/email.types';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'Strata Reserve Planning <noreply@stratareserveplanning.com>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const FRONTEND_URL = (process.env.FRONTEND_URL || 'https://your-app-url.com').replace(/\/$/, '');

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export async function sendPropertyTypeUpdatedEmail(params: PropertyTypeUpdatedEmailParams): Promise<void> {
  if (!resend || !params.to) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: 'Your property type change request has been reviewed – Strata Reserve Planning',
    template_alias: 'property-type-updated-client-1',
    variables: {
      StrataNumber: params.strataNumber,
      Status: params.status,
      DecisionDate: params.decisionDate,
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendFileCompletionEmail(params: FileCompletionEmailParams): Promise<void> {
  if (!resend || !params.to) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: 'Your file has been completed – Strata Reserve Planning',
    template_alias: 'file-completion-notification-client-1',
    variables: {
      StrataNumber: params.strataNumber,
      CompletedDate: params.completedDate,
      ReportURL: `${FRONTEND_URL}/documents`,
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendAdminPhoneNumberUpdatedEmail(params: AdminPhoneNumberUpdatedEmailParams): Promise<void> {
  if (!resend || !ADMIN_EMAIL) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: '[Admin Alert] A client has updated their phone number – Strata Reserve Planning',
    template_alias: 'client-phone-number-alert-admin-2',
    variables: {
      ClientName: params.clientName,
      ClientEmail: params.clientEmail,
      OldPhone: params.oldPhone,
      NewPhone: params.newPhone,
      ChangedAt: params.changedAt,
      AdminURL: `${FRONTEND_URL}/admin`,
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendPhoneNumberUpdatedEmail(params: PhoneNumberUpdatedEmailParams): Promise<void> {
  if (!resend || !params.to) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: 'Your phone number has been updated – Strata Reserve Planning',
    template_alias: 'phone-number-updated-client-1',
    variables: {
      NewPhone: params.newPhone,
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendAdminAppointmentCancelledEmail(params: AdminAppointmentCancelledEmailParams): Promise<void> {
  if (!resend || !ADMIN_EMAIL) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `Appointment Cancelled: ${params.fileNumber} — Strata Reserve Planning`,
    template_alias: 'appointment-cancellation-alert-admin-2',
    variables: {
      FileNumber: params.fileNumber,
      StrataNumber: params.strataNumber,
      PropertyAddress: params.propertyAddress,
      ClientName: params.clientName,
      ClientEmail: params.clientEmail,
      AppointmentType: params.appointmentType,
      AppointmentDate: params.appointmentDate,
      AppointmentTime: params.appointmentTime,
      CancelledAt: params.cancelledAt,
      CancellationReason: params.cancellationReason,
      AdminDashboardURL: `${FRONTEND_URL}/admin`,
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendAdminAppointmentBookingRequestEmail(params: AdminAppointmentBookingRequestEmailParams): Promise<void> {
  if (!resend || !ADMIN_EMAIL) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New Appointment Booking Request: ${params.fileNumber} — Strata Reserve Planning`,
    template_alias: 'appointment-booking-alert-admin-2',
    variables: {
      FileNumber: params.fileNumber,
      StrataNumber: params.strataNumber,
      PropertyAddress: params.propertyAddress,
      ClientName: params.clientName,
      ClientEmail: params.clientEmail,
      ClientPhone: params.clientPhone,
      AppointmentType: params.appointmentType,
      RequestedDate1: params.requestedDate1,
      RequestedTime1: params.requestedTime1,
      RequestedDate2: params.requestedDate2,
      RequestedTime2: params.requestedTime2,
      AdminDashboardURL: `${FRONTEND_URL}/admin`,
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendAdminPropertyTypeChangeRequestEmail(params: AdminPropertyTypeChangeRequestEmailParams): Promise<void> {
  if (!resend || !ADMIN_EMAIL) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `Property Type Change Request: ${params.fileNumber} — Strata Reserve Planning`,
    template_alias: 'property-type-change-request-admin-2',
    variables: {
      FileNumber: params.fileNumber,
      StrataNumber: params.strataNumber,
      PropertyAddress: params.propertyAddress,
      ClientName: params.clientName,
      CurrentPropertyType: params.currentPropertyType,
      RequestedPropertyType: params.requestedPropertyType,
      RequestedAt: params.requestedAt,
      ClientNote: params.clientNote,
      AdminDashboardURL: `${FRONTEND_URL}/admin`,
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendAdminDocumentsFinalizedEmail(params: AdminDocumentsFinalizedEmailParams): Promise<void> {
  if (!resend || !ADMIN_EMAIL) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `Documents Finalized: ${params.fileNumber} — Strata Reserve Planning`,
    template_alias: 'documents-finalized-alert-admin-2',
    variables: {
      FileNumber: params.fileNumber,
      StrataNumber: params.strataNumber,
      PropertyAddress: params.propertyAddress,
      ClientName: params.clientName,
      DocumentCount: params.documentCount,
      FinalizedBy: params.finalizedBy,
      SurveyCompleted: params.surveyCompleted,
      AdminDashboardURL: `${FRONTEND_URL}/admin`,
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendAdminSurveyFinalizedEmail(params: AdminSurveyFinalizedEmailParams): Promise<void> {
  if (!resend || !ADMIN_EMAIL) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `Survey Finalized: ${params.fileNumber} — Strata Reserve Planning`,
    template_alias: 'survey-finalized-notification-admin-2',
    variables: {
      FileNumber: params.fileNumber,
      StrataNumber: params.strataNumber,
      PropertyAddress: params.propertyAddress,
      ClientName: params.clientName,
      SurveyDate: params.surveyDate,
      SurveyCompleted: params.surveyCompleted,
      AdminDashboardURL: `${FRONTEND_URL}/admin`,
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendSurveyFinalizedEmail(params: SurveyFinalizedEmailParams): Promise<void> {
  if (!resend || !params.to) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: 'Your survey has been finalized – Strata Reserve Planning',
    template_alias: 'survey-finalized-client-1',
    variables: {
      StrataNumber: params.strataNumber,
      FinalizedDate: params.finalizedDate,
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendDocumentsFinalizedEmail(params: DocumentsFinalizedEmailParams): Promise<void> {
  if (!resend || !params.to) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: 'Your documents have been finalized – Strata Reserve Planning',
    template_alias: 'documents-finalized-notification-client-1',
    variables: {
      StrataNumber: params.strataNumber,
      FinalizedDate: params.finalizedDate,
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendAppointmentBookingOpenEmail(params: AppointmentBookingOpenEmailParams): Promise<void> {
  if (!resend || !params.to) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Book your ${params.meetingType} appointment – Strata Reserve Planning`,
    template_alias: 'appointment-booking-open-client-2',
    variables: {
      StrataNumber: params.strataNumber,
      MeetingType: params.meetingType,
      BookingURL: `${FRONTEND_URL}/appointments`,
      BookingDeadline: params.bookingDeadline || '',
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendAdminAppointmentBookingOpenEmail(params: AdminAppointmentBookingOpenEmailParams): Promise<void> {
  if (!resend || !ADMIN_EMAIL) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `Booking Now Open: ${params.strataNumber} — ${params.meetingType} — Strata Reserve Planning`,
    template_alias: 'appointment-booking-open-admin-1',
    variables: {
      FileNumber: params.fileNumber,
      StrataNumber: params.strataNumber,
      MeetingType: params.meetingType,
      BookingDeadline: params.bookingDeadline,
      BookingURL: `${FRONTEND_URL}/admin`,
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendMeetingStatusUpdateEmail(params: MeetingStatusUpdateEmailParams): Promise<void> {
  if (!resend || !params.to) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Your meeting request has been ${params.status} – Strata Reserve Planning`,
    template_alias: 'meeting-status-update-client-1',
    variables: {
      StrataNumber: params.strataNumber,
      MeetingType: params.meetingType,
      MeetingStatus: params.status,
      MeetingStatusClass: params.status === 'Approved' ? 'approved' : params.status === 'Rejected' ? 'denied' : 'rescheduled',
      MeetingDate: params.meetingDate || '',
      MeetingTime: params.meetingTime || '',
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendPasswordUpdatedEmail(params: PasswordUpdatedEmailParams): Promise<void> {
  if (!resend || !params.to) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: 'Your password has been updated – Strata Reserve Planning',
    template_alias: 'password-update-confirmation-admin-client',
    variables: {
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendFileCreatedEmail(params: FileCreatedEmailParams): Promise<void> {
  if (!resend || !params.to) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: 'Your file has been created – Strata Reserve Planning',
    template_alias: 'file-creation-notification-client-1',
    variables: {
      StrataNumber: params.strataNumber,
      SiteURL: FRONTEND_URL,
    },
  } as any);
}

export async function sendDocumentReviewReadyEmail(params: DocumentReviewReadyEmailParams): Promise<void> {
  if (!resend || !params.to) return;

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Documents Ready for Review: ${params.fileNumber} — ${params.strataName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <h2 style="color: #1e40af;">Documents Ready for Review</h2>
        <p>Hello${params.firstName ? ` ${params.firstName}` : ''},</p>
        <p>All documents for <strong>${params.strataName}</strong> (File ${params.fileNumber}) have been submitted and are ready for your review.</p>
        <a href="${FRONTEND_URL}/admin/strata" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">Review Documents</a>
      </div>
    `,
  });
}

export async function sendDocumentReviewResultEmail(params: DocumentReviewResultEmailParams): Promise<void> {
  if (!resend || !params.to) return;

  const rows = params.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${item.documentTypeName}${item.versionLabel ? ` (${item.versionLabel})` : ''}${item.propertyTypeName ? ` — ${item.propertyTypeName}` : ''}</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${item.statusName}</td>
      <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${item.notes || ''}</td>
    </tr>`
    )
    .join('');

  await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Document Review Complete: ${params.fileNumber} — ${params.strataName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <h2 style="color: #1e40af;">Document Review Complete</h2>
        <p>Hello${params.firstName ? ` ${params.firstName}` : ''},</p>
        <p>Your document submission for <strong>${params.strataName}</strong> (File ${params.fileNumber}) has been reviewed.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <thead>
            <tr>
              <th style="text-align: left; padding: 8px 12px; background: #f3f4f6; border: 1px solid #e5e7eb;">Document</th>
              <th style="text-align: left; padding: 8px 12px; background: #f3f4f6; border: 1px solid #e5e7eb;">Status</th>
              <th style="text-align: left; padding: 8px 12px; background: #f3f4f6; border: 1px solid #e5e7eb;">Notes</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <a href="${FRONTEND_URL}/documents" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">View Portal</a>
      </div>
    `,
  });
}

export async function sendNewStrataEmail(params: NewStrataEmailParams): Promise<void> {
  if (!resend || !ADMIN_EMAIL) return;

  const location = [params.town, params.province].filter(Boolean).join(', ');

  await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_EMAIL,
    subject: `New Strata Created: ${params.strataPlan}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #111827;">
        <h2 style="color: #1e40af;">New Strata Property Added</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr>
            <th style="text-align: left; padding: 8px 12px; background: #f3f4f6; border: 1px solid #e5e7eb;">Strata Plan</th>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${params.strataPlan}</td>
          </tr>
          ${params.complexName ? `
          <tr>
            <th style="text-align: left; padding: 8px 12px; background: #f3f4f6; border: 1px solid #e5e7eb;">Complex Name</th>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${params.complexName}</td>
          </tr>` : ''}
          ${location ? `
          <tr>
            <th style="text-align: left; padding: 8px 12px; background: #f3f4f6; border: 1px solid #e5e7eb;">Location</th>
            <td style="padding: 8px 12px; border: 1px solid #e5e7eb;">${location}</td>
          </tr>` : ''}
        </table>
        <a href="${FRONTEND_URL}/admin/strata" style="
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 10px 20px;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 600;
        ">View in Admin Portal</a>
      </div>
    `,
  });
}
