import prisma from '../lib/prismaClient';
import type { CreateQuestionInput, UpdateQuestionInput } from '../types/question.types';

const questionInclude = {
  questionType: true,
  questionServices: { include: { service: true }, orderBy: { sortOrder: 'asc' as const } },
  questionPropertyTypes: { include: { propertyType: true } },
  multipleChoiceOptions: { orderBy: { sortOrder: 'asc' as const } },
  parentQuestion: { select: { questionId: true, questionText: true, subLabel: true } },
  subQuestions: {
    orderBy: { questionId: 'asc' as const },
    select: { questionId: true, subLabel: true, questionText: true, isRequired: true, questionTypeId: true, questionCategory: true, informationText: true },
  },
};

export const getQuestions = async () => {
  return prisma.question.findMany({
    include: questionInclude,
    orderBy: { questionId: 'asc' },
  });
};

export const getQuestionById = async (id: number) => {
  return prisma.question.findUnique({
    where: { questionId: id },
    include: questionInclude,
  });
};

export const createQuestion = async (data: CreateQuestionInput) => {
  const { serviceIds, propertyTypeIds, multipleChoiceOptions, questionText, isRequired, allowNa, allowUnavailable, informationText, questionCategory, questionTypeId, parentQuestionId, subLabel } = data;

  const dataPayload = {
    questionText,
    isRequired,
    allowNa: allowNa ?? false,
    allowUnavailable: allowUnavailable ?? false,
    informationText: informationText ?? null,
    questionCategory,
    questionTypeId,
    parentQuestionId: parentQuestionId ?? null,
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

  return prisma.question.create({
    data: dataPayload,
    include: questionInclude,
  });
};

export const updateQuestion = async (id: number, data: UpdateQuestionInput) => {
  const { serviceIds, propertyTypeIds, multipleChoiceOptions, ...questionData } = data;

  return prisma.$transaction(async (tx) => {
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
    if (questionData.questionCategory !== undefined) updateData.questionCategory = questionData.questionCategory;
    if (questionData.questionTypeId !== undefined) updateData.questionTypeId = questionData.questionTypeId;
    if (questionData.parentQuestionId !== undefined) updateData.parentQuestionId = questionData.parentQuestionId;
    if (questionData.subLabel !== undefined) updateData.subLabel = questionData.subLabel;
    if (questionData.allowNa !== undefined) updateData.allowNa = questionData.allowNa;
    if (questionData.allowUnavailable !== undefined) updateData.allowUnavailable = questionData.allowUnavailable;

    return tx.question.update({
      where: { questionId: id },
      data: updateData,
      include: questionInclude,
    });
  });
};

export const deleteQuestion = async (id: number) => {
  return prisma.question.delete({ where: { questionId: id } });
};
