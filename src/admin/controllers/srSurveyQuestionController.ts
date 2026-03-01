import * as srSurveyQuestionService from '../../shared/services/srSurveyQuestionService';
import { success, created, error, asyncHandler, deleteHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getQuestionsBySR = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'id');
  const questions = await srSurveyQuestionService.getQuestionsBySR(serviceRequestId);
  return success(c, questions);
}, 'Failed to fetch specific questions for Service Request');

export const addQuestionToSR = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'id');
  const body = await c.req.json();
  if (!body.questionId || !body.propertyTypeId) {
    return error(c, 'Question ID and Property Type ID are required', 400);
  }
  const result = await srSurveyQuestionService.addQuestionToSR(
    serviceRequestId,
    parseInt(body.questionId),
    parseInt(body.propertyTypeId)
  );
  return created(c, result);
}, 'Failed to add question to SR');

export const removeQuestionFromSR = asyncHandler(async (c) => {
  const srSurveyQuestionId = parseIntParam(c, 'srSurveyQuestionId');
  await srSurveyQuestionService.removeQuestionFromSR(srSurveyQuestionId);
  return success(c, { message: 'Question removed successfully' });
}, 'Failed to remove question from SR');
