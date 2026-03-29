import * as questionAdminService from '../../shared/services/questionAdminService';
import { success, created, error, asyncHandler, getByIdHandler, deleteHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getQuestions = asyncHandler(async (c) => {
  const questions = await questionAdminService.getQuestions();
  return success(c, questions);
}, 'Failed to fetch questions');

export const getQuestionById = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const question = await questionAdminService.getQuestionById(id);
  if (!question) return error(c, 'Question not found', 404);
  return success(c, question);
}, 'Failed to fetch question');

export const createQuestion = asyncHandler(async (c) => {
  const body = await c.req.json();
  if (!body.questionText || body.questionText.trim() === '') {
    return error(c, 'Question text is required', 400);
  }
  if (!body.questionCategoryId) {
    return error(c, 'Question category is required', 400);
  }
  if (!body.questionTypeId) {
    return error(c, 'Question type is required', 400);
  }

  try {
    const question = await questionAdminService.createQuestion({
      questionText: body.questionText.trim(),
      isRequired: body.isRequired ?? false,
      allowNa: body.allowNa ?? false,
      allowUnavailable: body.allowUnavailable ?? false,
      informationText: body.informationText?.trim() || null,
      questionCategoryId: Number(body.questionCategoryId),
      questionTypeId: Number(body.questionTypeId),
      subLabel: body.subLabel?.trim() || null,
      serviceIds: Array.isArray(body.serviceIds) ? body.serviceIds.map((s: { serviceId: number; sortOrder: number }) => ({
        serviceId: Number(s.serviceId),
        sortOrder: Number(s.sortOrder),
      })) : [],
      propertyTypeIds: Array.isArray(body.propertyTypeIds) ? body.propertyTypeIds.map(Number) : [],
      multipleChoiceOptions: Array.isArray(body.multipleChoiceOptions) ? body.multipleChoiceOptions.map((o: { optionText: string; sortOrder: number }) => ({
        optionText: o.optionText,
        sortOrder: Number(o.sortOrder),
      })) : [],
    });
    return created(c, question);
  } catch (err: unknown) {
    const errObj = err && typeof err === 'object' ? err as { code?: string; message?: string; cause?: { code?: string; message?: string } } : null;
    if (errObj?.code && typeof errObj.message === 'string') {
      return error(c, errObj.message, 400);
    }
    const cause = errObj?.cause;
    if (cause?.code === '23503' && typeof cause?.message === 'string' && cause.message.includes('question_category_id')) {
      return error(c, 'Invalid question category. The selected category does not exist.', 400);
    }
    if (cause?.code === '23514') {
      return error(c, cause.message ?? 'A database check constraint was violated', 400);
    }
    throw err;
  }
}, 'Failed to create question');

export const updateQuestion = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();

  const question = await questionAdminService.updateQuestion(id, {
    questionText: body.questionText?.trim(),
    isRequired: body.isRequired,
    allowNa: body.allowNa !== undefined ? body.allowNa : undefined,
    allowUnavailable: body.allowUnavailable !== undefined ? body.allowUnavailable : undefined,
    informationText: body.informationText !== undefined ? (body.informationText?.trim() || null) : undefined,
    questionCategoryId: body.questionCategoryId ? Number(body.questionCategoryId) : undefined,
    questionTypeId: body.questionTypeId ? Number(body.questionTypeId) : undefined,
    subLabel: body.subLabel !== undefined ? (body.subLabel?.trim() || null) : undefined,
    serviceIds: body.serviceIds !== undefined ? (Array.isArray(body.serviceIds) ? body.serviceIds.map((s: { serviceId: number; sortOrder: number }) => ({
      serviceId: Number(s.serviceId),
      sortOrder: Number(s.sortOrder),
    })) : []) : undefined,
    propertyTypeIds: body.propertyTypeIds !== undefined ? (Array.isArray(body.propertyTypeIds) ? body.propertyTypeIds.map(Number) : []) : undefined,
    multipleChoiceOptions: body.multipleChoiceOptions !== undefined ? (Array.isArray(body.multipleChoiceOptions) ? body.multipleChoiceOptions.map((o: { optionText: string; sortOrder: number }) => ({
      optionText: o.optionText,
      sortOrder: Number(o.sortOrder),
    })) : []) : undefined,
  });
  return success(c, question);
}, 'Failed to update question');

export const setSubQuestions = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();
  const subQuestionIds = Array.isArray(body.subQuestionIds) ? body.subQuestionIds.map(Number) : [];
  const result = await questionAdminService.setSubQuestions(id, subQuestionIds);
  return success(c, result);
}, 'Failed to update sub-questions');

export const deleteQuestion = deleteHandler(questionAdminService.deleteQuestion, 'Question');
