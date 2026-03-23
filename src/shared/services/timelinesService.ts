import prisma from '../lib/prismaClient';
import { toUTCDate } from '../helpers/dateUtils';
import type { UpdateTimelinesInput } from '../types/timeline.types';

export type { UpdateTimelinesInput };

const timelineSelect = {
  fileId: true,
  requestDate: true,
  fiscalYearEnd: true,
  lastAgmDate: true,
  noAgmToDate: true,
  lastDepreciationReportDate: true,
  noReportToDate: true,
  targetDate: true,
  timelinesSubmittedAt: true,
};

export const getTimelinesByFileNumber = async (fileId: number) => {
  return prisma.fileNumber.findUnique({
    where: { fileId: fileId },
    select: timelineSelect,
  });
};

export const updateTimelines = async (fileId: number, data: UpdateTimelinesInput) => {
  const result = await prisma.fileNumber.update({
    where: { fileId: fileId },
    data: {
      fiscalYearEnd: toUTCDate(data.fiscalYearEnd),
      lastAgmDate: toUTCDate(data.lastAgmDate),
      noAgmToDate: data.noAgmToDate,
      lastDepreciationReportDate: toUTCDate(data.lastDepreciationReportDate),
      noReportToDate: data.noReportToDate,
      targetDate: toUTCDate(data.targetDate),
      ...(data.timelinesSubmittedAt !== undefined && {
        timelinesSubmittedAt: toUTCDate(data.timelinesSubmittedAt),
      }),
    },
    select: { ...timelineSelect, strataId: true },
  });

  // Sync fiscalYearEnd to the parent Strata record
  if (data.fiscalYearEnd !== undefined) {
    await prisma.strata.update({
      where: { strataId: result.strataId },
      data: {
        fiscalYearEnd: toUTCDate(data.fiscalYearEnd) ?? null,
      },
    });
  }

  const { strataId, ...timelineData } = result;
  return timelineData;
};

export const getLatestTimelinesByStrata = async (strataId: number) => {
  return prisma.fileNumber.findFirst({
    where: { strataId },
    orderBy: { requestDate: 'desc' },
    select: timelineSelect,
  });
};
