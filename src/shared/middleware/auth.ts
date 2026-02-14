import { Context, Next } from 'hono';
import { supabase } from '../lib/supabaseClient';
import { prisma } from '../lib/prismaClient';

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized - No token provided' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return c.json({ success: false, error: 'Unauthorized - Invalid token' }, 401);
    }

    c.set('user', user);
    await next();
  } catch {
    return c.json({ success: false, error: 'Unauthorized - Token verification failed' }, 401);
  }
};

export const adminMiddleware = async (c: Context, next: Next) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }

    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { isAdmin: true },
    });

    if (!profile?.isAdmin) {
      return c.json({ success: false, error: 'Forbidden - You are not authorized to access this resource' }, 403);
    }

    await next();
  } catch {
    return c.json({ success: false, error: 'Authorization check failed' }, 500);
  }
};
