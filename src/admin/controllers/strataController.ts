import * as strataService from '../../shared/services/strataService';
import * as timelinesService from '../../shared/services/timelinesService';
import { success, created, error, asyncHandler, getByIdHandler, deleteHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import { STRATA_ID_PATTERN } from '../../shared/constants/validation';


export const getStratas = asyncHandler(async (c) => {
  const stratas = await strataService.getStratas();
  return success(c, stratas);
}, 'Failed to fetch stratas');

export const getStrataById = getByIdHandler(strataService.getStrataById, 'Strata');

export const createStrata = asyncHandler(async (c) => {
  const body = await c.req.json();
  if (body.strataPlan && !STRATA_ID_PATTERN.test(body.strataPlan.trim())) {
    return error(c, 'Strata Plan must be in format: ABC 12345 (3 letters, space, 5 digits)', 400);
  }
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
    companyName: body.companyName?.trim(),
    locationId: body.locationId !== undefined ? (body.locationId ? parseInt(body.locationId) : null) : undefined,
    fiscalYearEnd: body.fiscalYearEnd || undefined,
    sectionIds: Array.isArray(body.sectionIds) ? body.sectionIds.map(Number) : undefined,
    propertyTypeIds: Array.isArray(body.propertyTypeIds) ? body.propertyTypeIds.map(Number) : undefined
  });

  return created(c, strata);
}, 'Failed to create strata');

export const updateStrata = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();
  if (body.strataPlan && !STRATA_ID_PATTERN.test(body.strataPlan.trim())) {
    return error(c, 'Strata Plan must be in format: ABC 12345 (3 letters, space, 5 digits)', 400);
  }
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
    companyName: body.companyName !== undefined ? body.companyName?.trim() : undefined,
    locationId: body.locationId !== undefined ? (body.locationId ? parseInt(body.locationId) : null) : undefined,
    fiscalYearEnd: body.fiscalYearEnd !== undefined ? body.fiscalYearEnd : undefined,
    sectionIds: Array.isArray(body.sectionIds) ? body.sectionIds.map(Number) : undefined,
    propertyTypeIds: Array.isArray(body.propertyTypeIds) ? body.propertyTypeIds.map(Number) : undefined
  });
  return success(c, strata);
}, 'Failed to update strata');

export const deleteStrata = deleteHandler(strataService.deleteStrata, 'Strata');

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

export const getStrataSections = asyncHandler(async (c) => {
  const strataId = parseIntParam(c, 'id');
  const sections = await strataService.getSectionsByStrataId(strataId);
  return success(c, sections);
}, 'Failed to fetch strata sections');

export const assignEmployee = asyncHandler(async (c) => {
  const strataId = parseIntParam(c, 'id');
  const body = await c.req.json();
  if (!body.profileId) {
    return error(c, 'Profile ID is required', 400);
  }
  const assignment = await strataService.assignEmployeeToStrata({
    strataId,
    profileId: body.profileId,
    strataPosition: body.strataPosition?.trim(),
    sectionIds: Array.isArray(body.sectionIds) ? body.sectionIds.map(Number) : undefined
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



export const getStrataTimelines = asyncHandler(async (c) => {
  const strataId = parseIntParam(c, 'id');
  const timelines = await timelinesService.getLatestTimelinesByStrata(strataId);
  return success(c, timelines);
}, 'Failed to fetch strata timelines');

export const updateFileNumberTimelines = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'fileId');
  const body = await c.req.json();
  const updated = await timelinesService.updateTimelines(fileId, {
    fiscalYearEnd: body.fiscalYearEnd,
    lastAgmDate: body.lastAgmDate,
    noAgmToDate: body.noAgmToDate,
    lastDepreciationReportDate: body.lastDepreciationReportDate,
    noReportToDate: body.noReportToDate,
    targetDate: body.targetDate,
  });
  return success(c, updated);
}, 'Failed to update timelines');
