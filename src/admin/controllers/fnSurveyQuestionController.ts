import * as fnSurveyQuestionService from '../../shared/services/fnSurveyQuestionService';
import { success, created, error, asyncHandler, deleteHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getQuestionsBySR = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'id');
  const questions = await fnSurveyQuestionService.getQuestionsBySR(fileId);
  return success(c, questions);
}, 'Failed to fetch specific questions for File Number');

export const addQuestionToSR = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'id');
  const body = await c.req.json();
  if (!body.questionId || !body.propertyTypeId) {
    return error(c, 'Question ID and Property Type ID are required', 400);
  }
  const result = await fnSurveyQuestionService.addQuestionToSR(
    fileId,
    parseInt(body.questionId),
    parseInt(body.propertyTypeId)
  );
  return created(c, result);
}, 'Failed to add question to SR');

export const removeQuestionFromSR = asyncHandler(async (c) => {
  const fnSurveyQuestionId = parseIntParam(c, 'fnSurveyQuestionId');
  await fnSurveyQuestionService.removeQuestionFromSR(fnSurveyQuestionId);
  return success(c, { message: 'Question removed successfully' });
}, 'Failed to remove question from SR');
