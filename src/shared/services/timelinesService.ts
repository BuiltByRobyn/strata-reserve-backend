import prisma from '../lib/prismaClient';
import type { UpdateTimelinesInput } from '../types/timeline.types';

export type { UpdateTimelinesInput };

const timelineSelect = {
  serviceRequestId: true,
  requestDate: true,
  fiscalYearEnd: true,
  lastAgmDate: true,
  noAgmToDate: true,
  lastDepreciationReportDate: true,
  noReportToDate: true,
  targetDate: true,
};

export const getTimelinesByServiceRequest = async (serviceRequestId: number) => {
  return prisma.serviceRequest.findUnique({
    where: { serviceRequestId },
    select: timelineSelect,
  });
};

export const updateTimelines = async (serviceRequestId: number, data: UpdateTimelinesInput) => {
  return prisma.serviceRequest.update({
    where: { serviceRequestId },
    data: {
      fiscalYearEnd: data.fiscalYearEnd ? new Date(data.fiscalYearEnd) : data.fiscalYearEnd === null ? null : undefined,
      lastAgmDate: data.lastAgmDate ? new Date(data.lastAgmDate) : data.lastAgmDate === null ? null : undefined,
      noAgmToDate: data.noAgmToDate,
      lastDepreciationReportDate: data.lastDepreciationReportDate ? new Date(data.lastDepreciationReportDate) : data.lastDepreciationReportDate === null ? null : undefined,
      noReportToDate: data.noReportToDate,
      targetDate: data.targetDate ? new Date(data.targetDate) : data.targetDate === null ? null : undefined,
    },
    select: timelineSelect,
  });
};

export const getLatestTimelinesByStrata = async (strataId: number) => {
  return prisma.serviceRequest.findFirst({
    where: { strataId },
    orderBy: { requestDate: 'desc' },
    select: timelineSelect,
  });
};
