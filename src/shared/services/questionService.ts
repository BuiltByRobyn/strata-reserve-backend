import prisma from '../lib/prismaClient';
import { toUTCDate } from '../helpers/dateUtils';
import type { SaveResponseInput } from '../types/question.types';

export const getSurveyQuestionsForSR = async (fileId: number) => {
  const srQuestions = await prisma.fnSurveyQuestion.findMany({
    where: { fileId: fileId },
    include: {
      question: {
        include: {
          questionType: true,
          multipleChoiceOptions: { orderBy: { sortOrder: 'asc' } },
          parentRelations: {
            orderBy: { sortOrder: 'asc' },
            include: {
              subQuestion: {
                include: {
                  questionType: true,
                  multipleChoiceOptions: { orderBy: { sortOrder: 'asc' } }
                }
              }
            }
          }
        }
      },
      propertyType: true
    },
    orderBy: [
      { propertyType: { sortOrder: 'asc' } },
      { sortOrder: 'asc' },
      { questionId: 'asc' }
    ]
  });

  const flatQuestions: any[] = [];

  for (const srq of srQuestions) {
    // Add the parent question
    flatQuestions.push({
      fnSurveyQuestionId: srq.fnSurveyQuestionId,
      propertyTypeId: srq.propertyTypeId,
      propertyTypeName: srq.propertyType.propertyTypeName,
      questionId: srq.question.questionId,
      parentQuestionId: null,
      subLabel: srq.question.subLabel,
      questionText: srq.question.questionText,
      isRequired: srq.question.isRequired,
      allowNa: srq.question.allowNa,
      allowUnavailable: srq.question.allowUnavailable,
      informationText: srq.question.informationText,
      questionCategory: srq.question.questionCategory,
      questionType: srq.question.questionType.questionTypeName,
      sortOrder: srq.sortOrder,
      multipleChoiceOptions: srq.question.multipleChoiceOptions.map((o: any) => ({
        optionId: o.multipleChoiceOptionId,
        optionText: o.optionText,
        sortOrder: o.sortOrder
      }))
    });

    // Add nested sub-questions via junction table
    if (srq.question.parentRelations && srq.question.parentRelations.length > 0) {
      for (const rel of srq.question.parentRelations) {
        const sq = rel.subQuestion;
        flatQuestions.push({
          fnSurveyQuestionId: (srq.fnSurveyQuestionId * 10000) + sq.questionId,
          propertyTypeId: srq.propertyTypeId,
          propertyTypeName: srq.propertyType.propertyTypeName,
          questionId: sq.questionId,
          parentQuestionId: srq.question.questionId,
          subLabel: sq.subLabel,
          questionText: sq.questionText,
          isRequired: sq.isRequired,
          informationText: sq.informationText,
          questionCategory: srq.question.questionCategory,
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

export const getResponsesByFileNumber = async (fileId: number) => {
  return prisma.questionResponse.findMany({
    where: { fileId: fileId, archivedAt: null },
    include: {
      answeredBy: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      multipleChoiceOption: { select: { multipleChoiceOptionId: true, optionText: true } }
    }
  });
};

export const getArchivedResponsesByFileNumber = async (fileId: number) => {
  return prisma.questionResponse.findMany({
    where: { fileId: fileId, archivedAt: { not: null } },
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

  const fileIds = [...new Set(responses.map(r => r.fileId))];

  const existingResponses = await prisma.questionResponse.findMany({
    where: {
      fileId: { in: fileIds },
      questionId: { in: responses.map(r => r.questionId) },
      archivedAt: null,
    },
    select: { responseId: true, fileId: true, questionId: true, propertyTypeId: true, parentQuestionId: true }
  });

  const existingMap = new Map(
    existingResponses.map(r => [`${r.fileId}-${r.parentQuestionId ?? ''}-${r.questionId}-${r.propertyTypeId}`, r.responseId])
  );

  const isEmptyPayload = (resp: SaveResponseInput) =>
    resp.responseText == null &&
    resp.responseNumber == null &&
    resp.responseBoolean == null &&
    resp.responseDate == null &&
    resp.multipleChoiceOptionId == null;

  return prisma.$transaction(async (tx) => {
    const results = [];
    for (const resp of responses) {
      const key = `${resp.fileId}-${resp.parentQuestionId ?? ''}-${resp.questionId}-${resp.propertyTypeId}`;
      const existingId = existingMap.get(key);

      if (existingId) {
        await tx.questionResponse.update({
          where: { responseId: existingId },
          data: { archivedAt: new Date() },
        });
      }

      if (!isEmptyPayload(resp)) {
        results.push(await tx.questionResponse.create({
          data: {
            fileId: resp.fileId,
            questionId: resp.questionId,
            propertyTypeId: resp.propertyTypeId,
            parentQuestionId: resp.parentQuestionId ?? null,
            responseText: resp.responseText ?? null,
            responseDate: resp.responseDate ? toUTCDate(resp.responseDate)! : null,
            responseNumber: resp.responseNumber ?? null,
            responseBoolean: resp.responseBoolean ?? null,
            multipleChoiceOptionId: resp.multipleChoiceOptionId ?? null,
            answeredByProfileId: resp.answeredByProfileId,
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
