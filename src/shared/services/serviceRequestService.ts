import prisma from '../lib/prismaClient';
import type { CreateServiceRequestInput } from '../types/serviceRequest.types';
import { serviceRequestIncludeList, profileSelectBrief, profileSelectWithEmail, documentIncludeCompact } from '../constants/prismaIncludes';

export const getServiceRequests = async (filters?: { strataId?: number; archived?: boolean }) => {
  return prisma.serviceRequest.findMany({
    where: {
      ...(filters?.strataId ? { strataId: filters.strataId } : {}),
      ...(filters?.archived !== undefined ? { archived: filters.archived } : {})
    },
    orderBy: { requestDate: 'desc' },
    include: serviceRequestIncludeList
  });
};

export const getServiceRequestById = async (id: number) => {
  return prisma.serviceRequest.findUnique({
    where: { serviceRequestId: id },
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
      serviceRequestDocuments: {
        include: documentIncludeCompact
      },
      appointments: true,
      appointmentRequests: true
    }
  });
};

export const getActiveByStrata = async (strataId: number) => {
  return prisma.serviceRequest.findFirst({
    where: { strataId, archived: false },
    include: serviceRequestIncludeList
  });
};

export const getActiveByProfile = async (profileId: string) => {
  return prisma.serviceRequest.findFirst({
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
    include: serviceRequestIncludeList
  });
};

export const createServiceRequest = async (data: CreateServiceRequestInput) => {
  const existing = await prisma.serviceRequest.findFirst({
    where: { strataId: data.strataId, archived: false }
  });

  if (existing) {
    throw new Error('This strata already has an active service request');
  }

  return prisma.serviceRequest.create({
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
  const sr = await prisma.serviceRequest.findUnique({
    where: { serviceRequestId: id },
    include: {
      strata: { select: { strataPropertyTypes: { select: { propertyTypeId: true } } } },
    },
  });
  if (!sr) throw new Error('Service request not found');

  const propertyTypeIds = sr.strata.strataPropertyTypes.map(spt => spt.propertyTypeId);
  const questions = await prisma.question.findMany({
    where: propertyTypeIds.length > 0 ? {
      OR: [
        { questionPropertyTypes: { none: {} } },
        { questionPropertyTypes: { some: { propertyTypeId: { in: propertyTypeIds } } } },
      ],
    } : {},
    select: { questionId: true, isRequired: true },
  });

  const requiredQuestionIds = questions.filter(q => q.isRequired).map(q => q.questionId);

  const responses = await prisma.questionResponse.findMany({
    where: { serviceRequestId: id, archivedAt: null },
    select: { questionId: true },
  });
  const answeredIds = new Set(responses.map(r => r.questionId));

  const unanswered = requiredQuestionIds.filter(qId => !answeredIds.has(qId));
  if (unanswered.length > 0) {
    const err = new Error(`${unanswered.length} required question(s) have not been answered`) as Error & { code: string };
    err.code = 'VALIDATION_ERROR';
    throw err;
  }

  return prisma.serviceRequest.update({
    where: { serviceRequestId: id },
    data: {
      submittedForReviewDate: new Date(),
      status: 'Pending Approval',
    },
    include: serviceRequestIncludeList,
  });
};

export const deleteServiceRequest = async (id: number, authToken?: string) => {
  const sr = await prisma.serviceRequest.findUnique({
    where: { serviceRequestId: id },
    select: {
      strata: { select: { strataPlan: true } },
      serviceRequestDocuments: { select: { filePath: true } }
    }
  });

  if (sr?.serviceRequestDocuments.length && authToken) {
    try {
      const { supabase } = await import('../lib/supabaseClient');
      await supabase.functions.invoke('archive-sr-documents', {
        body: { serviceRequestId: id, strataPlan: sr.strata.strataPlan },
        headers: { Authorization: `Bearer ${authToken}` }
      });
    } catch (err) {
      console.error('Failed to archive Dropbox files:', err);
    }
  }

  return prisma.serviceRequest.delete({
    where: { serviceRequestId: id }
  });
};
