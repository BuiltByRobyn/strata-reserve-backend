import prisma from '../lib/prismaClient';

export const getQuestionsBySR = async (fileId: number) => {
  return prisma.fnSurveyQuestion.findMany({
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
};

export const addQuestionToSR = async (fileId: number, questionId: number, propertyTypeId: number) => {
  return prisma.fnSurveyQuestion.create({
    data: { fileId: fileId, questionId, propertyTypeId },
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
  fileId: number,
  selections: { propertyTypeId: number; questions: { id: number; sortOrder: number }[] }[]
) => {
  return prisma.$transaction(async (tx) => {
    await tx.fnSurveyQuestion.deleteMany({ where: { fileId: fileId } });
    await tx.fileNumberSurveyRequirement.deleteMany({ where: { fileId: fileId } });

    if (selections.length === 0) return { count: 0 };

    await tx.fileNumberSurveyRequirement.createMany({
      data: selections.map(s => ({ fileId: fileId, propertyTypeId: s.propertyTypeId }))
    });

    const payload: { fileId: number; questionId: number; propertyTypeId: number; sortOrder: number }[] = [];

    for (const sel of selections) {
      for (const q of sel.questions) {
        payload.push({ fileId, questionId: q.id, propertyTypeId: sel.propertyTypeId, sortOrder: q.sortOrder });
      }
    }

    if (payload.length > 0) {
      await tx.fnSurveyQuestion.createMany({ data: payload, skipDuplicates: true });
    }

    return tx.fileNumberSurveyRequirement.findMany({ where: { fileId: fileId } });
  });
};

export const autoPopulateFromTemplates = async (fileId: number, propertyTypeIds: number[]) => {
  if (propertyTypeIds.length === 0) {
    return { count: 0 };
  }

  // Find questions mapped to these property types (not sub-questions)
  const mappedQuestions = await prisma.questionPropertyType.findMany({
    where: {
      propertyTypeId: { in: propertyTypeIds },
      question: { subRelations: { none: {} } }
    },
    select: { questionId: true, propertyTypeId: true }
  });

  // Find universal questions (no property type mappings, not sub-questions)
  const universalQuestions = await prisma.question.findMany({
    where: {
      questionPropertyTypes: { none: {} },
      subRelations: { none: {} }
    },
    select: { questionId: true }
  });

  const payload: { fileId: number; questionId: number; propertyTypeId: number }[] = [];

  for (const mq of mappedQuestions) {
    payload.push({ fileId: fileId, questionId: mq.questionId, propertyTypeId: mq.propertyTypeId });
  }

  for (const uq of universalQuestions) {
    for (const ptId of propertyTypeIds) {
      payload.push({ fileId: fileId, questionId: uq.questionId, propertyTypeId: ptId });
    }
  }

  await prisma.fileNumberSurveyRequirement.createMany({
    data: propertyTypeIds.map(ptId => ({ fileId: fileId, propertyTypeId: ptId })),
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
