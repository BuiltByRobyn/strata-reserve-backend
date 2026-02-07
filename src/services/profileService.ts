// Profile Service - Extended operations for profiles
import prisma from '../lib/prismaClient';

export interface UpdateProfileInput {
  firstName?: string;
  middleName?: string | null;
  lastName?: string;
  displayName?: string;
  phoneNumber?: string | null;
  userTypeId?: number | null;
  mustChangePassword?: boolean;
}

// ============================================
// Get All Profiles (Admin only)
// ============================================
export const getProfiles = async () => {
  return prisma.profile.findMany({
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      userType: { select: { userTypeId: true, userTypeName: true } },
      _count: {
        select: { strataEmployees: true }
      }
    }
  });
};

// ============================================
// Get Profile by ID
// ============================================
export const getProfileById = async (id: string) => {
  return prisma.profile.findUnique({
    where: { id },
    include: {
      userType: true,
      strataEmployees: {
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

// ============================================
// Update Profile
// ============================================
export const updateProfile = async (id: string, data: UpdateProfileInput) => {
  return prisma.profile.update({
    where: { id },
    data
  });
};

// ============================================
// Get Profiles by User Type
// ============================================
export const getProfilesByUserType = async (userTypeId: number) => {
  return prisma.profile.findMany({
    where: { userTypeId },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      userType: { select: { userTypeName: true } }
    }
  });
};

// ============================================
// Search Profiles
// ============================================
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

// ============================================
// Get Profiles Not Assigned to Strata
// ============================================
export const getUnassignedProfiles = async (strataId: number) => {
  const assignedProfileIds = await prisma.strataEmployee.findMany({
    where: { strataId },
    select: { profileId: true }
  });

  const assignedIds = assignedProfileIds.map(p => p.profileId);

  return prisma.profile.findMany({
    where: {
      id: { notIn: assignedIds }
    },
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: {
      userType: { select: { userTypeName: true } }
    }
  });
};
