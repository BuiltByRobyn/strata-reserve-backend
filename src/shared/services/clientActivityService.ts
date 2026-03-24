import { Prisma } from '@prisma/client';
import prisma from '../lib/prismaClient';

export async function logProfileChange(strataProfileId: number, changedFields: Record<string, unknown>) {
  await prisma.profileActivityLog.create({
    data: { strataProfileId, changedFields: changedFields as Prisma.InputJsonValue },
  });
}

export async function getRecentProfileActivities(hours: number) {
  const since = new Date(Date.now() - hours * 3_600_000);
  return prisma.profileActivityLog.findMany({
    where: { changedAt: { gte: since } },
    include: {
      strataProfile: {
        include: {
          strata: { select: { strataId: true, strataPlan: true, complexName: true } },
          profile: { select: { firstName: true, lastName: true, displayName: true } },
        },
      },
    },
    orderBy: { changedAt: 'desc' },
  });
}
