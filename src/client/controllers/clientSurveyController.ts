import * as questionService from '../../shared/services/questionService';
import * as srSurveyQuestionService from '../../shared/services/srSurveyQuestionService';
import * as serviceRequestService from '../../shared/services/serviceRequestService';
import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import prisma from '../../shared/lib/prismaClient';
import { renderSurveyAnswersPdf } from '../../shared/lib/surveyPdf';

const sanitizeFilePart = (value: string) => {
  return value
    .replace(/[^a-zA-Z0-9._\- ]+/g, '')
    .trim()
    .replace(/\s+/g, '-');
};

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
      },
      surveyRequirements: {
        select: { propertyTypeId: true }
      }
    }
  });

  if (!sr) {
    return error(c, 'Service request not found', 404);
  }

  const explicitPropertyTypeIds = sr.surveyRequirements.map((req: { propertyTypeId: number }) => req.propertyTypeId);
  
  // Strict mode: if no property types are configured, return 0 questions
  if (explicitPropertyTypeIds.length === 0) {
    return success(c, []);
  }

  const questions = await questionService.getSurveyQuestionsForSR(serviceRequestId);

  return success(c, questions);
}, 'Failed to fetch survey questions');

export const downloadActiveSurveyPdf = asyncHandler(async (c) => {
  const user = c.get('user');

  const sr = await serviceRequestService.getActiveByProfile(user.id);
  if (!sr) {
    return error(c, 'No active service request found', 404);
  }

  const questions = await questionService.getSurveyQuestionsForSR(sr.serviceRequestId);
  const responses = await questionService.getResponsesByServiceRequest(sr.serviceRequestId);

  const pdf = await renderSurveyAnswersPdf(
    {
      serviceRequestId: sr.serviceRequestId,
      strataPlan: sr.strata?.strataPlan ?? null,
      complexName: sr.strata?.complexName ?? null,
      serviceName: sr.service?.serviceName ?? null,
      status: sr.status ?? null,
      requestDate: sr.requestDate instanceof Date ? sr.requestDate.toISOString() : (sr.requestDate ?? null),
      generatedAtIso: new Date().toISOString(),
    },
    questions as any,
    responses as any
  );

  const strataPart = sr.strata?.strataPlan ? sanitizeFilePart(sr.strata.strataPlan) : 'SR';
  const filename = `Survey-Answers-${strataPart}-SR-${sr.serviceRequestId}.pdf`;

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}, 'Failed to generate survey PDF');

export const downloadSurveyPdf = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'serviceRequestId');

  const sr = await prisma.serviceRequest.findUnique({
    where: { serviceRequestId },
    select: {
      serviceRequestId: true,
      requestDate: true,
      status: true,
      strata: { select: { strataPlan: true, complexName: true } },
      service: { select: { serviceName: true } },
    }
  });

  if (!sr) {
    return error(c, 'Service request not found', 404);
  }

  const questions = await questionService.getSurveyQuestionsForSR(serviceRequestId);
  const responses = await questionService.getResponsesByServiceRequest(serviceRequestId);

  const pdf = await renderSurveyAnswersPdf(
    {
      serviceRequestId: sr.serviceRequestId,
      strataPlan: sr.strata?.strataPlan ?? null,
      complexName: sr.strata?.complexName ?? null,
      serviceName: sr.service?.serviceName ?? null,
      status: sr.status ?? null,
      requestDate: sr.requestDate instanceof Date ? sr.requestDate.toISOString() : (sr.requestDate ?? null),
      generatedAtIso: new Date().toISOString(),
    },
    questions as any,
    responses as any
  );

  const strataPart = sr.strata?.strataPlan ? sanitizeFilePart(sr.strata.strataPlan) : 'SR';
  const filename = `Survey-Answers-${strataPart}-SR-${sr.serviceRequestId}.pdf`;

  return new Response(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}, 'Failed to generate survey PDF');

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
    propertyTypeId: r.propertyTypeId as number,
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

export const getSurveyRequirements = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'serviceRequestId');
  
  const reqs = await prisma.serviceRequestSurveyRequirement.findMany({
    where: { serviceRequestId }
  });
  
  return success(c, reqs);
}, 'Failed to fetch survey requirements');

export const saveSurveyRequirements = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'serviceRequestId');
  const body = await c.req.json();

  if (Array.isArray(body.selections)) {
    const selections = body.selections as { propertyTypeId: number; questionIds: number[] }[];
    const results = await srSurveyQuestionService.replaceQuestionsForSR(serviceRequestId, selections);
    return success(c, results);
  }

  if (Array.isArray(body.propertyTypeIds)) {
    const propertyTypeIds = body.propertyTypeIds as number[];
    await prisma.$transaction(async (tx: any) => {
      await tx.serviceRequestSurveyRequirement.deleteMany({ where: { serviceRequestId } });
      if (propertyTypeIds.length > 0) {
        await tx.serviceRequestSurveyRequirement.createMany({
          data: propertyTypeIds.map(id => ({ serviceRequestId, propertyTypeId: id }))
        });
      }
    });
    await srSurveyQuestionService.autoPopulateFromTemplates(serviceRequestId, propertyTypeIds);
    const results = await prisma.serviceRequestSurveyRequirement.findMany({ where: { serviceRequestId } });
    return success(c, results);
  }

  return error(c, 'selections or propertyTypeIds array is required', 400);
}, 'Failed to save survey requirements');
