import prisma from '../lib/prismaClient';
import type { CreateFileNumberInput } from '../types/file-number.types';
import { fileNumberIncludeList, profileSelectBrief, profileSelectWithEmail, documentIncludeCompact } from '../constants/prismaIncludes';
import { validateFileNumber } from '../helpers/fileNumberUtils';
import { surveyQuestionKey } from '../helpers/surveyUtils';
import { mostRecentAnniversary } from '../helpers/dateUtils';
import { sendFileCreatedEmail, sendAppointmentBookingOpenEmail, sendAdminAppointmentBookingOpenEmail, sendSurveyFinalizedEmail, sendAdminSurveyFinalizedEmail } from '../lib/emailService';
import * as fnDocRequirementService from './fnDocRequirementService';

export const getFileNumbers = async (filters?: { strataId?: number; archived?: boolean }) => {
  const results = await prisma.fileNumber.findMany({
    where: {
      ...(filters?.strataId ? { strataId: filters.strataId } : {}),
      ...(filters?.archived !== undefined ? { archived: filters.archived } : {})
    },
    orderBy: { requestDate: 'desc' },
    include: {
      ...fileNumberIncludeList,
      documentReviews: {
        orderBy: { reviewedAt: 'desc' },
        take: 1,
        include: {
          items: {
            select: { reviewStatus: { select: { statusName: true } } }
          }
        }
      },
      inAppNotifications: {
        where: { type: 'docs_ready_for_review' },
        take: 1,
        select: { notificationId: true }
      },
      questionResponses: {
        where: { archivedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: { updatedAt: true }
      }
    }
  });

  return results.map(({ documentReviews, inAppNotifications, questionResponses, ...sr }) => {
    const latestReview = documentReviews[0] ?? null;
    const allApproved = latestReview
      ? latestReview.items.every(i => i.reviewStatus.statusName.toLowerCase().includes('approv'))
      : false;
    return {
      ...sr,
      latestDocumentFinalizedDate: (latestReview && allApproved) ? latestReview.reviewedAt : null,
      latestDocumentReviewDate: latestReview?.reviewedAt ?? null,
      docsReadyForReview: inAppNotifications.length > 0,
      latestSurveyAnswerDate: questionResponses[0]?.updatedAt ?? null,
    };
  });
};

export const getFileNumberById = async (id: number) => {
  return prisma.fileNumber.findUnique({
    where: { fileId: id },
    include: {
      service: true,
      strata: true,
      requestedBy: { select: profileSelectWithEmail },
      questionResponses: {
        include: {
          question: true,
          answeredBy: { select: profileSelectBrief },
          multipleChoiceOption: true
        }
      },
      fileNumberDocuments: {
        include: documentIncludeCompact
      },
      appointments: true,
      appointmentRequests: true
    }
  });
};

export const getActiveByStrata = async (strataId: number) => {
  return prisma.fileNumber.findFirst({
    where: { strataId, archived: false },
    include: fileNumberIncludeList
  });
};

export const getActiveByProfile = async (profileId: string) => {
  return prisma.fileNumber.findFirst({
    where: {
      archived: false,
      OR: [
        {
          strata: {
            strataProfiles: {
              some: { profileId }
            }
          }
        },
        {
          requestedByProfileId: profileId
        }
      ]
    },
    orderBy: { requestDate: 'desc' },
    include: fileNumberIncludeList
  });
};

export const createFileNumber = async (data: CreateFileNumberInput) => {
  if (!validateFileNumber(data.fileNumber)) {
    throw new Error('INVALID_FORMAT');
  }

  const existing = await prisma.fileNumber.findFirst({
    where: { strataId: data.strataId, archived: false }
  });

  if (existing) {
    throw new Error('This strata already has an active file number');
  }

  const strata = await prisma.strata.findUnique({
    where: { strataId: data.strataId },
    select: { fiscalYearEnd: true }
  });

  const created = await prisma.fileNumber.create({
    data: {
      fileNumber: data.fileNumber,
      serviceId: data.serviceId,
      strataId: data.strataId,
      requestedByProfileId: data.requestedByProfileId,
      status: 'Draft',
      notes: data.notes,
      fiscalYearEnd: strata?.fiscalYearEnd ? mostRecentAnniversary(strata.fiscalYearEnd) : null
    },
    include: {
      service: { select: { serviceId: true, serviceName: true } },
      strata: { select: { strataId: true, strataPlan: true, complexName: true } },
      requestedBy: { select: { ...profileSelectWithEmail, userTypeId: true } }
    }
  });

  // Always notify the assigned client of this strata, regardless of who triggered the creation
  const clientStrataProfile = await prisma.strataProfile.findFirst({
    where: {
      strataId: data.strataId,
      profile: { userTypeId: 3 },
    },
    select: { profile: { select: { email: true } } },
  });
  const clientEmail = clientStrataProfile?.profile?.email;
  if (clientEmail) {
    sendFileCreatedEmail({
      to: clientEmail,
      strataNumber: created.strata?.strataPlan || '',
    }).catch((err) => console.error('Failed to send file created email:', err));
  } else {
    console.warn(`[fileNumberService] No client email found for strata ${data.strataId} — file-creation email not sent`);
  }

  return created;
};

export const updateFileNumber = async (id: number, fileNumber: string) => {
  if (!validateFileNumber(fileNumber)) {
    throw new Error('INVALID_FORMAT');
  }
  return prisma.fileNumber.update({
    where: { fileId: id },
    data: { fileNumber },
    include: fileNumberIncludeList
  });
};

export const submitForReview = async (id: number, profileId: string) => {
  const sr = await prisma.fileNumber.findUnique({
    where: { fileId: id },
    include: { strata: { select: { strataPlan: true } } },
  });
  if (!sr) throw new Error('Service request not found');

  const [srQuestions, surveyRequirements, profilePropertyTypes] = await Promise.all([
    prisma.fnSurveyQuestion.findMany({
      where: { fileId: id },
      include: { question: { select: { questionId: true } } },
    }),
    prisma.fileNumberSurveyRequirement.findMany({
      where: { fileId: id },
      select: { propertyTypeId: true },
    }),
    prisma.strataProfilePropertyType.findMany({
      where: { strataProfile: { profileId, strataId: sr.strataId } },
      select: { propertyTypeId: true },
    }),
  ]);

  const configuredTypeIds = new Set(surveyRequirements.map(r => r.propertyTypeId));
  const profileTypeIds = new Set(profilePropertyTypes.map(r => r.propertyTypeId));

  const effectiveTypeIds = profileTypeIds.size > 0
    ? new Set([...configuredTypeIds].filter(id => profileTypeIds.has(id)))
    : configuredTypeIds;

  const requiredQuestionKeys = srQuestions
    .filter(sq => effectiveTypeIds.size === 0 || effectiveTypeIds.has(sq.propertyTypeId))
    .map(sq => surveyQuestionKey(sq.question.questionId, sq.propertyTypeId));

  const responses = await prisma.questionResponse.findMany({
    where: { fileId: id, archivedAt: null },
    select: { questionId: true, propertyTypeId: true },
  });
  const answeredKeys = new Set(responses.map(r => surveyQuestionKey(r.questionId, r.propertyTypeId)));

  const unanswered = requiredQuestionKeys.filter(key => !answeredKeys.has(key));
  if (unanswered.length > 0) {
    const err = new Error(`${unanswered.length} required question(s) have not been answered`) as Error & { code: string };
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  await prisma.fileNumberSurveyRequirement.updateMany({
    where: {
      fileId: id,
      propertyTypeId: { in: [...effectiveTypeIds] },
      finalizedAt: null,
    },
    data: { finalizedAt: new Date(), finalizedByProfileId: profileId },
  });

  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { email: true, displayName: true, firstName: true, lastName: true },
  });

  const surveyDate = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });

  if (profile?.email) {
    try {
      await sendSurveyFinalizedEmail({
        to: profile.email,
        strataNumber: sr.strata?.strataPlan || '',
        finalizedDate: surveyDate,
      });
    } catch (err) {
      console.error('Failed to send survey finalized email:', err);
    }
  }

  const fileDetails = await prisma.fileNumber.findUnique({
    where: { fileId: id },
    include: fileNumberIncludeList,
  });
  if (fileDetails) {
    const clientStrataProfile = await prisma.strataProfile.findFirst({
      where: {
        strataId: sr.strataId,
        profile: { userTypeId: { notIn: [1, 2, 4] } },
      },
      select: { profile: { select: { displayName: true, firstName: true, lastName: true } } },
    });
    const clientProfile = clientStrataProfile?.profile;
    const clientName = clientProfile?.displayName
      || [clientProfile?.firstName, clientProfile?.lastName].filter(Boolean).join(' ')
      || profile?.displayName
      || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ')
      || 'Unknown client';
    const propertyAddress = fileDetails.strata?.complexName || fileDetails.strata?.strataPlan || '';
    try {
      await sendAdminSurveyFinalizedEmail({
        fileNumber: fileDetails.fileNumber || '',
        strataNumber: fileDetails.strata?.strataPlan || '',
        propertyAddress,
        clientName,
        surveyDate,
        surveyCompleted: 'Yes',
      });
    } catch (err) {
      console.error('Failed to send admin survey finalized email:', err);
    }
  }

  const updated = await tryFinalizeApplication(id);
  return updated;
};

