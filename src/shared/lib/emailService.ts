import { Resend } from "resend";
import prisma from "./prismaClient";
import { supabase } from "./supabaseClient";
import type {
  NewStrataEmailParams,
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
} from "../types/email.types";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ||
  "BuiltByRobyn <noreply@builtbyrobyn.com>";
const FRONTEND_URL = (
  process.env.FRONTEND_URL || "https://your-app-url.com"
).replace(/\/$/, "");

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

async function getAdminEmails(): Promise<string[]> {
  const adminProfiles = await prisma.profile.findMany({
    where: { userTypeId: 1 },
    select: { id: true },
  });
  const adminIds = adminProfiles.map((p) => p.id);
  const { data: authUsers } = await supabase.auth.admin.listUsers({
    perPage: 1000,
  });
  return (authUsers?.users ?? [])
    .filter((u) => adminIds.includes(u.id) && !!u.email)
    .map((u) => u.email as string);
}

export async function sendPropertyTypeUpdatedEmail(
  params: PropertyTypeUpdatedEmailParams,
): Promise<void> {
  if (!resend || !params.to) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject:
      "Your property type change request has been reviewed – BuiltByRobyn",
    template: {
      id: "property-type-updated-client-1",
      variables: {
        StrataNumber: params.strataNumber,
        Status: params.status,
        DecisionDate: params.decisionDate,
        SiteURL: FRONTEND_URL,
      },
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendFileCompletionEmail(
  params: FileCompletionEmailParams,
): Promise<void> {
  if (!resend || !params.to) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Your file has been completed – BuiltByRobyn",
    template: {
      id: "file-completion-notification-client-1",
      variables: {
        StrataNumber: params.strataNumber,
        CompletedDate: params.completedDate,
        ReportURL: `${FRONTEND_URL}/documents`,
        SiteURL: FRONTEND_URL,
      },
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendAdminPhoneNumberUpdatedEmail(
  params: AdminPhoneNumberUpdatedEmailParams,
): Promise<void> {
  if (!resend) return;
  const to = await getAdminEmails();
  if (to.length === 0) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject:
      "[Admin Alert] A client has updated their phone number – BuiltByRobyn",
    template: {
      id: "client-phone-number-alert-admin-2",
      variables: {
        ClientName: params.clientName,
        ClientEmail: params.clientEmail,
        OldPhone: params.oldPhone,
        NewPhone: params.newPhone,
        ChangedAt: params.changedAt,
        AdminURL: `${FRONTEND_URL}/admin`,
        SiteURL: FRONTEND_URL,
      },
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendPhoneNumberUpdatedEmail(
  params: PhoneNumberUpdatedEmailParams,
): Promise<void> {
  if (!resend || !params.to) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Your phone number has been updated – BuiltByRobyn",
    template: {
      id: "phone-number-updated-client-1",
      variables: {
        NewPhone: params.newPhone,
        SiteURL: FRONTEND_URL,
      },
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendAdminAppointmentCancelledEmail(
  params: AdminAppointmentCancelledEmailParams,
): Promise<void> {
  if (!resend) return;
  const to = await getAdminEmails();
  if (to.length === 0) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Appointment Cancelled: ${params.fileNumber} — BuiltByRobyn`,
    template: {
      id: "appointment-cancellation-alert-admin-2",
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
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendAdminAppointmentBookingRequestEmail(
  params: AdminAppointmentBookingRequestEmailParams,
): Promise<void> {
  if (!resend) return;
  const to = await getAdminEmails();
  if (to.length === 0) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `New Appointment Booking Request: ${params.fileNumber} — BuiltByRobyn`,
    template: {
      id: "appointment-booking-alert-admin-2",
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
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendAdminPropertyTypeChangeRequestEmail(
  params: AdminPropertyTypeChangeRequestEmailParams,
): Promise<void> {
  if (!resend) return;
  const to = await getAdminEmails();
  if (to.length === 0) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Property Type Change Request: ${params.fileNumber} — BuiltByRobyn`,
    template: {
      id: "property-type-change-request-admin-2",
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
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendAdminDocumentsFinalizedEmail(
  params: AdminDocumentsFinalizedEmailParams,
): Promise<void> {
  if (!resend) return;
  const to = await getAdminEmails();
  if (to.length === 0) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Documents Finalized: ${params.fileNumber} — BuiltByRobyn`,
    template: {
      id: "documents-finalized-alert-admin-2",
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
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendAdminSurveyFinalizedEmail(
  params: AdminSurveyFinalizedEmailParams,
): Promise<void> {
  if (!resend) return;
  const to = await getAdminEmails();
  if (to.length === 0) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Survey Finalized: ${params.fileNumber} — BuiltByRobyn`,
    template: {
      id: "survey-finalized-notification-admin-2",
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
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendSurveyFinalizedEmail(
  params: SurveyFinalizedEmailParams,
): Promise<void> {
  if (!resend || !params.to) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Your survey has been finalized – BuiltByRobyn",
    template: {
      id: "survey-finalized-client-1",
      variables: {
        StrataNumber: params.strataNumber,
        FinalizedDate: params.finalizedDate,
        SiteURL: FRONTEND_URL,
      },
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendDocumentsFinalizedEmail(
  params: DocumentsFinalizedEmailParams,
): Promise<void> {
  if (!resend || !params.to) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Your documents have been finalized – BuiltByRobyn",
    template: {
      id: "documents-finalized-notification-client-1",
      variables: {
        StrataNumber: params.strataNumber,
        FinalizedDate: params.finalizedDate,
        SiteURL: FRONTEND_URL,
      },
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendAppointmentBookingOpenEmail(
  params: AppointmentBookingOpenEmailParams,
): Promise<void> {
  if (!resend || !params.to) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Book your ${params.meetingType} appointment – BuiltByRobyn`,
    template: {
      id: "appointment-booking-open-client-2",
      variables: {
        StrataNumber: params.strataNumber,
        MeetingType: params.meetingType,
        BookingURL: `${FRONTEND_URL}/appointments`,
        BookingDeadline: params.bookingDeadline || "",
        SiteURL: FRONTEND_URL,
      },
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendAdminAppointmentBookingOpenEmail(
  params: AdminAppointmentBookingOpenEmailParams,
): Promise<void> {
  if (!resend) return;
  const to = await getAdminEmails();
  if (to.length === 0) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Booking Now Open: ${params.strataNumber} — ${params.meetingType} — BuiltByRobyn`,
    template: {
      id: "appointment-booking-open-admin-1",
      variables: {
        FileNumber: params.fileNumber,
        StrataNumber: params.strataNumber,
        MeetingType: params.meetingType,
        BookingDeadline: params.bookingDeadline,
        BookingURL: `${FRONTEND_URL}/admin`,
        SiteURL: FRONTEND_URL,
      },
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendMeetingStatusUpdateEmail(
  params: MeetingStatusUpdateEmailParams,
): Promise<void> {
  if (!resend || !params.to) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: `Your meeting request has been ${params.status} – BuiltByRobyn`,
    template: {
      id: "meeting-status-update-client-1",
      variables: {
        StrataNumber: params.strataNumber,
        MeetingType: params.meetingType,
        MeetingStatus: params.status,
        MeetingStatusClass:
          params.status === "Approved"
            ? "approved"
            : params.status === "Rejected"
              ? "denied"
              : "rescheduled",
        MeetingDate: params.meetingDate || "",
        MeetingTime: params.meetingTime || "",
        SiteURL: FRONTEND_URL,
      },
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendPasswordUpdatedEmail(
  params: PasswordUpdatedEmailParams,
): Promise<void> {
  if (!resend || !params.to) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Your password has been updated – BuiltByRobyn",
    template: {
      id: "password-update-confirmation-admin-client",
      variables: {
        SiteURL: FRONTEND_URL,
      },
    },
  });
  if (error) throw new Error(error.message);
}

export async function sendFileCreatedEmail(
  params: FileCreatedEmailParams,
): Promise<void> {
  if (!resend || !params.to) return;

  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: params.to,
    subject: "Your file has been created – BuiltByRobyn",
    template: {
      id: "file-creation-notification-client-1",
      variables: {
        StrataNumber: params.strataNumber,
        SiteURL: FRONTEND_URL,
      },
    },
  });
  if (error) throw new Error(error.message);
}
