import type { Context } from 'hono';

export class ParamError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParamError';
  }
}

export const parseIntParam = (c: Context, paramName: string): number => {
  const raw = c.req.param(paramName);
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new ParamError(`Invalid ${paramName}`);
  }
  return parsed;
};

export const parseIntQuery = (c: Context, queryName: string): number => {
  const raw = c.req.query(queryName) || '';
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new ParamError(`Invalid ${queryName}`);
  }
  return parsed;
};

export const parseOptionalIntQuery = (c: Context, queryName: string): number | undefined => {
  const raw = c.req.query(queryName);
  if (!raw) return undefined;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    throw new ParamError(`Invalid ${queryName}`);
  }
  return parsed;
};

export const parseDate = (value: string | undefined | null, fieldName: string): Date => {
  if (!value) {
    throw new ParamError(`${fieldName} is required`);
  }
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    throw new ParamError(`Invalid date format for ${fieldName}`);
  }
  return date;
};

export const parseOptionalDate = (value: string | undefined | null): Date | null => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date;
};
