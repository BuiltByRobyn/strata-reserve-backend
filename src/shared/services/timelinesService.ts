import prisma from '../lib/prismaClient';
import { toUTCDate } from '../helpers/dateUtils';
import type { UpdateTimelinesInput } from '../types/timeline.types';

export type { UpdateTimelinesInput };

const timelineSelect = {
  fileNumberId: true,
  requestDate: true,
  fiscalYearEnd: true,
  lastAgmDate: true,
  noAgmToDate: true,
  lastDepreciationReportDate: true,
  noReportToDate: true,
  targetDate: true,
};

export const getTimelinesByFileNumber = async (fileNumberId: number) => {
  return prisma.fileNumber.findUnique({
    where: { fileNumberId },
    select: timelineSelect,
  });
};

export const updateTimelines = async (fileNumberId: number, data: UpdateTimelinesInput) => {
  const result = await prisma.fileNumber.update({
    where: { fileNumberId },
    data: {
      fiscalYearEnd: toUTCDate(data.fiscalYearEnd),
      lastAgmDate: toUTCDate(data.lastAgmDate),
      noAgmToDate: data.noAgmToDate,
      lastDepreciationReportDate: toUTCDate(data.lastDepreciationReportDate),
      noReportToDate: data.noReportToDate,
      targetDate: toUTCDate(data.targetDate),
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
