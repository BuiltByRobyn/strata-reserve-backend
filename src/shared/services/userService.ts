import prisma from '../lib/prismaClient';
import { createClient } from '@supabase/supabase-js';
import type { CreateUserInput, UpdateUserInput } from '../types/user.types';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const userInclude = {
  userType: true,
  strataProfiles: {
    include: {
      strata: {
        select: {
          strataId: true,
          strataPlan: true,
          complexName: true,
          company: { select: { companyId: true, companyName: true } }
        }
      }
    }
  }
};

const userListInclude = {
  userType: { select: { userTypeId: true, userTypeName: true } },
  strataProfiles: {
    include: {
      strata: {
        select: {
          strataId: true,
          strataPlan: true,
          complexName: true,
          company: { select: { companyId: true, companyName: true } }
        }
      }
    }
  }
};

export const getUsers = async (filters?: {
  search?: string;
  strataId?: string;
  userTypeId?: string;
}) => {
  const whereClause: any = {};

  if (filters?.search) {
    whereClause.OR = [
      { firstName: { contains: filters.search, mode: 'insensitive' } },
      { lastName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } }
    ];
  }

  if (filters?.userTypeId) {
    whereClause.userTypeId = parseInt(filters.userTypeId);
  }

  if (filters?.strataId) {
    whereClause.strataProfiles = {
      some: { strataId: parseInt(filters.strataId) }
    };
  }

  return prisma.profile.findMany({
    where: whereClause,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    include: userListInclude
  });
};

export const getUserById = async (id: string) => {
  return prisma.profile.findUnique({
    where: { id },
    include: userInclude
  });
};

export const createUser = async (data: CreateUserInput) => {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    email_confirm: true,
    user_metadata: {
      first_name: data.firstName,
      last_name: data.lastName,
      display_name: `${data.firstName} ${data.lastName}`,
      must_change_password: true
    }
  });

  if (authError) {
    throw authError;
  }

  const userId = authData.user.id;

  await prisma.profile.update({
    where: { id: userId },
    data: {
      phoneNumber: data.phoneNumber,
      userTypeId: data.userTypeId,
      companyName: data.companyName || null
    }
  });

  await prisma.strataProfile.createMany({
    data: data.strataAssociations.map(sa => ({
      profileId: userId,
      strataId: sa.strataId,
      strataPosition: sa.strataPosition || null
    }))
  });

  return prisma.profile.findUnique({
    where: { id: userId },
    include: userInclude
  });
};

export const updateUser = async (id: string, data: UpdateUserInput) => {
  const existingUser = await prisma.profile.findUnique({ where: { id } });
  if (!existingUser) {
    return null;
  }

  const updateData: any = {};
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
  if (data.userTypeId !== undefined) updateData.userTypeId = data.userTypeId;
  if (data.companyName !== undefined) updateData.companyName = data.companyName || null;

  await prisma.profile.update({
    where: { id },
    data: updateData
  });

  if (data.strataAssociations !== undefined) {
    await prisma.strataProfile.deleteMany({
      where: { profileId: id }
    });

    if (data.strataAssociations.length > 0) {
      await prisma.strataProfile.createMany({
        data: data.strataAssociations.map(sa => ({
          profileId: id,
          strataId: sa.strataId,
          strataPosition: sa.strataPosition || null
        }))
      });
    }
  }

  return prisma.profile.findUnique({
    where: { id },
    include: userInclude
  });
};

export const deleteUser = async (id: string) => {
  const existingUser = await prisma.profile.findUnique({ where: { id } });
  if (!existingUser) {
    return null;
  }

  await prisma.strataProfile.deleteMany({
    where: { profileId: id }
  });

  await prisma.profile.delete({ where: { id } });

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authError) {
    console.error('Auth delete error (user already deleted from DB):', authError);
  }

  return true;
};
