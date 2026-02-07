// Company Routes - Admin API endpoints for company management
import { Hono } from 'hono';
import * as companyController from '../controllers/companyController';

export const companyRoutes = new Hono();

// GET /admin/companies - Get all companies
companyRoutes.get('/companies', companyController.getCompanies);

// GET /admin/companies/search - Search companies
companyRoutes.get('/companies/search', companyController.searchCompanies);

// GET /admin/companies/:id - Get company by ID
companyRoutes.get('/companies/:id', companyController.getCompanyById);

// POST /admin/companies - Create new company
companyRoutes.post('/companies', companyController.createCompany);

// PUT /admin/companies/:id - Update company
companyRoutes.put('/companies/:id', companyController.updateCompany);

// DELETE /admin/companies/:id - Delete company
companyRoutes.delete('/companies/:id', companyController.deleteCompany);
