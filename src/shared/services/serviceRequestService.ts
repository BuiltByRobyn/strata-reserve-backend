import prisma from '../lib/prismaClient';
import type { CreateServiceRequestInput } from '../types/serviceRequest.types';

export const getServiceRequests = async (filters?: { strataId?: number; archived?: boolean }) => {
  return prisma.serviceRequest.findMany({
    where: {
      ...(filters?.strataId ? { strataId: filters.strataId } : {}),
      ...(filters?.archived !== undefined ? { archived: filters.archived } : {})
    },
    orderBy: { requestDate: 'desc' },
    include: {
      service: { select: { serviceId: true, serviceName: true } },
      strata: { select: { strataId: true, strataPlan: true, complexName: true } },
      requestedBy: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      _count: {
        select: { questionResponses: true, serviceRequestDocuments: true, appointments: true }
      }
    }
  });
};

export const getServiceRequestById = async (id: number) => {
  return prisma.serviceRequest.findUnique({
    where: { serviceRequestId: id },
    include: {
      service: true,
      strata: true,
      requestedBy: { select: { id: true, firstName: true, lastName: true, displayName: true, email: true } },
      questionResponses: {
        include: {
          question: true,
          answeredBy: { select: { id: true, firstName: true, lastName: true, displayName: true } },
          multipleChoiceOption: true
        }
      },
      serviceRequestDocuments: {
        include: {
          documentType: { select: { documentTypeId: true, typeName: true } },
          uploadedBy: { select: { id: true, firstName: true, lastName: true, displayName: true } },
          reviewStatus: { select: { reviewStatusId: true, statusName: true } }
        }
      },
      appointments: true,
      appointmentRequests: true
    }
  });
};

export const getActiveByStrata = async (strataId: number) => {
  return prisma.serviceRequest.findFirst({
    where: { strataId, archived: false },
    include: {
      service: { select: { serviceId: true, serviceName: true } },
      strata: { select: { strataId: true, strataPlan: true, complexName: true } },
      requestedBy: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      _count: {
        select: { questionResponses: true, serviceRequestDocuments: true, appointments: true }
      }
    }
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
      requestedBy: { select: { id: true, firstName: true, lastName: true, displayName: true } }
    }
  });
};

export const deleteServiceRequest = async (id: number) => {
  return prisma.serviceRequest.delete({
    where: { serviceRequestId: id }
  });
};
