import prisma from '../lib/prismaClient';

export const getQuestionsBySR = async (serviceRequestId: number) => {
  return prisma.srSurveyQuestion.findMany({
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
};

export const addQuestionToSR = async (serviceRequestId: number, questionId: number, propertyTypeId: number) => {
  return prisma.srSurveyQuestion.create({
    data: { serviceRequestId, questionId, propertyTypeId },
    include: {
      question: { include: { questionType: true, multipleChoiceOptions: true } },
      propertyType: true
    }
  });
};

export const removeQuestionFromSR = async (srSurveyQuestionId: number) => {
  return prisma.srSurveyQuestion.delete({
    where: { srSurveyQuestionId }
  });
};

export const autoPopulateFromTemplates = async (serviceRequestId: number, propertyTypeIds: number[]) => {
  if (propertyTypeIds.length === 0) {
    return { count: 0 };
  }

  // Find questions mapped to these property types (and have no parent)
  const mappedQuestions = await prisma.questionPropertyType.findMany({
    where: {
      propertyTypeId: { in: propertyTypeIds },
      question: { parentQuestionId: null }
    },
    select: { questionId: true, propertyTypeId: true }
  });

  // Find universal questions (no property type mappings, and have no parent)
  const universalQuestions = await prisma.question.findMany({
    where: {
      parentQuestionId: null,
      questionPropertyTypes: { none: {} }
    },
    select: { questionId: true }
  });

  const payload: { serviceRequestId: number; questionId: number; propertyTypeId: number }[] = [];

  // Add mapped
  for (const mq of mappedQuestions) {
    payload.push({
      serviceRequestId,
      questionId: mq.questionId,
      propertyTypeId: mq.propertyTypeId
    });
  }

  // Add universal (one per selected property type)
  for (const uq of universalQuestions) {
    for (const ptId of propertyTypeIds) {
      payload.push({
        serviceRequestId,
        questionId: uq.questionId,
        propertyTypeId: ptId
      });
    }
  }

  if (payload.length > 0) {
    return prisma.srSurveyQuestion.createMany({
      data: payload,
      skipDuplicates: true
    });
  }
  return { count: 0 };
};
