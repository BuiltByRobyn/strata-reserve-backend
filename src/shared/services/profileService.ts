import prisma from '../lib/prismaClient';
import type { UpdateProfileInput } from '../types/profile.types';

export const getProfiles = async () => {
  return prisma.profile.findMany({
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      userType: { select: { userTypeId: true, userTypeName: true } },
      _count: {
        select: { strataProfiles: true }
      }
    }
  });
};

export const getProfileById = async (id: string) => {
  return prisma.profile.findUnique({
    where: { id },
    include: {
      userType: true,
      strataProfiles: {
        include: {
          strata: {
            select: {
              strataId: true,
              strataPlan: true,
              complexName: true,
              company: { select: { companyName: true } }
            }
          }
        }
      }
    }
  });
};

export const updateProfile = async (id: string, data: UpdateProfileInput) => {
  return prisma.profile.update({
    where: { id },
    data
  });
};

export const getProfilesByUserType = async (userTypeId: number) => {
  return prisma.profile.findMany({
    where: { userTypeId },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      userType: { select: { userTypeName: true } }
    }
  });
};

export const searchProfiles = async (query: string) => {
  return prisma.profile.findMany({
    where: {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { displayName: { contains: query, mode: 'insensitive' } }
      ]
    },
    include: {
      userType: { select: { userTypeName: true } }
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }]
  });
};

export const getUnassignedProfiles = async (strataId: number) => {
  return prisma.profile.findMany({
    where: {
      strataProfiles: { none: { strataId } }
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      userType: { select: { userTypeName: true } }
    }
  });
};
