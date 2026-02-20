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
  return prisma.serviceRequest.update({
    where: { serviceRequestId: id },
    data: {
      submittedForReviewDate: new Date(),
      status: 'Pending Approval',
    },
    include: serviceRequestIncludeList,
  });
};

export const deleteServiceRequest = async (id: number) => {
  return prisma.serviceRequest.delete({
    where: { serviceRequestId: id }
  });
};
