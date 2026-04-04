import type { Context } from 'hono';
import { success, error } from '../helpers/responseHelper';
import { asyncHandler } from '../helpers/responseHelper';
import { parseIntParam } from '../helpers/parseParams';
import * as helpResourceService from '../services/helpResourceService';

export const getPublicResources = asyncHandler(async (c: Context) => {
  const resources = await helpResourceService.getResourcesByAudience('client');
  return success(c, resources);
}, 'Failed to fetch public help resources');

export const getInternalResources = asyncHandler(async (c: Context) => {
  const resources = await helpResourceService.getResourcesByAudience('internal');
  return success(c, resources);
}, 'Failed to fetch internal help resources');

export const getPublicResourceById = asyncHandler(async (c: Context) => {
  const id = parseIntParam(c, 'id');
  const resource = await helpResourceService.getResourceById(id, 'client');
  if (!resource) {
    return error(c, 'Resource not found', 404);
  }
  return success(c, resource);
}, 'Failed to fetch help resource');

export const getInternalResourceById = asyncHandler(async (c: Context) => {
  const id = parseIntParam(c, 'id');
  const resource = await helpResourceService.getResourceById(id, 'internal');
  if (!resource) {
    return error(c, 'Resource not found', 404);
  }
  return success(c, resource);
}, 'Failed to fetch help resource');
