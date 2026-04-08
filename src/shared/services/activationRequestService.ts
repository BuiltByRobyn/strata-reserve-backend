import prisma from '../lib/prismaClient';
import { sendAdminActivationRequestEmail } from '../lib/emailService';

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

export const getByStrataId = async (strataId: number) => {
  return prisma.activationRequest.findFirst({
    where: { strataProfile: { strataId } },
    orderBy: { createdAt: 'desc' },
    include: requestInclude
  });
};

export const create = async (strataProfileId: number) => {
  // Check for any pending request across the entire strata (not just this user)
  const strataProfile = await prisma.strataProfile.findUnique({
    where: { strataProfileId },
    select: { strataId: true },
  });
  if (!strataProfile) throw new Error('Strata profile not found');

  const existing = await prisma.activationRequest.findFirst({
    where: {
      strataProfile: { strataId: strataProfile.strataId },
      status: 'Pending',
    },
  });
  if (existing) {
    throw Object.assign(new Error('A pending activation request already exists for this strata'), { code: 'DUPLICATE' });
  }

  const result = await prisma.activationRequest.create({
    data: { strataProfileId, status: 'Pending' },
    include: requestInclude
  });

  const profile = result.strataProfile.profile;
  const strata = result.strataProfile.strata;
  const clientName = profile.displayName || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Unknown';

  sendAdminActivationRequestEmail({
    clientName,
    strataNumber: strata.strataPlan || '',
    complexName: strata.complexName || strata.strataPlan || '',
    requestedAt: new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
  }).catch((err) => console.error('Failed to send admin activation request email:', err));

  return result;
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
