import prisma from '../lib/prismaClient';

export const getSurveyQuestions = async (serviceId: number, propertyTypeId?: number) => {
  const questions = await prisma.question.findMany({
    where: {
      questionServices: { some: { serviceId } },
      ...(propertyTypeId ? {
        OR: [
          { questionPropertyTypes: { none: {} } },
          { questionPropertyTypes: { some: { propertyTypeId } } }
        ]
      } : {
        questionPropertyTypes: { none: {} }
      })
    },
    include: {
      questionType: true,
      multipleChoiceOptions: { orderBy: { sortOrder: 'asc' } },
      questionServices: {
        where: { serviceId },
        select: { sortOrder: true }
      }
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
    sortOrder: q.questionServices[0]?.sortOrder ?? 0,
    multipleChoiceOptions: q.multipleChoiceOptions.map(o => ({
      optionId: o.multipleChoiceOptionId,
      optionText: o.optionText,
      sortOrder: o.sortOrder
    }))
  })).sort((a, b) => a.sortOrder - b.sortOrder);
};

export const getResponsesByServiceRequest = async (serviceRequestId: number) => {
  return prisma.questionResponse.findMany({
    where: { serviceRequestId },
    include: {
      answeredBy: { select: { id: true, firstName: true, lastName: true, displayName: true } },
      multipleChoiceOption: { select: { multipleChoiceOptionId: true, optionText: true } }
    }
  });
};

export interface SaveResponseInput {
  serviceRequestId: number;
  answeredByProfileId: string;
  questionId: number;
  responseText?: string | null;
  responseDate?: string | null;
  responseNumber?: number | null;
  responseBoolean?: boolean | null;
  multipleChoiceOptionId?: number | null;
}

export const saveResponses = async (responses: SaveResponseInput[]) => {
  const results = [];

  for (const resp of responses) {
    const existing = await prisma.questionResponse.findFirst({
      where: {
        serviceRequestId: resp.serviceRequestId,
        questionId: resp.questionId
      }
    });

    if (existing) {
      const updated = await prisma.questionResponse.update({
        where: { responseId: existing.responseId },
        data: {
          responseText: resp.responseText ?? null,
          responseDate: resp.responseDate ? new Date(resp.responseDate) : null,
          responseNumber: resp.responseNumber ?? null,
          responseBoolean: resp.responseBoolean ?? null,
          multipleChoiceOptionId: resp.multipleChoiceOptionId ?? null,
          answeredByProfileId: resp.answeredByProfileId,
        }
      });
      results.push(updated);
    } else {
      const created = await prisma.questionResponse.create({
        data: {
          serviceRequestId: resp.serviceRequestId,
          questionId: resp.questionId,
          answeredByProfileId: resp.answeredByProfileId,
          responseText: resp.responseText ?? null,
          responseDate: resp.responseDate ? new Date(resp.responseDate) : null,
          responseNumber: resp.responseNumber ?? null,
          responseBoolean: resp.responseBoolean ?? null,
          multipleChoiceOptionId: resp.multipleChoiceOptionId ?? null,
        }
      });
      results.push(created);
    }
  }

  return results;
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
