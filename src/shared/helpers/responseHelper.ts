import type { Context } from 'hono';
import { ParamError } from './parseParams';

type StatusCode = 200 | 201 | 400 | 401 | 403 | 404 | 500;

export const success = (c: Context, data: unknown, status: StatusCode = 200) => {
  return c.json({ success: true, data }, status);
};

export const created = (c: Context, data: unknown) => {
  return c.json({ success: true, data }, 201);
};

export const error = (c: Context, message: string, status: StatusCode = 500) => {
  return c.json({ success: false, error: message }, status);
};

export const asyncHandler = (fn: (c: Context) => Promise<Response>, errorMessage: string) => {
  return async (c: Context) => {
    try {
      return await fn(c);
    } catch (err) {
      if (err instanceof ParamError) {
        return error(c, err.message, 400);
      }
      console.error(`${errorMessage}:`, err);
      return error(c, errorMessage, 500);
    }
  };
};
