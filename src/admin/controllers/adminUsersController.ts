import * as userService from '../../shared/services/userService';
import { success, created, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { sendWelcomeEmail } from '../../shared/lib/emailService';
import { supabase } from '../../shared/lib/supabaseClient';
import type { CreateUserInput, UpdateUserInput } from '../../shared/types/user.types';

export const getUsers = asyncHandler(async (c) => {
  const { search, strataId, userTypeId } = c.req.query();
  const users = await userService.getUsers({ search, strataId, userTypeId });
  return success(c, users);
}, 'Failed to fetch users');

export const getUserById = asyncHandler(async (c) => {
  const id = c.req.param('id');
  const user = await userService.getUserById(id);
  if (!user) {
    return error(c, 'User not found', 404);
  }
  return success(c, user);
}, 'Failed to fetch user');

export const createUser = asyncHandler(async (c) => {
  const body = await c.req.json<CreateUserInput>();
  const { firstName, lastName, email, phoneNumber, userTypeId, strataAssociations } = body;

  if (!firstName || !lastName || !email || !phoneNumber || !userTypeId) {
    return error(c, 'Missing required fields', 400);
  }

  if (!strataAssociations || strataAssociations.length === 0) {
    return error(c, 'At least one strata association is required', 400);
  }

  const user = await userService.createUser(body);

  // Send welcome email with login link (non-blocking)
  try {
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
    });
    const loginLink = linkData?.properties?.action_link ?? undefined;
    await sendWelcomeEmail({ to: email, firstName, loginLink });
  } catch (emailErr) {
    console.error('Failed to send welcome email:', emailErr);
  }

  return created(c, user);
}, 'Failed to create user');

export const updateUser = asyncHandler(async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json<UpdateUserInput>();
  const user = await userService.updateUser(id, body);
  if (!user) {
    return error(c, 'User not found', 404);
  }
  return success(c, user);
}, 'Failed to update user');

export const deleteUser = asyncHandler(async (c) => {
  const id = c.req.param('id');
  const result = await userService.deleteUser(id);
  if (!result) {
    return error(c, 'User not found', 404);
  }
  return success(c, { message: 'User deleted successfully' });
}, 'Failed to delete user');
