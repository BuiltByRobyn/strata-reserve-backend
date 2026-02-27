import type { Context } from 'hono';
import { ParamError, parseIntParam } from './parseParams';

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

export const getByIdHandler = (
  serviceFn: (id: number) => Promise<unknown>,
  entityName: string,
  errorMessage?: string
) => {
  return asyncHandler(async (c) => {
    const id = parseIntParam(c, 'id');
    const entity = await serviceFn(id);
    if (!entity) {
      return error(c, `${entityName} not found`, 404);
    }
    return success(c, entity);
  }, errorMessage || `Failed to fetch ${entityName.toLowerCase()}`);
};

export const deleteHandler = (
  serviceFn: (id: number) => Promise<unknown>,
  entityName: string,
  errorMessage?: string
) => {
  return asyncHandler(async (c) => {
    const id = parseIntParam(c, 'id');
    await serviceFn(id);
    return success(c, { message: `${entityName} deleted successfully` });
  }, errorMessage || `Failed to delete ${entityName.toLowerCase()}`);
};
