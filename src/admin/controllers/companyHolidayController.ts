// Company Holiday Controller - Handles requests for company holiday management
import { Context } from 'hono';
import * as companyHolidayService from '../../services/companyHolidayService';

// ============================================
// Get All Company Holidays
// ============================================
export const getCompanyHolidays = async (c: Context) => {
  try {
    const holidays = await companyHolidayService.getCompanyHolidays();
    return c.json({ success: true, data: holidays });
  } catch (error) {
    console.error('Error fetching company holidays:', error);
    return c.json({ success: false, error: 'Failed to fetch company holidays' }, 500);
  }
};

// ============================================
// Get Company Holiday by ID
// ============================================
export const getCompanyHolidayById = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid ID' }, 400);
    }

    const holiday = await companyHolidayService.getCompanyHolidayById(id);
    if (!holiday) {
      return c.json({ success: false, error: 'Company holiday not found' }, 404);
    }

    return c.json({ success: true, data: holiday });
  } catch (error) {
    console.error('Error fetching company holiday:', error);
    return c.json({ success: false, error: 'Failed to fetch company holiday' }, 500);
  }
};

// ============================================
// Create Company Holiday
// ============================================
export const createCompanyHoliday = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { holidayDate, holidayName, isRecurringAnnually } = body;

    if (!holidayDate || !holidayName) {
      return c.json({ 
        success: false, 
        error: 'Holiday date and holiday name are required' 
      }, 400);
    }

    const newHoliday = await companyHolidayService.createCompanyHoliday({
      holidayDate: new Date(holidayDate),
      holidayName,
      isRecurringAnnually
    });

    return c.json({ success: true, data: newHoliday }, 201);
  } catch (error) {
    console.error('Error creating company holiday:', error);
    return c.json({ success: false, error: 'Failed to create company holiday' }, 500);
  }
};

// ============================================
// Update Company Holiday
// ============================================
export const updateCompanyHoliday = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid ID' }, 400);
    }

    const body = await c.req.json();
    const { holidayDate, holidayName, isRecurringAnnually } = body;

    const updateData: {
      holidayDate?: Date;
      holidayName?: string;
      isRecurringAnnually?: boolean;
    } = {};

    if (holidayDate) {
      updateData.holidayDate = new Date(holidayDate);
    }
    if (holidayName !== undefined) {
      updateData.holidayName = holidayName;
    }
    if (isRecurringAnnually !== undefined) {
      updateData.isRecurringAnnually = isRecurringAnnually;
    }

    const updatedHoliday = await companyHolidayService.updateCompanyHoliday(id, updateData);
    return c.json({ success: true, data: updatedHoliday });
  } catch (error) {
    console.error('Error updating company holiday:', error);
    return c.json({ success: false, error: 'Failed to update company holiday' }, 500);
  }
};

// ============================================
// Delete Company Holiday
// ============================================
export const deleteCompanyHoliday = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid ID' }, 400);
    }

    await companyHolidayService.deleteCompanyHoliday(id);
    return c.json({ success: true, message: 'Company holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting company holiday:', error);
    return c.json({ success: false, error: 'Failed to delete company holiday' }, 500);
  }
};

// ============================================
// Get Holidays by Year
// ============================================
export const getHolidaysByYear = async (c: Context) => {
  try {
    const year = parseInt(c.req.query('year') || new Date().getFullYear().toString());
    if (isNaN(year)) {
      return c.json({ success: false, error: 'Invalid year' }, 400);
    }

    const holidays = await companyHolidayService.getHolidaysByYear(year);
    return c.json({ success: true, data: holidays });
  } catch (error) {
    console.error('Error fetching holidays by year:', error);
    return c.json({ success: false, error: 'Failed to fetch holidays' }, 500);
  }
};

// ============================================
// Check if Date is a Holiday
// ============================================
export const checkIsHoliday = async (c: Context) => {
  try {
    const date = c.req.query('date');
    if (!date) {
      return c.json({ success: false, error: 'Date is required' }, 400);
    }

    const isHoliday = await companyHolidayService.isHoliday(new Date(date));
    return c.json({ success: true, data: { isHoliday } });
  } catch (error) {
    console.error('Error checking if date is holiday:', error);
    return c.json({ success: false, error: 'Failed to check holiday' }, 500);
  }
};
