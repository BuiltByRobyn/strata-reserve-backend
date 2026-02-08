import * as strataService from '../../shared/services/strataService';
import { success, created, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getStratas = asyncHandler(async (c) => {
  const stratas = await strataService.getStratas();
  return success(c, stratas);
}, 'Failed to fetch stratas');

export const getStrataById = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const strata = await strataService.getStrataById(id);
  if (!strata) {
    return error(c, 'Strata not found', 404);
  }
  return success(c, strata);
}, 'Failed to fetch strata');

export const createStrata = asyncHandler(async (c) => {
  const body = await c.req.json();
  const strata = await strataService.createStrata({
    strataPlan: body.strataPlan?.trim(),
    complexName: body.complexName?.trim(),
    unitNumber: body.unitNumber?.trim(),
    streetName: body.streetName?.trim(),
    town: body.town?.trim(),
    province: body.province?.trim(),
    postalCode: body.postalCode?.trim(),
    country: body.country?.trim() || 'Canada',
    website: body.website?.trim(),
    legalTypeId: body.legalTypeId ? parseInt(body.legalTypeId) : undefined,
    propertyTypeId: body.propertyTypeId ? parseInt(body.propertyTypeId) : undefined,
    companyId: body.companyId ? parseInt(body.companyId) : undefined
  });
  return created(c, strata);
}, 'Failed to create strata');

export const updateStrata = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();
  const strata = await strataService.updateStrata(id, {
    strataPlan: body.strataPlan?.trim(),
    complexName: body.complexName?.trim(),
    unitNumber: body.unitNumber?.trim(),
    streetName: body.streetName?.trim(),
    town: body.town?.trim(),
    province: body.province?.trim(),
    postalCode: body.postalCode?.trim(),
    country: body.country?.trim(),
    website: body.website?.trim(),
    legalTypeId: body.legalTypeId !== undefined ? parseInt(body.legalTypeId) : undefined,
    propertyTypeId: body.propertyTypeId !== undefined ? parseInt(body.propertyTypeId) : undefined,
    companyId: body.companyId !== undefined ? parseInt(body.companyId) : undefined
  });
  return success(c, strata);
}, 'Failed to update strata');

export const deleteStrata = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  await strataService.deleteStrata(id);
  return success(c, { message: 'Strata deleted successfully' });
}, 'Failed to delete strata');

export const searchStratas = asyncHandler(async (c) => {
  const query = c.req.query('q') || '';
  const stratas = await strataService.searchStratas(query);
  return success(c, stratas);
}, 'Failed to search stratas');

export const addStrataNote = asyncHandler(async (c) => {
  const strataId = parseIntParam(c, 'id');
  const body = await c.req.json();
  if (!body.noteMessage || body.noteMessage.trim() === '') {
    return error(c, 'Note message is required', 400);
  }
  const note = await strataService.addStrataNote({
    strataId,
    noteMessage: body.noteMessage.trim(),
    createdByProfileId: body.createdByProfileId,
    createdByUser: body.createdByUser?.trim()
  });
  return created(c, note);
}, 'Failed to add strata note');

export const deleteStrataNote = asyncHandler(async (c) => {
  const noteId = parseIntParam(c, 'noteId');
  await strataService.deleteStrataNote(noteId);
  return success(c, { message: 'Note deleted successfully' });
}, 'Failed to delete strata note');

export const assignEmployee = asyncHandler(async (c) => {
  const strataId = parseIntParam(c, 'id');
  const body = await c.req.json();
  if (!body.profileId) {
    return error(c, 'Profile ID is required', 400);
  }
  const assignment = await strataService.assignEmployeeToStrata({
    strataId,
    profileId: body.profileId,
    strataPosition: body.strataPosition?.trim()
  });
  return created(c, assignment);
}, 'Failed to assign employee');

export const updateEmployeePosition = asyncHandler(async (c) => {
  const strataProfileId = parseIntParam(c, 'employeeId');
  const body = await c.req.json();
  const assignment = await strataService.updateStrataProfilePosition(
    strataProfileId,
    body.strataPosition?.trim() || ''
  );
  return success(c, assignment);
}, 'Failed to update employee position');

export const removeEmployee = asyncHandler(async (c) => {
  const strataProfileId = parseIntParam(c, 'employeeId');
  await strataService.removeProfileFromStrata(strataProfileId);
  return success(c, { message: 'Employee removed successfully' });
}, 'Failed to remove employee');

export const addService = asyncHandler(async (c) => {
  const strataId = parseIntParam(c, 'id');
  const body = await c.req.json();
  if (!body.serviceId) {
    return error(c, 'Service ID is required', 400);
  }
  const result = await strataService.addServiceToStrata({
    strataId,
    serviceId: parseInt(body.serviceId)
  });
  return created(c, result);
}, 'Failed to add service');

export const removeService = asyncHandler(async (c) => {
  const strataServiceId = parseIntParam(c, 'serviceId');
  await strataService.removeServiceFromStrata(strataServiceId);
  return success(c, { message: 'Service removed successfully' });
}, 'Failed to remove service');
