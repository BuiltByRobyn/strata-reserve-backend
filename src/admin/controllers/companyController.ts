// Company Controller - Handles requests for company management
import { Context } from 'hono';
import * as companyService from '../../services/companyService';

// ============================================
// Get All Companies
// ============================================
export const getCompanies = async (c: Context) => {
  try {
    const companies = await companyService.getCompanies();
    return c.json({ success: true, data: companies });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return c.json({ success: false, error: 'Failed to fetch companies' }, 500);
  }
};

// ============================================
// Get Company by ID
// ============================================
export const getCompanyById = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid company ID' }, 400);
    }

    const company = await companyService.getCompanyById(id);
    if (!company) {
      return c.json({ success: false, error: 'Company not found' }, 404);
    }

    return c.json({ success: true, data: company });
  } catch (error) {
    console.error('Error fetching company:', error);
    return c.json({ success: false, error: 'Failed to fetch company' }, 500);
  }
};

// ============================================
// Create Company
// ============================================
export const createCompany = async (c: Context) => {
  try {
    const body = await c.req.json();
    
    if (!body.companyName || body.companyName.trim() === '') {
      return c.json({ success: false, error: 'Company name is required' }, 400);
    }

    const company = await companyService.createCompany({
      companyName: body.companyName.trim(),
      companyTelephone: body.companyTelephone?.trim() || undefined
    });

    return c.json({ success: true, data: company }, 201);
  } catch (error) {
    console.error('Error creating company:', error);
    return c.json({ success: false, error: 'Failed to create company' }, 500);
  }
};

// ============================================
// Update Company
// ============================================
export const updateCompany = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid company ID' }, 400);
    }

    const body = await c.req.json();
    const company = await companyService.updateCompany(id, {
      companyName: body.companyName?.trim(),
      companyTelephone: body.companyTelephone !== undefined 
        ? (body.companyTelephone?.trim() || null) 
        : undefined
    });

    return c.json({ success: true, data: company });
  } catch (error) {
    console.error('Error updating company:', error);
    return c.json({ success: false, error: 'Failed to update company' }, 500);
  }
};

// ============================================
// Delete Company
// ============================================
export const deleteCompany = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid company ID' }, 400);
    }

    await companyService.deleteCompany(id);
    return c.json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Error deleting company:', error);
    return c.json({ success: false, error: 'Failed to delete company' }, 500);
  }
};

// ============================================
// Search Companies
// ============================================
export const searchCompanies = async (c: Context) => {
  try {
    const query = c.req.query('q') || '';
    const companies = await companyService.searchCompanies(query);
    return c.json({ success: true, data: companies });
  } catch (error) {
    console.error('Error searching companies:', error);
    return c.json({ success: false, error: 'Failed to search companies' }, 500);
  }
};
