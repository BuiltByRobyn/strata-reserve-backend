import prisma from '../lib/prismaClient';

const requestInclude = {
  strataProfile: {
    include: {
      profile: { select: { id: true, firstName: true, lastName: true, displayName: true, email: true } },
      strata: { select: { strataId: true, strataPlan: true, complexName: true } }
    }
  },
  reviewedBy: { select: { id: true, firstName: true, lastName: true, displayName: true } }
};

export const getByStrataProfile = async (strataProfileId: number) => {
  return prisma.activationRequest.findFirst({
    where: { strataProfileId },
    orderBy: { createdAt: 'desc' },
    include: requestInclude
  });
};

export const create = async (strataProfileId: number) => {
  const existing = await prisma.activationRequest.findFirst({
    where: { strataProfileId, status: 'Pending' }
  });
  if (existing) {
    throw Object.assign(new Error('You already have a pending activation request'), { code: 'DUPLICATE' });
  }

  return prisma.activationRequest.create({
    data: { strataProfileId, status: 'Pending' },
    include: requestInclude
  });
};

export const getPending = async () => {
  return prisma.activationRequest.findMany({
    where: { status: 'Pending' },
    orderBy: { createdAt: 'asc' },
    include: requestInclude
  });
};

export const approve = async (requestId: number, reviewerProfileId: string) => {
  const request = await prisma.activationRequest.findUnique({
    where: { activationRequestId: requestId }
  });
  if (!request || request.status !== 'Pending') {
    throw new Error('Request not found or already reviewed');
  }

  return prisma.activationRequest.update({
    where: { activationRequestId: requestId },
    data: {
      status: 'Approved',
      reviewedByProfileId: reviewerProfileId,
      reviewedAt: new Date()
    },
    include: requestInclude
  });
};

export const reject = async (requestId: number, reviewerProfileId: string, rejectionReason?: string) => {
  const request = await prisma.activationRequest.findUnique({
    where: { activationRequestId: requestId }
  });
  if (!request || request.status !== 'Pending') {
    throw new Error('Request not found or already reviewed');
  }

  return prisma.activationRequest.update({
    where: { activationRequestId: requestId },
    data: {
      status: 'Rejected',
      rejectionReason: rejectionReason || null,
      reviewedByProfileId: reviewerProfileId,
      reviewedAt: new Date()
    },
    include: requestInclude
  });
};
