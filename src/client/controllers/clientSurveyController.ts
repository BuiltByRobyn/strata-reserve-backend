import * as questionService from '../../shared/services/questionService';
import * as fnSurveyQuestionService from '../../shared/services/fnSurveyQuestionService';
import * as fileNumberService from '../../shared/services/fileNumberService';
import * as strataService from '../../shared/services/strataService';
import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import { sanitizeFilePart } from '../../shared/helpers/stringUtils';
import prisma from '../../shared/lib/prismaClient';
import { renderSurveyAnswersPdf } from '../../shared/services/surveyPdfService';

export const getSurveyQuestions = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'fileId');
  const user = c.get('user');

  const sr = await prisma.fileNumber.findUnique({
    where: { fileId: fileId },
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

  const allQuestions = await questionService.getSurveyQuestionsForSR(fileId);

  // Filter by the user's assigned sections and property types (matching PDF download logic)
  const allowedSections = await strataService.getSectionNamesByProfileId(user.id);
  const allowedPropertyTypeIds = await strataService.getPropertyTypeIdsByProfileId(user.id);

  let questions = allowedSections.length > 0
    ? allQuestions.filter((q: any) => allowedSections.includes(q.questionCategory))
    : allQuestions;

  if (allowedPropertyTypeIds.length > 0) {
    questions = questions.filter((q: any) => allowedPropertyTypeIds.includes(q.propertyTypeId));
  }

  return success(c, questions);
}, 'Failed to fetch survey questions');

export const downloadActiveSurveyPdf = asyncHandler(async (c) => {
  const user = c.get('user');

  const sr = await fileNumberService.getActiveByProfile(user.id);
  if (!sr) {
    return error(c, 'No active file number found', 404);
  }

  const allQuestions = await questionService.getSurveyQuestionsForSR(sr.fileId);
  const blank = c.req.query('blank') === 'true';
  const responses = blank ? [] : await questionService.getResponsesByFileNumber(sr.fileId);

  // Filter questions to only include sections and property types assigned to this client's profile
  const allowedSections = await strataService.getSectionNamesByProfileId(user.id);
  const allowedPropertyTypeIds = await strataService.getPropertyTypeIdsByProfileId(user.id);

  let questions = allowedSections.length > 0
    ? allQuestions.filter((q: any) => allowedSections.includes(q.questionCategory))
    : allQuestions;

  if (allowedPropertyTypeIds.length > 0) {
    questions = questions.filter((q: any) => allowedPropertyTypeIds.includes(q.propertyTypeId));
  }

  const pdf = await renderSurveyAnswersPdf(
    {
      fileId: sr.fileId,
      strataPlan: sr.strata?.strataPlan ?? null,
      complexName: sr.strata?.complexName ?? null,
      serviceName: sr.service?.serviceName ?? null,
      fileNumber: String(sr.fileId).padStart(9, '0'),
      requestDate: sr.requestDate instanceof Date ? sr.requestDate.toISOString() : (sr.requestDate ?? null),
      generatedAtIso: new Date().toISOString(),
    },
    questions as any,
    responses as any,
    'client'
  );

  const strataPart = sr.strata?.strataPlan ? sanitizeFilePart(sr.strata.strataPlan) : 'Survey';
  const filename = `Survey-Answers-${strataPart}.pdf`;

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
  const fileId = parseIntParam(c, 'fileId');

  const sr = await prisma.fileNumber.findUnique({
    where: { fileId: fileId },
    select: {
      fileId: true,
      requestDate: true,
      notes: true,
      strata: { select: { strataPlan: true, complexName: true } },
      service: { select: { serviceName: true } },
    }
  });

  if (!sr) {
    return error(c, 'Service request not found', 404);
  }

  const questions = await questionService.getSurveyQuestionsForSR(fileId);

  if (questions.length === 0) {
    return error(c, 'No survey questions found for this file number', 400);
  }

  const responses = await questionService.getResponsesByFileNumber(fileId);

  const pdf = await renderSurveyAnswersPdf(
    {
      fileId: sr.fileId,
      strataPlan: sr.strata?.strataPlan ?? null,
      complexName: sr.strata?.complexName ?? null,
      serviceName: sr.service?.serviceName ?? null,
      fileNumber: String(sr.fileId).padStart(9, '0'),
      requestDate: sr.requestDate instanceof Date ? sr.requestDate.toISOString() : (sr.requestDate ?? null),
      generatedAtIso: new Date().toISOString(),
    },
    questions as any,
    responses as any,
    'admin'
  );

  const strataPart = sr.strata?.strataPlan ? sanitizeFilePart(sr.strata.strataPlan) : 'Survey';
  const filename = `Survey-Answers-${strataPart}.pdf`;

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
  const fileId = parseIntParam(c, 'fileId');
  const responses = await questionService.getResponsesByFileNumber(fileId);
  return success(c, responses);
}, 'Failed to fetch survey responses');

export const saveSurveyResponses = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'fileId');
  const user = c.get('user');
  const body = await c.req.json();

  if (!Array.isArray(body.responses) || body.responses.length === 0) {
    return error(c, 'responses array is required', 400);
  }

  const inputs = body.responses.map((r: Record<string, unknown>) => ({
    fileId,
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
  const fileId = parseIntParam(c, 'fileId');
  const responses = await questionService.getArchivedResponsesByFileNumber(fileId);
  return success(c, responses);
}, 'Failed to fetch archived survey responses');

export const getSurveySections = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'fileId');

  const sr = await prisma.fileNumber.findUnique({
    where: { fileId: fileId },
    select: { serviceId: true }
  });

  if (!sr) {
    return error(c, 'Service request not found', 404);
  }

  const sections = await questionService.getSurveySections(sr.serviceId);
  return success(c, sections);
}, 'Failed to fetch survey sections');

export const getSurveyRequirements = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'fileId');

  const reqs = await prisma.fileNumberSurveyRequirement.findMany({
    where: { fileId: fileId }
  });

  return success(c, reqs);
}, 'Failed to fetch survey requirements');

export const saveSurveyRequirements = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'fileId');
  const body = await c.req.json();

  if (Array.isArray(body.selections)) {
    const selections = body.selections as { propertyTypeId: number; questions: { id: number; sortOrder: number }[] }[];
    const results = await fnSurveyQuestionService.replaceQuestionsForSR(fileId, selections);
    return success(c, results);
  }

  if (Array.isArray(body.propertyTypeIds)) {
    const propertyTypeIds = body.propertyTypeIds as number[];
    await prisma.$transaction(async (tx: any) => {
      await tx.fileNumberSurveyRequirement.deleteMany({ where: { fileId: fileId } });
      if (propertyTypeIds.length > 0) {
        await tx.fileNumberSurveyRequirement.createMany({
          data: propertyTypeIds.map(id => ({ fileId: fileId, propertyTypeId: id }))
        });
      }
    });
    await fnSurveyQuestionService.autoPopulateFromTemplates(fileId, propertyTypeIds);
    const results = await prisma.fileNumberSurveyRequirement.findMany({ where: { fileId: fileId } });
    return success(c, results);
  }

  return error(c, 'selections or propertyTypeIds array is required', 400);
}, 'Failed to save survey requirements');
