import prisma from '../lib/prismaClient';
import type { CreateQuestionInput, UpdateQuestionInput } from '../types/question.types';

const questionInclude = {
  questionCategory: true,
  questionType: true,
  questionServices: { include: { service: true }, orderBy: { sortOrder: 'asc' as const } },
  questionPropertyTypes: { include: { propertyType: true } },
  multipleChoiceOptions: { orderBy: { sortOrder: 'asc' as const } },
  parentRelations: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      subQuestion: {
        select: { questionId: true, subLabel: true, questionText: true, isRequired: true, questionTypeId: true, questionCategory: { select: { key: true, label: true } }, informationText: true },
      }
    }
  },
  subRelations: { select: { id: true } },
};

const mapQuestion = (q: any) => ({
  ...q,
  questionCategoryId: q.questionCategory.questionCategoryId,
  questionCategory: q.questionCategory.label,
  isSubQuestion: q.subRelations.length > 0,
  subQuestions: q.parentRelations.map((r: any) => ({
    ...r.subQuestion,
    questionCategory: r.subQuestion.questionCategory?.label ?? r.subQuestion.questionCategory,
  })),
  subRelations: undefined,
  parentRelations: undefined,
});

export const getQuestions = async () => {
  const results = await prisma.question.findMany({
    include: questionInclude,
    orderBy: { questionId: 'asc' },
  });
  return results.map(mapQuestion);
};

export const getQuestionById = async (id: number) => {
  const result = await prisma.question.findUnique({
    where: { questionId: id },
    include: questionInclude,
  });
  return result ? mapQuestion(result) : null;
};

export const createQuestion = async (data: CreateQuestionInput) => {
  const { serviceIds, propertyTypeIds, multipleChoiceOptions, questionText, isRequired, allowNa, allowUnavailable, informationText, questionCategoryId, questionTypeId, subLabel } = data;

  const dataPayload = {
    questionText,
    isRequired,
    allowNa: allowNa ?? false,
    allowUnavailable: allowUnavailable ?? false,
    informationText: informationText ?? null,
    questionCategoryId,
    questionTypeId,
    subLabel: subLabel ?? null,
    ...(serviceIds.length > 0
      ? { questionServices: { create: serviceIds.map(s => ({ serviceId: s.serviceId, sortOrder: s.sortOrder })) } }
      : {}),
    ...(propertyTypeIds.length > 0
      ? { questionPropertyTypes: { create: propertyTypeIds.map(id => ({ propertyTypeId: id })) } }
      : {}),
    ...(multipleChoiceOptions?.length
      ? { multipleChoiceOptions: { create: multipleChoiceOptions.map(o => ({ optionText: o.optionText, sortOrder: o.sortOrder })) } }
      : {}),
  };

  const result = await prisma.question.create({
    data: dataPayload,
    include: questionInclude,
  });
  return mapQuestion(result);
};

export const updateQuestion = async (id: number, data: UpdateQuestionInput) => {
  const { serviceIds, propertyTypeIds, multipleChoiceOptions, ...questionData } = data;

  const result = await prisma.$transaction(async (tx) => {
    await tx.questionResponse.updateMany({
      where: { questionId: id, archivedAt: null },
      data: { archivedAt: new Date() },
    });

    if (serviceIds !== undefined) {
      await tx.questionService.deleteMany({ where: { questionId: id } });
      if (serviceIds.length > 0) {
        await tx.questionService.createMany({
          data: serviceIds.map(s => ({ questionId: id, serviceId: s.serviceId, sortOrder: s.sortOrder })),
        });
      }
    }

    if (propertyTypeIds !== undefined) {
      await tx.questionPropertyType.deleteMany({ where: { questionId: id } });
      if (propertyTypeIds.length > 0) {
        await tx.questionPropertyType.createMany({
          data: propertyTypeIds.map(ptId => ({ questionId: id, propertyTypeId: ptId })),
        });
      }
    }

    if (multipleChoiceOptions !== undefined) {
      await tx.questionResponse.updateMany({
        where: { questionId: id, multipleChoiceOptionId: { not: null } },
        data: { multipleChoiceOptionId: null },
      });
      await tx.multipleChoiceOption.deleteMany({ where: { questionId: id } });
      if (multipleChoiceOptions.length > 0) {
        await tx.multipleChoiceOption.createMany({
          data: multipleChoiceOptions.map(o => ({ questionId: id, optionText: o.optionText, sortOrder: o.sortOrder })),
        });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (questionData.questionText !== undefined) updateData.questionText = questionData.questionText;
    if (questionData.isRequired !== undefined) updateData.isRequired = questionData.isRequired;
    if (questionData.informationText !== undefined) updateData.informationText = questionData.informationText;
    if (questionData.questionCategoryId !== undefined) updateData.questionCategoryId = questionData.questionCategoryId;
    if (questionData.questionTypeId !== undefined) updateData.questionTypeId = questionData.questionTypeId;
    if (questionData.subLabel !== undefined) updateData.subLabel = questionData.subLabel;
    if (questionData.allowNa !== undefined) updateData.allowNa = questionData.allowNa;
    if (questionData.allowUnavailable !== undefined) updateData.allowUnavailable = questionData.allowUnavailable;

    return tx.question.update({
      where: { questionId: id },
      data: updateData,
      include: questionInclude,
    });
  });
  return mapQuestion(result);
};

export const setSubQuestions = async (parentId: number, subQuestionIds: number[]) => {
  return prisma.$transaction(async (tx) => {
    await tx.questionSubQuestion.deleteMany({ where: { parentQuestionId: parentId } });
    if (subQuestionIds.length > 0) {
      await tx.questionSubQuestion.createMany({
        data: subQuestionIds.map((subId, i) => ({ parentQuestionId: parentId, subQuestionId: subId, sortOrder: i + 1 })),
      });
    }
    const result = await tx.question.findUnique({ where: { questionId: parentId }, include: questionInclude });
    return result ? mapQuestion(result) : null;
  });
};

export const deleteQuestion = async (id: number) => {
  return prisma.$transaction(async (tx) => {
    await tx.questionResponse.updateMany({
      where: { questionId: id, multipleChoiceOptionId: { not: null } },
      data: { multipleChoiceOptionId: null },
    });
    await tx.questionResponse.deleteMany({ where: { questionId: id } });
    await tx.fnSurveyQuestion.deleteMany({ where: { questionId: id } });
    await tx.multipleChoiceOption.deleteMany({ where: { questionId: id } });
    await tx.questionService.deleteMany({ where: { questionId: id } });
    await tx.questionPropertyType.deleteMany({ where: { questionId: id } });
    await tx.questionSubQuestion.deleteMany({
      where: { OR: [{ parentQuestionId: id }, { subQuestionId: id }] },
    });
    return tx.question.delete({ where: { questionId: id } });
  });
};
