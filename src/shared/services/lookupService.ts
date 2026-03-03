import prisma from '../lib/prismaClient';

export const getUserTypes = async () => {
  return prisma.userType.findMany({
    orderBy: { userTypeId: 'asc' }
  });
};

export const getLegalTypes = async () => {
  return prisma.legalType.findMany({
    orderBy: { legalTypeId: 'asc' }
  });
};

export const getPropertyTypes = async () => {
  return prisma.propertyType.findMany({
    orderBy: { sortOrder: 'asc' }
  });
};

export const getServices = async () => {
  return prisma.service.findMany({
    orderBy: { serviceId: 'asc' }
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

export const getSections = async () => {
  return prisma.section.findMany({
    orderBy: { sectionId: 'asc' }
  });
};

export const getQuestionTypes = async () => {
  return prisma.questionType.findMany({
    orderBy: { questionTypeId: 'asc' }
  });
};

export const getLocations = async () => {
  return prisma.location.findMany({
    orderBy: { locationName: 'asc' }
  });
};
