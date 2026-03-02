import * as companyHolidayService from '../../shared/services/companyHolidayService';
import { success, created, error, asyncHandler, getByIdHandler, deleteHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';
import { toUTCDate } from '../../shared/helpers/dateUtils';

export const getCompanyHolidays = asyncHandler(async (c) => {
  const holidays = await companyHolidayService.getCompanyHolidays();
  return success(c, holidays);
}, 'Failed to fetch company holidays');

export const getCompanyHolidayById = getByIdHandler(companyHolidayService.getCompanyHolidayById, 'Company holiday');

export const createCompanyHoliday = asyncHandler(async (c) => {
  const body = await c.req.json();
  const { holidayDate, holidayName, isRecurringAnnually } = body;

  if (!holidayDate || !holidayName) {
    return error(c, 'Holiday date and holiday name are required', 400);
  }

  const newHoliday = await companyHolidayService.createCompanyHoliday({
    holidayDate: toUTCDate(holidayDate)!,
    holidayName,
    isRecurringAnnually
  });
  return created(c, newHoliday);
}, 'Failed to create company holiday');

export const updateCompanyHoliday = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();
  const { holidayDate, holidayName, isRecurringAnnually } = body;

  const updateData: {
    holidayDate?: Date;
    holidayName?: string;
    isRecurringAnnually?: boolean;
  } = {};

  if (holidayDate) {
    updateData.holidayDate = toUTCDate(holidayDate)!;
  }
  if (holidayName !== undefined) {
    updateData.holidayName = holidayName;
  }
  if (isRecurringAnnually !== undefined) {
    updateData.isRecurringAnnually = isRecurringAnnually;
  }

  const updatedHoliday = await companyHolidayService.updateCompanyHoliday(id, updateData);
  return success(c, updatedHoliday);
}, 'Failed to update company holiday');

export const deleteCompanyHoliday = deleteHandler(companyHolidayService.deleteCompanyHoliday, 'Company holiday');

export const getHolidaysByYear = asyncHandler(async (c) => {
  const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());
  if (isNaN(year)) {
    return error(c, 'Invalid year', 400);
  }
  const holidays = await companyHolidayService.getHolidaysByYear(year);
  return success(c, holidays);
}, 'Failed to fetch holidays');

export const checkIsHoliday = asyncHandler(async (c) => {
  const date = c.req.query('date');
  if (!date) {
    return error(c, 'Date is required', 400);
  }
  const isHoliday = await companyHolidayService.isHoliday(toUTCDate(date)!);
  return success(c, { isHoliday });
}, 'Failed to check holiday');
