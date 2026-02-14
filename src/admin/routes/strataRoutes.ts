// Strata Routes - Admin API endpoints for strata property management
import { Hono } from 'hono';
import * as strataController from '../controllers/strataController';

export const strataRoutes = new Hono();

// ============================================
// Strata CRUD
// ============================================

// GET /admin/strata - Get all stratas
strataRoutes.get('/strata', strataController.getStratas);

// GET /admin/strata/search - Search stratas
strataRoutes.get('/strata/search', strataController.searchStratas);

// GET /admin/strata/:id - Get strata by ID
strataRoutes.get('/strata/:id', strataController.getStrataById);

// POST /admin/strata - Create new strata
strataRoutes.post('/strata', strataController.createStrata);

// PUT /admin/strata/:id - Update strata
strataRoutes.put('/strata/:id', strataController.updateStrata);

// DELETE /admin/strata/:id - Delete strata
strataRoutes.delete('/strata/:id', strataController.deleteStrata);

// ============================================
// Strata Notes
// ============================================

// POST /admin/strata/:id/notes - Add note to strata
strataRoutes.post('/strata/:id/notes', strataController.addStrataNote);

// DELETE /admin/strata/:id/notes/:noteId - Delete note
strataRoutes.delete('/strata/:id/notes/:noteId', strataController.deleteStrataNote);

// ============================================
// Strata Employees
// ============================================

// GET /admin/strata/:id/sections - Get strata sections
strataRoutes.get('/strata/:id/sections', strataController.getStrataSections);

// POST /admin/strata/:id/employees - Assign employee to strata
strataRoutes.post('/strata/:id/employees', strataController.assignEmployee);

// PUT /admin/strata/:id/employees/:employeeId - Update employee position
strataRoutes.put('/strata/:id/employees/:employeeId', strataController.updateEmployeePosition);

// DELETE /admin/strata/:id/employees/:employeeId - Remove employee from strata
strataRoutes.delete('/strata/:id/employees/:employeeId', strataController.removeEmployee);

// ============================================
// Strata Services
// ============================================

// POST /admin/strata/:id/services - Add service to strata
strataRoutes.post('/strata/:id/services', strataController.addService);

// DELETE /admin/strata/:id/services/:serviceId - Remove service from strata
strataRoutes.delete('/strata/:id/services/:serviceId', strataController.removeService);
