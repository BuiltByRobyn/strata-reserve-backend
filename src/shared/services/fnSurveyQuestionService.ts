import prisma from '../lib/prismaClient';

export const getQuestionsBySR = async (fileId: number) => {
  return prisma.fnSurveyQuestion.findMany({
    where: { fileId: fileId },
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
    let subSortOffset = 10000;

    for (const sel of selections) {
      const questionIds = sel.questions.map(q => q.id);
      const subQuestions = await tx.question.findMany({
        where: { parentQuestionId: { in: questionIds } },
        select: { questionId: true, parentQuestionId: true }
      });

      for (const q of sel.questions) {
        payload.push({ fileId, questionId: q.id, propertyTypeId: sel.propertyTypeId, sortOrder: q.sortOrder });
      }
      for (const sq of subQuestions) {
        const parentOrder = sel.questions.find(q => q.id === sq.parentQuestionId)?.sortOrder ?? 0;
        payload.push({ fileId, questionId: sq.questionId, propertyTypeId: sel.propertyTypeId, sortOrder: parentOrder * 100 + subSortOffset });
        subSortOffset++;
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

  const payload: { fileId: number; questionId: number; propertyTypeId: number }[] = [];

  // Add mapped
  for (const mq of mappedQuestions) {
    payload.push({
      fileId: fileId,
      questionId: mq.questionId,
      propertyTypeId: mq.propertyTypeId
    });
  }

  // Add universal (one per selected property type)
  for (const uq of universalQuestions) {
    for (const ptId of propertyTypeIds) {
      payload.push({
        fileId: fileId,
        questionId: uq.questionId,
        propertyTypeId: ptId
      });
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
