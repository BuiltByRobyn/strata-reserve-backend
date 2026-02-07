// Lookup Service - CRUD operations for lookup tables
import prisma from '../lib/prismaClient';

// ============================================
// User Types
// ============================================
export const getUserTypes = async () => {
  return prisma.userType.findMany({
    orderBy: { userTypeId: 'asc' }
  });
};

export const getUserTypeById = async (id: number) => {
  return prisma.userType.findUnique({
    where: { userTypeId: id }
  });
};

// ============================================
// Legal Types
// ============================================
export const getLegalTypes = async () => {
  return prisma.legalType.findMany({
    orderBy: { legalTypeId: 'asc' }
  });
};

export const getLegalTypeById = async (id: number) => {
  return prisma.legalType.findUnique({
    where: { legalTypeId: id }
  });
};

// ============================================
// Property Types
// ============================================
export const getPropertyTypes = async () => {
  return prisma.propertyType.findMany({
    orderBy: { propertyTypeId: 'asc' }
  });
};

export const getPropertyTypeById = async (id: number) => {
  return prisma.propertyType.findUnique({
    where: { propertyTypeId: id }
  });
};

export const updatePropertyTypeDescription = async (id: number, description: string | null) => {
  return prisma.propertyType.update({
    where: { propertyTypeId: id },
    data: { description }
  });
};

// ============================================
// Services
// ============================================
export const getServices = async () => {
  return prisma.service.findMany({
    orderBy: { serviceId: 'asc' }
  });
};

export const getServiceById = async (id: number) => {
  return prisma.service.findUnique({
    where: { serviceId: id }
  });
};

export const getDocumentTypes = async () => {
  return prisma.documentType.findMany({
    orderBy: { documentTypeId: 'asc' }
  });
};

export const getReviewStatuses = async () => {
  return prisma.reviewStatus.findMany({
    orderBy: { reviewStatusId: 'asc' }
  });
};
