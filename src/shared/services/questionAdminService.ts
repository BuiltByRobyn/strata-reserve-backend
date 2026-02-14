import prisma from '../lib/prismaClient';
import type { CreateQuestionInput, UpdateQuestionInput } from '../types/question.types';

const questionInclude = {
  questionType: true,
  questionServices: { include: { service: true }, orderBy: { sortOrder: 'asc' as const } },
  questionPropertyTypes: { include: { propertyType: true } },
  questionLegalTypes: { include: { legalType: true } },
  questionSections: { include: { section: true } },
  multipleChoiceOptions: { orderBy: { sortOrder: 'asc' as const } },
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
  const { serviceIds, propertyTypeIds, legalTypeIds, sectionIds, multipleChoiceOptions, ...questionData } = data;

  return prisma.question.create({
    data: {
      ...questionData,
      informationText: questionData.informationText ?? null,
      questionServices: {
        create: serviceIds.map(s => ({ serviceId: s.serviceId, sortOrder: s.sortOrder })),
      },
      questionPropertyTypes: {
        create: propertyTypeIds.map(id => ({ propertyTypeId: id })),
      },
      questionLegalTypes: {
        create: legalTypeIds.map(id => ({ legalTypeId: id })),
      },
      questionSections: {
        create: sectionIds.map(id => ({ sectionId: id })),
      },
      ...(multipleChoiceOptions?.length ? {
        multipleChoiceOptions: {
          create: multipleChoiceOptions.map(o => ({ optionText: o.optionText, sortOrder: o.sortOrder })),
        },
      } : {}),
    },
    include: questionInclude,
  });
};

export const updateQuestion = async (id: number, data: UpdateQuestionInput) => {
  const { serviceIds, propertyTypeIds, legalTypeIds, sectionIds, multipleChoiceOptions, ...questionData } = data;

  return prisma.$transaction(async (tx) => {
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

    if (legalTypeIds !== undefined) {
      await tx.questionLegalType.deleteMany({ where: { questionId: id } });
      if (legalTypeIds.length > 0) {
        await tx.questionLegalType.createMany({
          data: legalTypeIds.map(ltId => ({ questionId: id, legalTypeId: ltId })),
        });
      }
    }

    if (sectionIds !== undefined) {
      await tx.questionSection.deleteMany({ where: { questionId: id } });
      if (sectionIds.length > 0) {
        await tx.questionSection.createMany({
          data: sectionIds.map(sId => ({ questionId: id, sectionId: sId })),
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
