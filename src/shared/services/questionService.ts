import prisma from '../lib/prismaClient';
import type { SaveResponseInput } from '../types/question.types';

export const getSurveyQuestionsForSR = async (serviceRequestId: number) => {
  const srQuestions = await prisma.srSurveyQuestion.findMany({
    where: { serviceRequestId },
    include: {
      question: {
        include: {
          questionType: true,
          multipleChoiceOptions: { orderBy: { sortOrder: 'asc' } },
          subQuestions: {
            orderBy: { questionId: 'asc' },
            include: {
              questionType: true,
              multipleChoiceOptions: { orderBy: { sortOrder: 'asc' } }
            }
          }
        }
      },
      propertyType: true
    },
    orderBy: [
      { propertyType: { sortOrder: 'asc' } },
      { questionId: 'asc' }
    ]
  });

  const flatQuestions: any[] = [];

  for (const srq of srQuestions) {
    // Add the parent question
    flatQuestions.push({
      srSurveyQuestionId: srq.srSurveyQuestionId,
      propertyTypeId: srq.propertyTypeId,
      propertyTypeName: srq.propertyType.propertyTypeName,
      questionId: srq.question.questionId,
      parentQuestionId: srq.question.parentQuestionId,
      subLabel: srq.question.subLabel,
      questionText: srq.question.questionText,
      isRequired: srq.question.isRequired,
      informationText: srq.question.informationText,
      questionCategory: srq.question.questionCategory,
      questionType: srq.question.questionType.questionTypeName,
      sortOrder: srq.question.questionId,
      multipleChoiceOptions: srq.question.multipleChoiceOptions.map((o: any) => ({
        optionId: o.multipleChoiceOptionId,
        optionText: o.optionText,
        sortOrder: o.sortOrder
      }))
    });

    // Add nested sub-questions if any
    if (srq.question.subQuestions && srq.question.subQuestions.length > 0) {
      for (const sq of srq.question.subQuestions) {
        flatQuestions.push({
          srSurveyQuestionId: (srq.srSurveyQuestionId * 10000) + sq.questionId, // Fake ID for React key
          propertyTypeId: srq.propertyTypeId,
          propertyTypeName: srq.propertyType.propertyTypeName,
          questionId: sq.questionId,
          parentQuestionId: sq.parentQuestionId,
          subLabel: sq.subLabel,
          questionText: sq.questionText,
          isRequired: sq.isRequired,
          informationText: sq.informationText,
          questionCategory: sq.questionCategory,
          questionType: sq.questionType.questionTypeName,
          sortOrder: sq.questionId,
          multipleChoiceOptions: sq.multipleChoiceOptions.map((o: any) => ({
            optionId: o.multipleChoiceOptionId,
            optionText: o.optionText,
            sortOrder: o.sortOrder
          }))
        });
      }
    }
  }

  return flatQuestions;
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
    select: { responseId: true, serviceRequestId: true, questionId: true, propertyTypeId: true }
  });

  const existingMap = new Map(
    existingResponses.map(r => [`${r.serviceRequestId}-${r.questionId}-${r.propertyTypeId}`, r.responseId])
  );

  return prisma.$transaction(async (tx) => {
    const results = [];
    for (const resp of responses) {
      const key = `${resp.serviceRequestId}-${resp.questionId}-${resp.propertyTypeId}`;
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
      }
      
      results.push(await tx.questionResponse.create({
        data: {
          serviceRequestId: resp.serviceRequestId,
          questionId: resp.questionId,
          propertyTypeId: resp.propertyTypeId,
          ...data,
        },
      }));
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
