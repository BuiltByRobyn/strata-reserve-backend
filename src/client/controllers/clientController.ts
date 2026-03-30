import { success, created, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { surveyQuestionKey } from '../../shared/helpers/surveyUtils';
import * as fileNumberService from '../../shared/services/fileNumberService';
import * as propertyTypeRequestService from '../../shared/services/propertyTypeRequestService';
import prisma from '../../shared/lib/prismaClient';

export const getActiveFileNumber = asyncHandler(async (c) => {
  const user = c.get('user');
  const fileNumber = await fileNumberService.getActiveByProfile(user.id);
  if (!fileNumber) return success(c, null);

  const [clientProfile, surveyRequirements] = await Promise.all([
    prisma.strataProfile.findFirst({
      where: { strataId: fileNumber.strataId, profileId: user.id },
      select: {
        strataProfilePropertyTypes: {
          select: { propertyTypeId: true }
        }
      }
    }),
    prisma.fileNumberSurveyRequirement.findMany({
      where: { fileId: fileNumber.fileId },
      select: {
        propertyTypeId: true,
        finalizedAt: true,
        finalizedBy: { select: { displayName: true, firstName: true, lastName: true } },
      },
    }),
  ]);

  const clientPropertyTypes = clientProfile?.strataProfilePropertyTypes || [];

  const propertyTypeFinalizations = surveyRequirements.map(r => ({
    propertyTypeId: r.propertyTypeId,
    finalizedAt: r.finalizedAt?.toISOString() || null,
    finalizedByName: r.finalizedBy
      ? r.finalizedBy.displayName || [r.finalizedBy.firstName, r.finalizedBy.lastName].filter(Boolean).join(' ') || null
      : null,
  }));

  const profileTypeIds = new Set(clientPropertyTypes.map(r => r.propertyTypeId));
  const configuredTypeIds = new Set(surveyRequirements.map(r => r.propertyTypeId));
  const effectiveTypeIds = new Set([...configuredTypeIds].filter(id => profileTypeIds.has(id)));

  const userSectionsFinalized = effectiveTypeIds.size > 0 &&
    [...effectiveTypeIds].every(id => surveyRequirements.find(r => r.propertyTypeId === id)?.finalizedAt != null);

  let userSectionsComplete = false;
  if (!fileNumber.submittedForReviewDate && !userSectionsFinalized && clientPropertyTypes.length > 0) {
    const [srQuestions, responses] = await Promise.all([
      prisma.fnSurveyQuestion.findMany({
        where: { fileId: fileNumber.fileId },
        include: { question: { select: { questionId: true } } },
      }),
      prisma.questionResponse.findMany({
        where: { fileId: fileNumber.fileId, archivedAt: null },
        select: { questionId: true, propertyTypeId: true },
      }),
    ]);

    const userQuestionKeys = srQuestions
      .filter(sq => effectiveTypeIds.has(sq.propertyTypeId))
      .map(sq => surveyQuestionKey(sq.question.questionId, sq.propertyTypeId));

    if (userQuestionKeys.length > 0) {
      const answeredKeys = new Set(responses.map(r => surveyQuestionKey(r.questionId, r.propertyTypeId)));
      userSectionsComplete = userQuestionKeys.every(key => answeredKeys.has(key));
    }
  }

  return success(c, {
    ...fileNumber,
    clientPropertyTypes,
    propertyTypeFinalizations,
    userSectionsFinalized,
    userSectionsComplete,
  });
}, 'Failed to fetch active file number');

export const submitDocumentsForReview = asyncHandler(async (c) => {
  const user = c.get('user');
  const id = parseInt(c.req.param('id'));

  const fileNumber = await fileNumberService.getActiveByProfile(user.id);
  if (!fileNumber || fileNumber.fileId !== id) {
    return error(c, 'Service request not found or access denied', 404);
  }

  try {
    const updated = await fileNumberService.submitForReview(id, user.id);
    return success(c, updated);
  } catch (err: unknown) {
    const typed = err as Error & { code?: string };
    if (typed?.code === 'VALIDATION_ERROR') {
      return error(c, 'Once all strata sections have finalized their survey answers and uploaded all required documents, appointment booking will become available.', 400);
    }
    throw err;
  }
}, 'Failed to submit documents for review');

export const getPropertyTypeRequest = asyncHandler(async (c) => {
  const user = c.get('user');

  const strataProfile = await prisma.strataProfile.findFirst({
    where: { profileId: user.id }
  });
  if (!strataProfile) return success(c, null);

  const request = await propertyTypeRequestService.getLatestByStrataProfile(strataProfile.strataProfileId);
  return success(c, request);
}, 'Failed to fetch property type request');

export const createPropertyTypeRequest = asyncHandler(async (c) => {
  const user = c.get('user');
  const { propertyTypeIds } = await c.req.json<{ propertyTypeIds: number[] }>();

  if (!propertyTypeIds || propertyTypeIds.length === 0) {
    return error(c, 'At least one property type must be selected', 400);
  }

  const fileNumber = await fileNumberService.getActiveByProfile(user.id);
  if (!fileNumber) return error(c, 'No active file number', 404);

  const strataProfile = await prisma.strataProfile.findFirst({
    where: { strataId: fileNumber.strataId, profileId: user.id }
  });
  if (!strataProfile) return error(c, 'Strata profile not found', 404);

  try {
    const request = await propertyTypeRequestService.create(
      strataProfile.strataProfileId,
      propertyTypeIds
    );
    return created(c, request);
  } catch (err: unknown) {
    const typed = err as Error & { code?: string };
    if (typed?.code === 'DUPLICATE') {
      return error(c, typed.message, 400);
    }
    throw err;
  }
}, 'Failed to create property type request');
