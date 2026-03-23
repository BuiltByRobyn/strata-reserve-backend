import * as fileNumberService from '../../shared/services/fileNumberService';
import * as fnSurveyQuestionService from '../../shared/services/fnSurveyQuestionService';
import * as activationRequestService from '../../shared/services/activationRequestService';
import prisma from '../../shared/lib/prismaClient';
import { success, created, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam, parseIntQuery, parseOptionalIntQuery } from '../../shared/helpers/parseParams';

export const getFileNumbers = asyncHandler(async (c) => {
  const strataId = parseOptionalIntQuery(c, 'strataId');
  const archivedParam = c.req.query('archived');
  const archived = archivedParam !== undefined ? archivedParam === 'true' : undefined;
  const fileNumbers = await fileNumberService.getFileNumbers({ strataId, archived });
  return success(c, fileNumbers);
}, 'Failed to fetch file numbers');

export const getFileNumberById = asyncHandler(async (c) => {
  const id = parseIntQuery(c, 'id');
  const fileNumber = await fileNumberService.getFileNumberById(id);
  if (!fileNumber) {
    return error(c, 'Service request not found', 404);
  }
  return success(c, fileNumber);
}, 'Failed to fetch file number');

export const getActiveByStrata = asyncHandler(async (c) => {
  const strataId = parseIntQuery(c, 'strataId');
  const fileNumber = await fileNumberService.getActiveByStrata(strataId);
  return success(c, fileNumber);
}, 'Failed to fetch active file number');

export const createFileNumber = asyncHandler(async (c) => {
  const body = await c.req.json();
  const user = c.get('user');
  if (!body.serviceId || !body.strataId || !body.requestedByProfileId || !body.fileNumber) {
    return error(c, 'serviceId, strataId, requestedByProfileId, and fileNumber are required', 400);
  }

  try {
    const fileNumber = await fileNumberService.createFileNumber({
      serviceId: parseInt(body.serviceId),
      strataId: parseInt(body.strataId),
      requestedByProfileId: body.requestedByProfileId,
      fileNumber: body.fileNumber.trim(),
      notes: body.notes?.trim()
    });

    const strata = await prisma.strata.findUnique({
      where: { strataId: parseInt(body.strataId) },
      select: { strataPropertyTypes: { select: { propertyTypeId: true } } }
    });
    const ptIds = strata?.strataPropertyTypes.map(spt => spt.propertyTypeId) ?? [];
    if (ptIds.length > 0) {
      await fnSurveyQuestionService.autoPopulateFromTemplates(fileNumber.fileId, ptIds);
    }

    // Approve the pending activation request for this client on this strata
    const strataProfile = await prisma.strataProfile.findFirst({
      where: { strataId: parseInt(body.strataId), profileId: body.requestedByProfileId },
      select: { strataProfileId: true }
    });
    if (strataProfile) {
      const pendingRequest = await prisma.activationRequest.findFirst({
        where: { strataProfileId: strataProfile.strataProfileId, status: 'Pending' },
        select: { activationRequestId: true }
      });
      if (pendingRequest) {
        await activationRequestService.approve(pendingRequest.activationRequestId, user.id);
      }
    }

    return created(c, fileNumber);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'INVALID_FORMAT') return error(c, 'File number must be in the format 12345-01.', 400);
      if (err.message.includes('already has an active file number')) return error(c, err.message, 400);
    }
    if ((err as any)?.code === 'P2002') return error(c, 'This file number already exists.', 400);
    throw err;
  }
}, 'Failed to create file number');

export const updateFileNumber = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();
  if (!body.fileNumber) {
    return error(c, 'fileNumber is required', 400);
  }
  try {
    const fileNumber = await fileNumberService.updateFileNumber(id, body.fileNumber.trim());
    return success(c, fileNumber);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'INVALID_FORMAT') return error(c, 'File number must be in the format 12345-01.', 400);
    }
    throw err;
  }
}, 'Failed to update file number');

export const offerAppointment = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const user = c.get('user');
  const body = await c.req.json();

  try {
    const result = await fileNumberService.offerAppointment(id, user.id, {
      dueDate: body.dueDate,
      appointmentTypeId: body.appointmentTypeId ? parseInt(body.appointmentTypeId) : undefined,
      inspectorProfileId: body.inspectorProfileId,
      secondInspectorProfileId: body.secondInspectorProfileId,
      notes: body.notes,
    });
    return success(c, result);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes('not found')) return error(c, err.message, 404);
      if (err.message.includes('already been')) return error(c, err.message, 400);
    }
    throw err;
  }
}, 'Failed to offer appointment');

export const deleteFileNumber = asyncHandler(async (c) => {
  const id = parseIntQuery(c, 'id');
  const authHeader = c.req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  await fileNumberService.deleteFileNumber(id, token);
  return success(c, { message: 'Service request and all related data deleted successfully' });
}, 'Failed to delete file number');
