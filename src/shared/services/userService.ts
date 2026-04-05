import prisma from '../lib/prismaClient';
import { supabase as supabaseAdmin } from '../lib/supabaseClient';
import { strataProfilesInclude } from '../constants/prismaIncludes';
import type { Prisma } from '@prisma/client';
import type { CreateUserInput, UpdateUserInput, StrataAssociationInput } from '../types/user.types';

const createStrataAssociations = async (
  profileId: string,
  associations: StrataAssociationInput[]
): Promise<void> => {
  for (const sa of associations) {
    const sp = await prisma.strataProfile.create({
      data: {
        profileId,
        strataId: sa.strataId,
        strataPosition: sa.strataPosition || null
      }
    });
    if (sa.sectionIds?.length) {
      await prisma.strataProfileSection.createMany({
        data: sa.sectionIds.map(sectionId => ({
          strataProfileId: sp.strataProfileId,
          sectionId
        }))
      });
    }
    if (sa.propertyTypeIds?.length) {
      await prisma.strataProfilePropertyType.createMany({
        data: sa.propertyTypeIds.map(propertyTypeId => ({
          strataProfileId: sp.strataProfileId,
          propertyTypeId
        }))
      });
    }
  }
};

const userInclude = {
  userType: true,
  strataProfiles: strataProfilesInclude
};

const userListInclude = {
  userType: { select: { userTypeId: true, userTypeName: true } },
  strataProfiles: strataProfilesInclude
};

export const getUsers = async (filters?: {
  search?: string;
  strataId?: string;
  userTypeId?: string;
}) => {
  const whereClause: Prisma.ProfileWhereInput = {};

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

export const resendInvite = async (id: string) => {
  const profile = await prisma.profile.findUnique({ where: { id } });
  if (!profile) throw new Error('User not found.');
  if (!profile.email) throw new Error('User has no email address.');
  if (!profile.mustChangePassword) throw new Error('User has already set their password.');

  const { error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    profile.email,
    {
      redirectTo: `${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}/auth/callback`,
      data: {
        first_name: profile.firstName,
        last_name: profile.lastName,
        display_name: profile.displayName,
        must_change_password: true
      }
    }
  );

  if (authError) {
    if (authError.status === 429 || authError.code === 'over_email_send_rate_limit') {
      throw new Error('Email rate limit exceeded. Please wait an hour before resending the invite.');
    }
    throw new Error(authError.message || 'Failed to resend invite.');
  }

  return { message: 'Invite resent successfully.' };
};

export const createUser = async (data: CreateUserInput) => {
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    data.email,
    {
      redirectTo: `${(process.env.FRONTEND_URL || '').replace(/\/$/, '')}/auth/callback`,
      data: {
        first_name: data.firstName,
        last_name: data.lastName,
        display_name: `${data.firstName} ${data.lastName}`,
        must_change_password: true
      }
    }
  );

  if (authError) {
    if (authError.status === 429 || authError.code === 'over_email_send_rate_limit') {
      throw new Error('Email rate limit exceeded. Please wait an hour before inviting another user.');
    }
    if (authError.message?.includes('already been registered')) {
      throw new Error('A user with this email address already exists.');
    }
    throw new Error(authError.message || 'Failed to create user account.');
  }

  const userId = authData.user.id;

  // Try to update profile (created by auth trigger) — if it fails, the invite was still sent
  try {
    await prisma.profile.update({
      where: { id: userId },
      data: {
        phoneNumber: data.phoneNumber,
        userTypeId: data.userTypeId,
        companyName: data.companyName || null
      }
    });

    await createStrataAssociations(userId, data.strataAssociations);
  } catch {
    // Profile may not exist yet due to trigger timing — return partial success
    return { id: userId, email: data.email, partialSuccess: true, message: 'Invite sent. User details will be updated when they accept.' };
  }

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

  const updateData: Prisma.ProfileUpdateInput = {};
  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.firstName !== undefined || data.lastName !== undefined) {
    const newFirst = data.firstName !== undefined ? data.firstName : existingUser.firstName;
    const newLast = data.lastName !== undefined ? data.lastName : existingUser.lastName;
    updateData.displayName = `${newFirst || ''} ${newLast || ''}`.trim() || null;
  }
  if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
  if (data.userTypeId !== undefined) updateData.userType = { connect: { userTypeId: data.userTypeId } };
  if (data.companyName !== undefined) updateData.companyName = data.companyName || null;

  await prisma.profile.update({
    where: { id },
    data: updateData
  });

  if (data.strataAssociations !== undefined) {
    await prisma.strataProfile.deleteMany({
      where: { profileId: id }
    });

    await createStrataAssociations(id, data.strataAssociations);
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

  const futureAppointment = await prisma.appointment.findFirst({
    where: {
      inspectorProfileId: id,
      status: { notIn: ['Cancelled', 'Completed'] },
      appointmentDate: { gte: new Date() }
    }
  });
  if (futureAppointment) {
    throw new Error('This inspector has future appointments already arranged, please reassign appointment inspector before continuing');
  }

  const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
  if (authError) {
    throw new Error(`Failed to delete auth user: ${authError.message}`);
  }

  return true;
};