export const tryFinalizeApplication = async (fileId: number) => {
  const existing = await prisma.fileNumber.findUnique({
    where: { fileId },
    select: { submittedForReviewDate: true },
  });
  if (existing?.submittedForReviewDate) {
    return prisma.fileNumber.findUnique({ where: { fileId }, include: fileNumberIncludeList });
  }

  const unfinalizedSurveys = await prisma.fileNumberSurveyRequirement.count({
    where: { fileId, finalizedAt: null },
  });
  if (unfinalizedSurveys > 0) {
    return prisma.fileNumber.findUnique({ where: { fileId }, include: fileNumberIncludeList });
  }

  const allDocsAddressed = await fnDocRequirementService.checkAllRequirementsAnswered(fileId);
  if (!allDocsAddressed) {
    return prisma.fileNumber.findUnique({ where: { fileId }, include: fileNumberIncludeList });
  }

  const updated = await prisma.fileNumber.update({
    where: { fileId },
    data: { submittedForReviewDate: new Date(), status: 'Pending Approval' },
    include: fileNumberIncludeList,
  });

  return updated;
};

export const offerAppointment = async (
  fileId: number,
  offeredByProfileId: string,
  offerData?: {
    dueDate?: string;
    appointmentTypeId?: number;
    inspectorProfileId?: string;
    secondInspectorProfileId?: string;
    notes?: string;
  }
) => {
  const offeredType = offerData?.appointmentTypeId
    ? await prisma.appointmentType.findUnique({
      where: { appointmentTypeId: offerData.appointmentTypeId },
      select: { typeName: true, isDraftMeeting: true },
    })
    : null;

  const confirmedAppointment = await prisma.appointment.findFirst({
    where: {
      fileId,
      status: { in: ['Scheduled', 'Rescheduled'] },
    },
    select: { appointmentId: true },
  });

  if (confirmedAppointment && !offeredType?.isDraftMeeting) {
    throw new Error(
      "You can't send a new appointment offer because this file already has a confirmed appointment. Please cancel/reschedule the existing appointment first, or send a Draft Meeting offer when eligible."
    );
  }
  if (offeredType?.isDraftMeeting) {
    const completedInspection = await prisma.appointment.findFirst({
      where: {
        fileId,
        status: 'Completed',
        appointmentType: { isDraftMeeting: false },
      },
      select: { appointmentId: true },
    });
    if (!completedInspection) {
      throw new Error('To offer a Draft Meeting, the strata must complete an inspection first.');
    }
  }

  const sr = await prisma.fileNumber.findUnique({
    where: { fileId },
    select: {
      fileNumber: true,
      requestedBy: { select: { email: true } },
      ...(offerData?.appointmentTypeId && {
        appointmentOfferType: { select: { typeName: true, isDraftMeeting: true } },
      }),
    },
  });

  if (!sr) throw new Error('Service request not found');

  const updated = await prisma.fileNumber.update({
    where: { fileId },
    data: {
      appointmentOfferedAt: new Date(),
      appointmentOfferedByProfileId: offeredByProfileId,
      appointmentDueDate: offerData?.dueDate ? new Date(offerData.dueDate) : null,
      appointmentOfferTypeId: offerData?.appointmentTypeId ?? null,
      appointmentOfferInspectorId: offerData?.inspectorProfileId ?? null,
      appointmentOfferSecondInspectorId: offerData?.secondInspectorProfileId ?? null,
      appointmentOfferNotes: offerData?.notes ?? null,
    },
    include: fileNumberIncludeList,
  });

  if (sr.requestedBy?.email) {
    let meetingType = 'Inspection';
    if (offeredType) {
      meetingType = offeredType.isDraftMeeting ? 'Draft Meeting' : (offeredType.typeName || 'Inspection');
    }

    const bookingDeadline = offerData?.dueDate
      ? new Date(offerData.dueDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
      : '';

    sendAppointmentBookingOpenEmail({
      to: sr.requestedBy.email,
      strataNumber: updated.strata?.strataPlan || '',
      meetingType,
      bookingDeadline: bookingDeadline || undefined,
    }).catch((err) => console.error('Failed to send booking open email:', err));

    sendAdminAppointmentBookingOpenEmail({
      fileNumber: updated.fileNumber || '',
      strataNumber: updated.strata?.strataPlan || '',
      meetingType,
      bookingDeadline: bookingDeadline || 'N/A',
    }).catch((err) => console.error('Failed to send admin booking open email:', err));
  }

  return updated;
};

export const deleteFileNumber = async (id: number, authToken?: string) => {
  const sr = await prisma.fileNumber.findUnique({
    where: { fileId: id },
    select: {
      strata: { select: { strataPlan: true } },
      fileNumberDocuments: { select: { filePath: true } }
    }
  });

  if (sr?.fileNumberDocuments.length && authToken) {
    try {
      const { supabase } = await import('../lib/supabaseClient');
      await supabase.functions.invoke('archive-fn-documents', {
        body: { fileId: id, strataPlan: sr.strata.strataPlan },
        headers: { Authorization: `Bearer ${authToken}` }
      });
    } catch (err) {
      console.error('Failed to archive Dropbox files:', err);
    }
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.appointment.updateMany({
    where: {
      fileId: id,
      appointmentDate: { gte: today },
      status: { not: 'Cancelled' },
    },
    data: { status: 'Cancelled' },
  });

  return prisma.fileNumber.update({
    where: { fileId: id },
    data: { archived: true, archivedDate: new Date() }
  });
};
