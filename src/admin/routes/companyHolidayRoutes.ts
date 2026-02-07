// Company Holiday Routes - Admin API endpoints for company holiday management
import { Hono } from 'hono';
import * as companyHolidayController from '../controllers/companyHolidayController';

export const companyHolidayRoutes = new Hono();

// ============================================
// Company Holiday CRUD
// ============================================

// GET /admin/company-holidays - Get all company holidays
companyHolidayRoutes.get('/company-holidays', companyHolidayController.getCompanyHolidays);

// GET /admin/company-holidays/by-year - Get holidays by year (includes recurring)
companyHolidayRoutes.get('/company-holidays/by-year', companyHolidayController.getHolidaysByYear);

// GET /admin/company-holidays/check - Check if a date is a holiday
companyHolidayRoutes.get('/company-holidays/check', companyHolidayController.checkIsHoliday);

// GET /admin/company-holidays/:id - Get company holiday by ID
companyHolidayRoutes.get('/company-holidays/:id', companyHolidayController.getCompanyHolidayById);

// POST /admin/company-holidays - Create new company holiday
companyHolidayRoutes.post('/company-holidays', companyHolidayController.createCompanyHoliday);

// PUT /admin/company-holidays/:id - Update company holiday
companyHolidayRoutes.put('/company-holidays/:id', companyHolidayController.updateCompanyHoliday);

// DELETE /admin/company-holidays/:id - Delete company holiday
companyHolidayRoutes.delete('/company-holidays/:id', companyHolidayController.deleteCompanyHoliday);
