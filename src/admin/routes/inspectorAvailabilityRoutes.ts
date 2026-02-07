// Inspector Availability Routes - Admin API endpoints for inspector availability management
import { Hono } from 'hono';
import * as inspectorAvailabilityController from '../controllers/inspectorAvailabilityController';

export const inspectorAvailabilityRoutes = new Hono();

// ============================================
// Inspector Availability CRUD
// ============================================

// GET /admin/inspector-availability - Get all available dates (optional filter by inspectorProfileId)
inspectorAvailabilityRoutes.get('/inspector-availability', inspectorAvailabilityController.getAvailableDates);

// GET /admin/inspector-availability/range - Get available dates by date range
inspectorAvailabilityRoutes.get('/inspector-availability/range', inspectorAvailabilityController.getAvailableDatesByRange);

// GET /admin/inspector-availability/:id - Get available date by ID
inspectorAvailabilityRoutes.get('/inspector-availability/:id', inspectorAvailabilityController.getAvailableDateById);

// POST /admin/inspector-availability - Create new available date
inspectorAvailabilityRoutes.post('/inspector-availability', inspectorAvailabilityController.createAvailableDate);

// PUT /admin/inspector-availability/:id - Update available date
inspectorAvailabilityRoutes.put('/inspector-availability/:id', inspectorAvailabilityController.updateAvailableDate);

// DELETE /admin/inspector-availability/:id - Delete available date
inspectorAvailabilityRoutes.delete('/inspector-availability/:id', inspectorAvailabilityController.deleteAvailableDate);
