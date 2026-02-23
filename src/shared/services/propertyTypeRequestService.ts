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

export const getLatestByStrataProfile = async (strataProfileId: number) => {
  return prisma.propertyTypeRequest.findFirst({
    where: { strataProfileId },
    orderBy: { createdAt: 'desc' },
    include: requestInclude
  });
};

export const create = async (strataProfileId: number, propertyTypeIds: number[]) => {
  const existing = await prisma.propertyTypeRequest.findFirst({
    where: { strataProfileId, status: 'Pending' }
  });
  if (existing) {
    throw Object.assign(new Error('You already have a pending property type request'), { code: 'DUPLICATE' });
  }

  return prisma.propertyTypeRequest.create({
    data: {
      strataProfileId,
      requestedPropertyTypeIds: propertyTypeIds,
      status: 'Pending'
    },
    include: requestInclude
  });
};

export const getPending = async () => {
  return prisma.propertyTypeRequest.findMany({
    where: { status: 'Pending' },
    orderBy: { createdAt: 'asc' },
    include: requestInclude
  });
};

export const approve = async (requestId: number, reviewerProfileId: string) => {
  const request = await prisma.propertyTypeRequest.findUnique({
    where: { propertyTypeRequestId: requestId }
  });
  if (!request || request.status !== 'Pending') {
    throw new Error('Request not found or already reviewed');
  }

  return prisma.$transaction(async (tx) => {
    await tx.strataProfilePropertyType.deleteMany({
      where: { strataProfileId: request.strataProfileId }
    });

    if (request.requestedPropertyTypeIds.length > 0) {
      await tx.strataProfilePropertyType.createMany({
        data: request.requestedPropertyTypeIds.map(propertyTypeId => ({
          strataProfileId: request.strataProfileId,
          propertyTypeId
        }))
      });
    }

    return tx.propertyTypeRequest.update({
      where: { propertyTypeRequestId: requestId },
      data: {
        status: 'Approved',
        reviewedByProfileId: reviewerProfileId,
        reviewedAt: new Date()
      },
      include: requestInclude
    });
  });
};

export const reject = async (requestId: number, reviewerProfileId: string, rejectionReason: string) => {
  const request = await prisma.propertyTypeRequest.findUnique({
    where: { propertyTypeRequestId: requestId }
  });
  if (!request || request.status !== 'Pending') {
    throw new Error('Request not found or already reviewed');
  }

  return prisma.propertyTypeRequest.update({
    where: { propertyTypeRequestId: requestId },
    data: {
      status: 'Rejected',
      rejectionReason,
      reviewedByProfileId: reviewerProfileId,
      reviewedAt: new Date()
    },
    include: requestInclude
  });
};
