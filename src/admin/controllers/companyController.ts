import * as companyService from '../../shared/services/companyService';
import { success, created, error, asyncHandler, getByIdHandler, deleteHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getCompanies = asyncHandler(async (c) => {
  const companies = await companyService.getCompanies();
  return success(c, companies);
}, 'Failed to fetch companies');

export const getCompanyById = getByIdHandler(companyService.getCompanyById, 'Company');

export const createCompany = asyncHandler(async (c) => {
  const body = await c.req.json();
  if (!body.companyName || body.companyName.trim() === '') {
    return error(c, 'Company name is required', 400);
  }
  const company = await companyService.createCompany({
    companyName: body.companyName.trim(),
    companyTelephone: body.companyTelephone?.trim() || undefined
  });
  return created(c, company);
}, 'Failed to create company');

export const updateCompany = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();
  const company = await companyService.updateCompany(id, {
    companyName: body.companyName?.trim(),
    companyTelephone: body.companyTelephone !== undefined
      ? (body.companyTelephone?.trim() || null)
      : undefined
  });
  return success(c, company);
}, 'Failed to update company');

export const deleteCompany = deleteHandler(companyService.deleteCompany, 'Company');

export const searchCompanies = asyncHandler(async (c) => {
  const query = c.req.query('q') || '';
  const companies = await companyService.searchCompanies(query);
  return success(c, companies);
}, 'Failed to search companies');
