import * as questionService from '../../shared/services/questionService';
import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import prisma from '../../shared/lib/prismaClient';

export const getSurveyQuestions = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'serviceRequestId');

  const sr = await prisma.serviceRequest.findUnique({
    where: { serviceRequestId },
    include: {
      strata: {
        select: {
          strataId: true,
          strataPropertyTypes: { select: { propertyTypeId: true } }
        }
      }
    }
  });

  if (!sr) {
    return error(c, 'Service request not found', 404);
  }

  const propertyTypeIds = sr.strata.strataPropertyTypes.map(spt => spt.propertyTypeId);

  const questions = await questionService.getSurveyQuestions(
    propertyTypeIds.length > 0 ? propertyTypeIds : undefined
  );

  return success(c, questions);
}, 'Failed to fetch survey questions');

export const getSurveyResponses = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'serviceRequestId');
  const responses = await questionService.getResponsesByServiceRequest(serviceRequestId);
  return success(c, responses);
}, 'Failed to fetch survey responses');

export const saveSurveyResponses = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'serviceRequestId');
  const user = c.get('user');
  const body = await c.req.json();

  if (!Array.isArray(body.responses) || body.responses.length === 0) {
    return error(c, 'responses array is required', 400);
  }

  const inputs = body.responses.map((r: Record<string, unknown>) => ({
    serviceRequestId,
    answeredByProfileId: user.id,
    questionId: r.questionId as number,
    responseText: (r.responseText as string) ?? null,
    responseDate: (r.responseDate as string) ?? null,
    responseNumber: (r.responseNumber as number) ?? null,
    responseBoolean: (r.responseBoolean as boolean) ?? null,
    multipleChoiceOptionId: (r.multipleChoiceOptionId as number) ?? null,
  }));

  const results = await questionService.saveResponses(inputs);
  return success(c, results);
}, 'Failed to save survey responses');

export const getArchivedSurveyResponses = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'serviceRequestId');
  const responses = await questionService.getArchivedResponsesByServiceRequest(serviceRequestId);
  return success(c, responses);
}, 'Failed to fetch archived survey responses');

export const getSurveySections = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'serviceRequestId');

  const sr = await prisma.serviceRequest.findUnique({
    where: { serviceRequestId },
    select: { serviceId: true }
  });

  if (!sr) {
    return error(c, 'Service request not found', 404);
  }

  const sections = await questionService.getSurveySections(sr.serviceId);
  return success(c, sections);
}, 'Failed to fetch survey sections');
