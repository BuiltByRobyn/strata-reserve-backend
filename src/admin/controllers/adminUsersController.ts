// Admin Users Controller - CRUD operations for user management
import { Context } from 'hono';
import prisma from '../../lib/prismaClient';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client for user creation
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ============================================
// Input Types
// ============================================

interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userTypeId: number;
  companyName?: string;
  strataAssociations: Array<{
    strataId: number;
    strataPosition?: string;
  }>;
}

interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userTypeId?: number;
  companyName?: string;
  strataAssociations?: Array<{
    strataId: number;
    strataPosition?: string;
  }>;
}

// ============================================
// Get All Users (with filters)
// ============================================
export const getUsers = async (c: Context) => {
  try {
    const { search, strataId, userTypeId } = c.req.query();

    const whereClause: any = {};

    // Search by name or email
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filter by user type
    if (userTypeId) {
      whereClause.userTypeId = parseInt(userTypeId);
    }

    // Filter by strata
    if (strataId) {
      whereClause.strataProfiles = {
        some: { strataId: parseInt(strataId) }
      };
    }

    const users = await prisma.profile.findMany({
      where: whereClause,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      include: {
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
      }
    });

    return c.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return c.json({ success: false, error: 'Failed to fetch users' }, 500);
  }
};

// ============================================
// Get User by ID
// ============================================
export const getUserById = async (c: Context) => {
  try {
    const id = c.req.param('id');

    const user = await prisma.profile.findUnique({
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
                company: { select: { companyId: true, companyName: true } }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ success: false, error: 'Failed to fetch user' }, 500);
  }
};

// ============================================
// Create User
// ============================================
export const createUser = async (c: Context) => {
  try {
    const body = await c.req.json<CreateUserInput>();

    const { firstName, lastName, email, phoneNumber, userTypeId, strataAssociations } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phoneNumber || !userTypeId) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    if (!strataAssociations || strataAssociations.length === 0) {
      return c.json({ success: false, error: 'At least one strata association is required' }, 400);
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        must_change_password: true
      }
    });

    if (authError) {
      console.error('Auth error:', authError);
      return c.json({ success: false, error: authError.message }, 400);
    }

    const userId = authData.user.id;

    // Update profile with additional info (trigger creates basic profile)
    await prisma.profile.update({
      where: { id: userId },
      data: {
        phoneNumber,
        userTypeId,
        companyName: body.companyName || null
      }
    });

    // Create strata associations
    await prisma.strataProfile.createMany({
      data: strataAssociations.map(sa => ({
        profileId: userId,
        strataId: sa.strataId,
        strataPosition: sa.strataPosition || null
      }))
    });

    // Fetch complete user with associations
    const user = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
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
      }
    });

    return c.json({ success: true, data: user }, 201);
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ success: false, error: 'Failed to create user' }, 500);
  }
};

// ============================================
// Update User
// ============================================
export const updateUser = async (c: Context) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<UpdateUserInput>();

    const { firstName, lastName, phoneNumber, userTypeId, strataAssociations } = body;

    // Check user exists
    const existingUser = await prisma.profile.findUnique({ where: { id } });
    if (!existingUser) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Update profile
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (userTypeId !== undefined) updateData.userTypeId = userTypeId;
    if (body.companyName !== undefined) updateData.companyName = body.companyName || null;

    await prisma.profile.update({
      where: { id },
      data: updateData
    });

    // Update strata associations if provided
    if (strataAssociations !== undefined) {
      // Remove existing associations
      await prisma.strataProfile.deleteMany({
        where: { profileId: id }
      });

      // Create new associations
      if (strataAssociations.length > 0) {
        await prisma.strataProfile.createMany({
          data: strataAssociations.map(sa => ({
            profileId: id,
            strataId: sa.strataId,
            strataPosition: sa.strataPosition || null
          }))
        });
      }
    }

    // Fetch updated user
    const user = await prisma.profile.findUnique({
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
                company: { select: { companyId: true, companyName: true } }
              }
            }
          }
        }
      }
    });

    return c.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating user:', error);
    return c.json({ success: false, error: 'Failed to update user' }, 500);
  }
};

// ============================================
// Delete User
// ============================================
export const deleteUser = async (c: Context) => {
  try {
    const id = c.req.param('id');

    // Check user exists
    const existingUser = await prisma.profile.findUnique({ where: { id } });
    if (!existingUser) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // First, delete strata associations (foreign key constraint)
    await prisma.strataProfile.deleteMany({
      where: { profileId: id }
    });

    // Delete profile from database
    await prisma.profile.delete({ where: { id } });

    // Finally, delete from Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
      console.error('Auth delete error (user already deleted from DB):', authError);
      // Don't fail - the user is already gone from our DB
    }

    return c.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return c.json({ success: false, error: 'Failed to delete user' }, 500);
  }
};
