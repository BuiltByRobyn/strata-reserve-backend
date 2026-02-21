import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import * as timelinesService from '../../shared/services/timelinesService';
import prisma from '../../shared/lib/prismaClient';

export const getTimelines = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'serviceRequestId');
  const user = c.get('user');

  const sr = await prisma.serviceRequest.findFirst({
    where: {
      serviceRequestId,
      strata: { strataProfiles: { some: { profileId: user.id } } }
    },
    select: { serviceRequestId: true }
  });

  if (!sr) {
    return error(c, 'Service request not found', 404);
  }

  const timelines = await timelinesService.getTimelinesByServiceRequest(serviceRequestId);
  return success(c, timelines);
}, 'Failed to fetch timelines');

export const updateTimelines = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'serviceRequestId');
  const user = c.get('user');
  const body = await c.req.json();

  const sr = await prisma.serviceRequest.findFirst({
    where: {
      serviceRequestId,
      strata: { strataProfiles: { some: { profileId: user.id } } }
    },
    select: { serviceRequestId: true }
  });

  if (!sr) {
    return error(c, 'Service request not found', 404);
  }

  const updated = await timelinesService.updateTimelines(serviceRequestId, {
    fiscalYearEnd: body.fiscalYearEnd,
    lastAgmDate: body.lastAgmDate,
    noAgmToDate: body.noAgmToDate,
    lastDepreciationReportDate: body.lastDepreciationReportDate,
    noReportToDate: body.noReportToDate,
    targetDate: body.targetDate,
  });

  return success(c, updated);
}, 'Failed to update timelines');
