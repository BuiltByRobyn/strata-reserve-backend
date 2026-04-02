// Company Holiday Routes - Admin API endpoints for company holiday management
import { Hono } from 'hono';
import * as companyHolidayController from '../controllers/companyHolidayController';

export const companyHolidayRoutes = new Hono();


companyHolidayRoutes.get('/company-holidays', companyHolidayController.getCompanyHolidays);

companyHolidayRoutes.get('/company-holidays/by-year', companyHolidayController.getHolidaysByYear);

companyHolidayRoutes.get('/company-holidays/check', companyHolidayController.checkIsHoliday);

companyHolidayRoutes.get('/company-holidays/:id', companyHolidayController.getCompanyHolidayById);

companyHolidayRoutes.post('/company-holidays', companyHolidayController.createCompanyHoliday);

companyHolidayRoutes.put('/company-holidays/:id', companyHolidayController.updateCompanyHoliday);

companyHolidayRoutes.delete('/company-holidays/:id', companyHolidayController.deleteCompanyHoliday);
