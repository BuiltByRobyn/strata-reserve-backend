import prisma from '../lib/prismaClient';
import type { CreateFileNumberInput } from '../types/fileNumber.types';
import { fileNumberIncludeList, profileSelectBrief, profileSelectWithEmail, documentIncludeCompact } from '../constants/prismaIncludes';

export const getFileNumbers = async (filters?: { strataId?: number; archived?: boolean }) => {
  const results = await prisma.fileNumber.findMany({
    where: {
      ...(filters?.strataId ? { strataId: filters.strataId } : {}),
      ...(filters?.archived !== undefined ? { archived: filters.archived } : {})
    },
    orderBy: { requestDate: 'desc' },
    include: {
      ...fileNumberIncludeList,
      fileNumberDocuments: {
        orderBy: { uploadedAt: 'desc' },
        take: 1,
        select: { uploadedAt: true }
      },
      questionResponses: {
        where: { archivedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 1,
        select: { updatedAt: true }
      }
    }
  });

  return results.map(({ fileNumberDocuments, questionResponses, ...sr }) => ({
    ...sr,
    latestDocumentUploadDate: fileNumberDocuments[0]?.uploadedAt ?? null,
    latestSurveyAnswerDate: questionResponses[0]?.updatedAt ?? null,
  }));
};

export const getFileNumberById = async (id: number) => {
  return prisma.fileNumber.findUnique({
    where: { fileNumberId: id },
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
  const existing = await prisma.fileNumber.findFirst({
    where: { strataId: data.strataId, archived: false }
  });

  if (existing) {
    throw new Error('This strata already has an active file number');
  }

  return prisma.fileNumber.create({
    data: {
      serviceId: data.serviceId,
      strataId: data.strataId,
      requestedByProfileId: data.requestedByProfileId,
      status: 'Draft',
      notes: data.notes
    },
    include: {
      service: { select: { serviceId: true, serviceName: true } },
      strata: { select: { strataId: true, strataPlan: true, complexName: true } },
      requestedBy: { select: profileSelectBrief }
    }
  });
};

export const submitForReview = async (id: number) => {
  const sr = await prisma.fileNumber.findUnique({
    where: { fileNumberId: id },
  });
  if (!sr) throw new Error('Service request not found');

  // Only validate questions actually assigned to this SR (respects surveyRequirements)
  const srQuestions = await prisma.fnSurveyQuestion.findMany({
    where: { fileNumberId: id },
    include: { question: { select: { questionId: true, isRequired: true, parentQuestionId: true } } },
  });

  const requiredQuestionIds = srQuestions
    .filter(sq => sq.question.isRequired && sq.question.parentQuestionId == null)
    .map(sq => sq.question.questionId);

  const responses = await prisma.questionResponse.findMany({
    where: { fileNumberId: id, archivedAt: null },
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
    where: { fileNumberId: id },
    data: {
      submittedForReviewDate: new Date(),
      status: 'Pending Approval',
    },
    include: fileNumberIncludeList,
  });
};

export const offerAppointment = async (
  fileNumberId: number,
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
    where: { fileNumberId },
  });

  if (!sr) throw new Error('Service request not found');

  return prisma.fileNumber.update({
    where: { fileNumberId },
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
    where: { fileNumberId: id },
    select: {
      strata: { select: { strataPlan: true } },
      fileNumberDocuments: { select: { filePath: true } }
    }
  });

  if (sr?.fileNumberDocuments.length && authToken) {
    try {
      const { supabase } = await import('../lib/supabaseClient');
      await supabase.functions.invoke('archive-fn-documents', {
        body: { fileNumberId: id, strataPlan: sr.strata.strataPlan },
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
      fileNumberId: id,
      appointmentDate: { gte: today },
      status: { not: 'Cancelled' },
    },
    data: { status: 'Cancelled' },
  });

  return prisma.fileNumber.delete({
    where: { fileNumberId: id }
  });
};
