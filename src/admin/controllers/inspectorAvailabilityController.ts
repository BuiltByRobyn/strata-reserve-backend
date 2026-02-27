import * as inspectorAvailabilityService from '../../shared/services/inspectorAvailabilityService';
import { success, created, error, asyncHandler, getByIdHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import { VALID_LOCATION_CODES } from '../../shared/constants/validation';

const validateLocationCodes = (locationCodes: string[] | undefined): string | null => {
  if (!locationCodes?.length) return null;
  const invalid = locationCodes.filter((code: string) => !(VALID_LOCATION_CODES as readonly string[]).includes(code));
  if (invalid.length > 0) {
    return `Invalid location codes: ${invalid.join(', ')}. Valid: ${VALID_LOCATION_CODES.join(', ')}`;
  }
  return null;
};

export const getAvailableDates = asyncHandler(async (c) => {
  const inspectorProfileId = c.req.query('inspectorProfileId');
  const availableDates = await inspectorAvailabilityService.getAvailableDates(inspectorProfileId);
  return success(c, availableDates);
}, 'Failed to fetch available dates');

export const getAvailableDateById = getByIdHandler(inspectorAvailabilityService.getAvailableDateById, 'Available date');

export const createAvailableDate = asyncHandler(async (c) => {
  const body = await c.req.json();
  const { availableStartDate, availableEndDate, availableStartTime, availableEndTime, inspectorProfileId, locationCodes } = body;

  if (!availableStartDate || !availableEndDate || !inspectorProfileId) {
    return error(c, 'Start date, end date, and inspector profile ID are required', 400);
  }

  const locationError = validateLocationCodes(locationCodes);
  if (locationError) {
    return error(c, locationError, 400);
  }

  const newAvailableDate = await inspectorAvailabilityService.createAvailableDate({
    availableStartDate: new Date(availableStartDate),
    availableEndDate: new Date(availableEndDate),
    availableStartTime: availableStartTime ? new Date(`1970-01-01T${availableStartTime}Z`) : null,
    availableEndTime: availableEndTime ? new Date(`1970-01-01T${availableEndTime}Z`) : null,
    inspectorProfileId,
    locationCodes: locationCodes || [],
  });
  return created(c, newAvailableDate);
}, 'Failed to create available date');

export const updateAvailableDate = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();
  const { availableStartDate, availableEndDate, availableStartTime, availableEndTime, locationCodes } = body;

  const locationError = validateLocationCodes(locationCodes);
  if (locationError) {
    return error(c, locationError, 400);
  }

  const updateData: {
    availableStartDate?: Date;
    availableEndDate?: Date;
    availableStartTime?: Date | null;
    availableEndTime?: Date | null;
    locationCodes?: string[];
  } = {};

  if (availableStartDate) updateData.availableStartDate = new Date(availableStartDate);
  if (availableEndDate) updateData.availableEndDate = new Date(availableEndDate);
  if (availableStartTime !== undefined) {
    updateData.availableStartTime = availableStartTime ? new Date(`1970-01-01T${availableStartTime}Z`) : null;
  }
  if (availableEndTime !== undefined) {
    updateData.availableEndTime = availableEndTime ? new Date(`1970-01-01T${availableEndTime}Z`) : null;
  }
  if (locationCodes !== undefined) updateData.locationCodes = locationCodes;

  try {
    const updatedAvailableDate = await inspectorAvailabilityService.updateAvailableDate(id, updateData);
    return success(c, updatedAvailableDate);
  } catch (err: any) {
    if (err.message === 'Cannot change availability. Existing appointments found on these dates. Please reschedule them first.') {
      return error(c, err.message, 400);
    }
    throw err;
  }
}, 'Failed to update available date');

export const deleteAvailableDate = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  try {
    await inspectorAvailabilityService.deleteAvailableDate(id);
    return success(c, { message: 'Available date deleted successfully' });
  } catch (err: any) {
    if (err.message === 'Cannot change availability. Existing appointments found on these dates. Please reschedule them first.') {
      return error(c, err.message, 400);
    }
    throw err;
  }
}, 'Failed to delete available date');

export const getAvailableDatesByRange = asyncHandler(async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const inspectorProfileId = c.req.query('inspectorProfileId');
  const locationCodesParam = c.req.query('locationCodes');

  if (!startDate || !endDate) {
    return error(c, 'Start date and end date are required', 400);
  }

  const locationCodes = locationCodesParam ? locationCodesParam.split(',') : undefined;

  const availableDates = await inspectorAvailabilityService.getAvailableDatesByRange(
    new Date(startDate),
    new Date(endDate),
    inspectorProfileId,
    locationCodes
  );
  return success(c, availableDates);
}, 'Failed to fetch available dates');
