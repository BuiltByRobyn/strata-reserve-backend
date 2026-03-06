import prisma from '../lib/prismaClient';

export const getQuestionsBySR = async (fileNumberId: number) => {
  return prisma.fnSurveyQuestion.findMany({
    where: { fileNumberId },
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

export const addQuestionToSR = async (fileNumberId: number, questionId: number, propertyTypeId: number) => {
  return prisma.fnSurveyQuestion.create({
    data: { fileNumberId, questionId, propertyTypeId },
    include: {
      question: { include: { questionType: true, multipleChoiceOptions: true } },
      propertyType: true
    }
  });
};

export const removeQuestionFromSR = async (fnSurveyQuestionId: number) => {
  return prisma.fnSurveyQuestion.delete({
    where: { fnSurveyQuestionId }
  });
};

export const replaceQuestionsForSR = async (
  fileNumberId: number,
  selections: { propertyTypeId: number; questionIds: number[] }[]
) => {
  return prisma.$transaction(async (tx) => {
    await tx.fnSurveyQuestion.deleteMany({ where: { fileNumberId } });
    await tx.fileNumberSurveyRequirement.deleteMany({ where: { fileNumberId } });

    if (selections.length === 0) return { count: 0 };

    await tx.fileNumberSurveyRequirement.createMany({
      data: selections.map(s => ({ fileNumberId, propertyTypeId: s.propertyTypeId }))
    });

    const payload: { fileNumberId: number; questionId: number; propertyTypeId: number }[] = [];

    for (const sel of selections) {
      const subQuestions = await tx.question.findMany({
        where: { parentQuestionId: { in: sel.questionIds } },
        select: { questionId: true }
      });
      const allIds = [...sel.questionIds, ...subQuestions.map(sq => sq.questionId)];
      for (const qId of allIds) {
        payload.push({ fileNumberId, questionId: qId, propertyTypeId: sel.propertyTypeId });
      }
    }

    if (payload.length > 0) {
      await tx.fnSurveyQuestion.createMany({ data: payload, skipDuplicates: true });
    }

    return tx.fileNumberSurveyRequirement.findMany({ where: { fileNumberId } });
  });
};

export const autoPopulateFromTemplates = async (fileNumberId: number, propertyTypeIds: number[]) => {
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

  const payload: { fileNumberId: number; questionId: number; propertyTypeId: number }[] = [];

  // Add mapped
  for (const mq of mappedQuestions) {
    payload.push({
      fileNumberId,
      questionId: mq.questionId,
      propertyTypeId: mq.propertyTypeId
    });
  }

  // Add universal (one per selected property type)
  for (const uq of universalQuestions) {
    for (const ptId of propertyTypeIds) {
      payload.push({
        fileNumberId,
        questionId: uq.questionId,
        propertyTypeId: ptId
      });
    }
  }

  await prisma.fileNumberSurveyRequirement.createMany({
    data: propertyTypeIds.map(ptId => ({ fileNumberId, propertyTypeId: ptId })),
    skipDuplicates: true,
  });

  if (payload.length > 0) {
    return prisma.fnSurveyQuestion.createMany({
      data: payload,
      skipDuplicates: true
    });
  }
  return { count: 0 };
};
