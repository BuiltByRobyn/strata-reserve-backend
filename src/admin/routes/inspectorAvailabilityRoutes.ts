// Inspector Availability Routes - Admin API endpoints for inspector availability management
import { Hono } from 'hono';
import * as inspectorAvailabilityController from '../controllers/inspectorAvailabilityController';

export const inspectorAvailabilityRoutes = new Hono();

inspectorAvailabilityRoutes.get('/inspector-availability', inspectorAvailabilityController.getAvailableDates);

inspectorAvailabilityRoutes.get('/inspector-availability/range', inspectorAvailabilityController.getAvailableDatesByRange);

inspectorAvailabilityRoutes.get('/inspector-availability/:id', inspectorAvailabilityController.getAvailableDateById);

inspectorAvailabilityRoutes.post('/inspector-availability', inspectorAvailabilityController.createAvailableDate);

inspectorAvailabilityRoutes.put('/inspector-availability/:id', inspectorAvailabilityController.updateAvailableDate);

inspectorAvailabilityRoutes.delete('/inspector-availability/:id', inspectorAvailabilityController.deleteAvailableDate);
