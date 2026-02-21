import prisma from '../lib/prismaClient';
import type { SaveResponseInput } from '../types/question.types';

export const getSurveyQuestions = async (propertyTypeIds?: number[]) => {
  const questions = await prisma.question.findMany({
    where: propertyTypeIds?.length ? {
      OR: [
        { questionPropertyTypes: { none: {} } },
        { questionPropertyTypes: { some: { propertyTypeId: { in: propertyTypeIds } } } }
      ]
    } : {},
    include: {
      questionType: true,
      multipleChoiceOptions: { orderBy: { sortOrder: 'asc' } },
    },
    orderBy: { questionId: 'asc' }
  });

  return questions.map(q => ({
    questionId: q.questionId,
    questionText: q.questionText,
    isRequired: q.isRequired,
    informationText: q.informationText,
    questionCategory: q.questionCategory,
    questionType: q.questionType.questionTypeName,
    sortOrder: q.questionId,
    multipleChoiceOptions: q.multipleChoiceOptions.map(o => ({
      optionId: o.multipleChoiceOptionId,
      optionText: o.optionText,
      sortOrder: o.sortOrder
    }))
  }));
};

export const getResponsesByServiceRequest = async (serviceRequestId: number) => {
  return prisma.questionResponse.findMany({
    where: { serviceRequestId, archivedAt: null },
    include: {
      answeredBy: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      multipleChoiceOption: { select: { multipleChoiceOptionId: true, optionText: true } }
    }
  });
};

export const getArchivedResponsesByServiceRequest = async (serviceRequestId: number) => {
  return prisma.questionResponse.findMany({
    where: { serviceRequestId, archivedAt: { not: null } },
    include: {
      answeredBy: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      multipleChoiceOption: { select: { multipleChoiceOptionId: true, optionText: true } },
      question: {
        select: {
          questionId: true,
          questionText: true,
          isRequired: true,
          informationText: true,
          questionCategory: true,
          questionType: { select: { questionTypeName: true } },
          multipleChoiceOptions: {
            orderBy: { sortOrder: 'asc' },
            select: { multipleChoiceOptionId: true, optionText: true, sortOrder: true },
          },
        },
      },
    },
    orderBy: { archivedAt: 'desc' },
  });
};

export const saveResponses = async (responses: SaveResponseInput[]) => {
  if (responses.length === 0) return [];

  const serviceRequestIds = [...new Set(responses.map(r => r.serviceRequestId))];

  const existingResponses = await prisma.questionResponse.findMany({
    where: {
      serviceRequestId: { in: serviceRequestIds },
      questionId: { in: responses.map(r => r.questionId) },
      archivedAt: null,
    },
    select: { responseId: true, serviceRequestId: true, questionId: true }
  });

  const existingMap = new Map(
    existingResponses.map(r => [`${r.serviceRequestId}-${r.questionId}`, r.responseId])
  );

  return prisma.$transaction(async (tx) => {
    const results = [];
    for (const resp of responses) {
      const key = `${resp.serviceRequestId}-${resp.questionId}`;
      const existingId = existingMap.get(key);
      const data = {
        responseText: resp.responseText ?? null,
        responseDate: resp.responseDate ? new Date(resp.responseDate) : null,
        responseNumber: resp.responseNumber ?? null,
        responseBoolean: resp.responseBoolean ?? null,
        multipleChoiceOptionId: resp.multipleChoiceOptionId ?? null,
        answeredByProfileId: resp.answeredByProfileId,
      };

      if (existingId) {
        await tx.questionResponse.update({
          where: { responseId: existingId },
          data: { archivedAt: new Date() },
        });
        results.push(await tx.questionResponse.create({
          data: {
            serviceRequestId: resp.serviceRequestId,
            questionId: resp.questionId,
            ...data,
          },
        }));
      } else {
        results.push(await tx.questionResponse.create({
          data: {
            serviceRequestId: resp.serviceRequestId,
            questionId: resp.questionId,
            ...data,
          },
        }));
      }
    }
    return results;
  });
};

export const getSurveySections = async (serviceId: number) => {
  const sections = [
    { key: 'exterior', label: 'Exterior', description: 'Information relating to the public facing areas of your property' },
    { key: 'interior', label: 'Interior', description: 'Information relating to the private areas of your property' },
    { key: 'services', label: 'Services', description: 'Information relating to the services available within your property' },
    { key: 'clubhouse', label: 'Clubhouse', description: 'Information relating to the public facing areas of your property' },
    { key: 'amenity', label: 'Amenity Room', description: 'Information relating to additional amenities within your property' },
    { key: 'legal', label: 'Legal', description: 'Information relating to the legal standing of your property' },
    { key: 'council', label: 'Council Concerns', description: 'Information relating to specific concerns regarding your property' },
  ];
  return sections;
};
