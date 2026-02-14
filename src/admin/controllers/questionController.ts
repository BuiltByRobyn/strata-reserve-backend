import * as questionAdminService from '../../shared/services/questionAdminService';
import { success, created, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getQuestions = asyncHandler(async (c) => {
  const questions = await questionAdminService.getQuestions();
  return success(c, questions);
}, 'Failed to fetch questions');

export const getQuestionById = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const question = await questionAdminService.getQuestionById(id);
  if (!question) {
    return error(c, 'Question not found', 404);
  }
  return success(c, question);
}, 'Failed to fetch question');

export const createQuestion = asyncHandler(async (c) => {
  const body = await c.req.json();
  if (!body.questionText || body.questionText.trim() === '') {
    return error(c, 'Question text is required', 400);
  }
  if (!body.questionCategory || body.questionCategory.trim() === '') {
    return error(c, 'Question category is required', 400);
  }
  if (!body.questionTypeId) {
    return error(c, 'Question type is required', 400);
  }

  const question = await questionAdminService.createQuestion({
    questionText: body.questionText.trim(),
    isRequired: body.isRequired ?? false,
    informationText: body.informationText?.trim() || null,
    questionCategory: body.questionCategory.trim(),
    questionTypeId: Number(body.questionTypeId),
    serviceIds: Array.isArray(body.serviceIds) ? body.serviceIds.map((s: { serviceId: number; sortOrder: number }) => ({
      serviceId: Number(s.serviceId),
      sortOrder: Number(s.sortOrder),
    })) : [],
    propertyTypeIds: Array.isArray(body.propertyTypeIds) ? body.propertyTypeIds.map(Number) : [],
    legalTypeIds: Array.isArray(body.legalTypeIds) ? body.legalTypeIds.map(Number) : [],
    sectionIds: Array.isArray(body.sectionIds) ? body.sectionIds.map(Number) : [],
    multipleChoiceOptions: Array.isArray(body.multipleChoiceOptions) ? body.multipleChoiceOptions.map((o: { optionText: string; sortOrder: number }) => ({
      optionText: o.optionText,
      sortOrder: Number(o.sortOrder),
    })) : [],
  });
  return created(c, question);
}, 'Failed to create question');

export const updateQuestion = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();

  const question = await questionAdminService.updateQuestion(id, {
    questionText: body.questionText?.trim(),
    isRequired: body.isRequired,
    informationText: body.informationText !== undefined ? (body.informationText?.trim() || null) : undefined,
    questionCategory: body.questionCategory?.trim(),
    questionTypeId: body.questionTypeId ? Number(body.questionTypeId) : undefined,
    serviceIds: body.serviceIds !== undefined ? (Array.isArray(body.serviceIds) ? body.serviceIds.map((s: { serviceId: number; sortOrder: number }) => ({
      serviceId: Number(s.serviceId),
      sortOrder: Number(s.sortOrder),
    })) : []) : undefined,
    propertyTypeIds: body.propertyTypeIds !== undefined ? (Array.isArray(body.propertyTypeIds) ? body.propertyTypeIds.map(Number) : []) : undefined,
    legalTypeIds: body.legalTypeIds !== undefined ? (Array.isArray(body.legalTypeIds) ? body.legalTypeIds.map(Number) : []) : undefined,
    sectionIds: body.sectionIds !== undefined ? (Array.isArray(body.sectionIds) ? body.sectionIds.map(Number) : []) : undefined,
    multipleChoiceOptions: body.multipleChoiceOptions !== undefined ? (Array.isArray(body.multipleChoiceOptions) ? body.multipleChoiceOptions.map((o: { optionText: string; sortOrder: number }) => ({
      optionText: o.optionText,
      sortOrder: Number(o.sortOrder),
    })) : []) : undefined,
  });
  return success(c, question);
}, 'Failed to update question');

export const deleteQuestion = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  await questionAdminService.deleteQuestion(id);
  return success(c, { message: 'Question deleted successfully' });
}, 'Failed to delete question');
