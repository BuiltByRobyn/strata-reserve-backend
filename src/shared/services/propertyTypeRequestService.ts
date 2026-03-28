import prisma from '../lib/prismaClient';
import { sendPropertyTypeUpdatedEmail, sendAdminPropertyTypeChangeRequestEmail } from '../lib/emailService';

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

  const result = await prisma.propertyTypeRequest.create({
    data: {
      strataProfileId,
      requestedPropertyTypeIds: propertyTypeIds,
      status: 'Pending'
    },
    include: requestInclude
  });

  const profile = result.strataProfile?.profile;
  const strata = result.strataProfile?.strata;

  if (strata) {
    const [currentTypes, requestedTypes, activeFile] = await Promise.all([
      prisma.strataProfilePropertyType.findMany({
        where: { strataProfileId },
        select: { propertyType: { select: { propertyTypeName: true } } },
      }),
      prisma.propertyType.findMany({
        where: { propertyTypeId: { in: propertyTypeIds } },
        select: { propertyTypeName: true },
      }),
      prisma.fileNumber.findFirst({
        where: { strataId: strata.strataId, archived: false },
        select: { fileNumber: true },
      }),
    ]);

    sendAdminPropertyTypeChangeRequestEmail({
      fileNumber: activeFile?.fileNumber || '',
      strataNumber: strata.strataPlan || '',
      propertyAddress: strata.complexName || strata.strataPlan || '',
      clientName: profile?.displayName || [profile?.firstName, profile?.lastName].filter(Boolean).join(' ') || 'Unknown',
      currentPropertyType: currentTypes.map(t => t.propertyType.propertyTypeName).join(', ') || 'None',
      requestedPropertyType: requestedTypes.map(t => t.propertyTypeName).join(', ') || 'None',
      requestedAt: new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
      clientNote: 'N/A',
    }).catch((err) => console.error('Failed to send admin property type change request email:', err));
  }

  return result;
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

  const [oldTypes, newTypes] = await Promise.all([
    prisma.strataProfilePropertyType.findMany({
      where: { strataProfileId: request.strataProfileId },
      select: { propertyType: { select: { propertyTypeName: true } } },
    }),
    prisma.propertyType.findMany({
      where: { propertyTypeId: { in: request.requestedPropertyTypeIds } },
      select: { propertyTypeName: true },
    }),
  ]);

  const result = await prisma.$transaction(async (tx) => {
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

  const profile = result.strataProfile?.profile;
  const strata = result.strataProfile?.strata;
  if (profile?.email && strata) {
    const activeFile = await prisma.fileNumber.findFirst({
      where: { strataId: strata.strataId, archived: false },
      select: { fileNumber: true },
    });

    sendPropertyTypeUpdatedEmail({
      to: profile.email,
      strataNumber: strata.strataPlan || '',
      status: 'Approved',
      decisionDate: new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
    }).catch((err) => console.error('Failed to send property type updated email:', err));
  }

  return result;
};

export const reject = async (requestId: number, reviewerProfileId: string, rejectionReason: string) => {
  const request = await prisma.propertyTypeRequest.findUnique({
    where: { propertyTypeRequestId: requestId }
  });
  if (!request || request.status !== 'Pending') {
    throw new Error('Request not found or already reviewed');
  }

  const result = await prisma.propertyTypeRequest.update({
    where: { propertyTypeRequestId: requestId },
    data: {
      status: 'Rejected',
      rejectionReason,
      reviewedByProfileId: reviewerProfileId,
      reviewedAt: new Date()
    },
    include: requestInclude
  });

  const profile = result.strataProfile?.profile;
  const strata = result.strataProfile?.strata;
  if (profile?.email && strata) {
    sendPropertyTypeUpdatedEmail({
      to: profile.email,
      strataNumber: strata.strataPlan || '',
      status: 'Rejected',
      decisionDate: new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
    }).catch((err) => console.error('Failed to send property type rejected email:', err));
  }

  return result;
};
