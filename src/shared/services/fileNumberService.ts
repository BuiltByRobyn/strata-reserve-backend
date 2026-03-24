import prisma from '../lib/prismaClient';
import type { CreateFileNumberInput } from '../types/fileNumber.types';
import { fileNumberIncludeList, profileSelectBrief, profileSelectWithEmail, documentIncludeCompact } from '../constants/prismaIncludes';
import { validateFileNumber } from '../helpers/fileNumberUtils';
import { mostRecentAnniversary } from '../helpers/dateUtils';

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
        where: {
          items: {
            every: {
              reviewStatus: { statusName: 'Approved' }
            }
          }
        },
        orderBy: { reviewedAt: 'desc' },
        take: 1,
        select: { reviewedAt: true }
      },
      questionResponses: {
        where: { archivedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: { updatedAt: true }
      }
    }
  });

  return results.map(({ documentReviews, questionResponses, ...sr }) => ({
    ...sr,
    latestDocumentFinalizedDate: documentReviews[0]?.reviewedAt ?? null,
    latestSurveyAnswerDate: questionResponses[0]?.updatedAt ?? null,
  }));
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

  return prisma.fileNumber.create({
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
      requestedBy: { select: profileSelectBrief }
    }
  });
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

  const requiredQuestionIds = srQuestions
    .filter(sq => effectiveTypeIds.size === 0 || effectiveTypeIds.has(sq.propertyTypeId))
    .map(sq => sq.question.questionId);

  const responses = await prisma.questionResponse.findMany({
    where: { fileId: id, archivedAt: null },
    select: { questionId: true },
  });
  const answeredIds = new Set(responses.map(r => r.questionId));

  const unanswered = requiredQuestionIds.filter(qId => !answeredIds.has(qId));
  if (unanswered.length > 0) {
    const err = new Error(`${unanswered.length} required question(s) have not been answered`) as Error & { code: string };
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  return prisma.fileNumber.update({
    where: { fileId: id },
    data: {
      submittedForReviewDate: new Date(),
      status: 'Pending Approval',
    },
    include: fileNumberIncludeList,
  });
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
  const sr = await prisma.fileNumber.findUnique({
    where: { fileId },
  });

  if (!sr) throw new Error('Service request not found');

  return prisma.fileNumber.update({
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
