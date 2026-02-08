import * as inspectorAvailabilityService from '../../shared/services/inspectorAvailabilityService';
import { success, created, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getAvailableDates = asyncHandler(async (c) => {
  const inspectorProfileId = c.req.query('inspectorProfileId');
  const availableDates = await inspectorAvailabilityService.getAvailableDates(inspectorProfileId);
  return success(c, availableDates);
}, 'Failed to fetch available dates');

export const getAvailableDateById = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const availableDate = await inspectorAvailabilityService.getAvailableDateById(id);
  if (!availableDate) {
    return error(c, 'Available date not found', 404);
  }
  return success(c, availableDate);
}, 'Failed to fetch available date');

export const createAvailableDate = asyncHandler(async (c) => {
  const body = await c.req.json();
  const { availableDate, availableStartTime, availableEndTime, inspectorProfileId } = body;

  if (!availableDate || !inspectorProfileId) {
    return error(c, 'Available date and inspector profile ID are required', 400);
  }

  const newAvailableDate = await inspectorAvailabilityService.createAvailableDate({
    availableDate: new Date(availableDate),
    availableStartTime: availableStartTime ? new Date(`1970-01-01T${availableStartTime}`) : null,
    availableEndTime: availableEndTime ? new Date(`1970-01-01T${availableEndTime}`) : null,
    inspectorProfileId
  });
  return created(c, newAvailableDate);
}, 'Failed to create available date');

export const updateAvailableDate = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();
  const { availableDate, availableStartTime, availableEndTime } = body;

  const updateData: {
    availableDate?: Date;
    availableStartTime?: Date | null;
    availableEndTime?: Date | null;
  } = {};

  if (availableDate) {
    updateData.availableDate = new Date(availableDate);
  }
  if (availableStartTime !== undefined) {
    updateData.availableStartTime = availableStartTime
      ? new Date(`1970-01-01T${availableStartTime}`)
      : null;
  }
  if (availableEndTime !== undefined) {
    updateData.availableEndTime = availableEndTime
      ? new Date(`1970-01-01T${availableEndTime}`)
      : null;
  }

  const updatedAvailableDate = await inspectorAvailabilityService.updateAvailableDate(id, updateData);
  return success(c, updatedAvailableDate);
}, 'Failed to update available date');

export const deleteAvailableDate = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  await inspectorAvailabilityService.deleteAvailableDate(id);
  return success(c, { message: 'Available date deleted successfully' });
}, 'Failed to delete available date');

export const getAvailableDatesByRange = asyncHandler(async (c) => {
  const startDate = c.req.query('startDate');
  const endDate = c.req.query('endDate');
  const inspectorProfileId = c.req.query('inspectorProfileId');

  if (!startDate || !endDate) {
    return error(c, 'Start date and end date are required', 400);
  }

  const availableDates = await inspectorAvailabilityService.getAvailableDatesByRange(
    new Date(startDate),
    new Date(endDate),
    inspectorProfileId
  );
  return success(c, availableDates);
}, 'Failed to fetch available dates');
