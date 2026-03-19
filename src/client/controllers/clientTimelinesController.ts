import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import * as timelinesService from '../../shared/services/timelinesService';
import prisma from '../../shared/lib/prismaClient';

export const getTimelines = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'fileId');
  const user = c.get('user');

  const sr = await prisma.fileNumber.findFirst({
    where: {
      fileId: fileId,
      strata: { strataProfiles: { some: { profileId: user.id } } }
    },
    select: { fileId: true }
  });

  if (!sr) {
    return error(c, 'Service request not found', 404);
  }

  const timelines = await timelinesService.getTimelinesByFileNumber(fileId);
  return success(c, timelines);
}, 'Failed to fetch timelines');

export const updateTimelines = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'fileId');
  const user = c.get('user');
  const body = await c.req.json();

  const sr = await prisma.fileNumber.findFirst({
    where: {
      fileId: fileId,
      strata: { strataProfiles: { some: { profileId: user.id } } }
    },
    select: { fileId: true }
  });

  if (!sr) {
    return error(c, 'Service request not found', 404);
  }

  const updated = await timelinesService.updateTimelines(fileId, {
    fiscalYearEnd: body.fiscalYearEnd,
    lastAgmDate: body.lastAgmDate,
    noAgmToDate: body.noAgmToDate,
    lastDepreciationReportDate: body.lastDepreciationReportDate,
    noReportToDate: body.noReportToDate,
    targetDate: body.targetDate,
    timelinesSubmittedAt: new Date().toISOString(),
  });

  return success(c, updated);
}, 'Failed to update timelines');
