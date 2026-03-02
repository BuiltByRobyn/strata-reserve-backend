import * as serviceRequestService from '../../shared/services/serviceRequestService';
import * as srSurveyQuestionService from '../../shared/services/srSurveyQuestionService';
import prisma from '../../shared/lib/prismaClient';
import { success, created, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntQuery, parseOptionalIntQuery } from '../../shared/helpers/parseParams';

export const getServiceRequests = asyncHandler(async (c) => {
  const strataId = parseOptionalIntQuery(c, 'strataId');
  const archivedParam = c.req.query('archived');
  const archived = archivedParam !== undefined ? archivedParam === 'true' : undefined;
  const serviceRequests = await serviceRequestService.getServiceRequests({ strataId, archived });
  return success(c, serviceRequests);
}, 'Failed to fetch service requests');

export const getServiceRequestById = asyncHandler(async (c) => {
  const id = parseIntQuery(c, 'id');
  const serviceRequest = await serviceRequestService.getServiceRequestById(id);
  if (!serviceRequest) {
    return error(c, 'Service request not found', 404);
  }
  return success(c, serviceRequest);
}, 'Failed to fetch service request');

export const getActiveByStrata = asyncHandler(async (c) => {
  const strataId = parseIntQuery(c, 'strataId');
  const serviceRequest = await serviceRequestService.getActiveByStrata(strataId);
  return success(c, serviceRequest);
}, 'Failed to fetch active service request');

export const createServiceRequest = asyncHandler(async (c) => {
  const body = await c.req.json();
  if (!body.serviceId || !body.strataId || !body.requestedByProfileId) {
    return error(c, 'serviceId, strataId, and requestedByProfileId are required', 400);
  }

  try {
    const serviceRequest = await serviceRequestService.createServiceRequest({
      serviceId: parseInt(body.serviceId),
      strataId: parseInt(body.strataId),
      requestedByProfileId: body.requestedByProfileId,
      notes: body.notes?.trim()
    });

    const strata = await prisma.strata.findUnique({
      where: { strataId: parseInt(body.strataId) },
      select: { strataPropertyTypes: { select: { propertyTypeId: true } } }
    });
    const ptIds = strata?.strataPropertyTypes.map(spt => spt.propertyTypeId) ?? [];
    if (ptIds.length > 0) {
      await srSurveyQuestionService.autoPopulateFromTemplates(serviceRequest.serviceRequestId, ptIds);
    }

    return created(c, serviceRequest);
  } catch (err) {
    if (err instanceof Error && err.message.includes('already has an active service request')) {
      return error(c, err.message, 400);
    }
    throw err;
  }
}, 'Failed to create service request');

export const deleteServiceRequest = asyncHandler(async (c) => {
  const id = parseIntQuery(c, 'id');
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  await serviceRequestService.deleteServiceRequest(id, token);
  return success(c, { message: 'Service request and all related data deleted successfully' });
}, 'Failed to delete service request');
