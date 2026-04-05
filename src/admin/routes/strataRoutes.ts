// Strata Routes - Admin API endpoints for strata property management
import { Hono } from 'hono';
import * as strataController from '../controllers/strataController';

export const strataRoutes = new Hono();

strataRoutes.get('/strata', strataController.getStratas);

strataRoutes.get('/strata/search', strataController.searchStratas);

strataRoutes.get('/strata/:id', strataController.getStrataById);

strataRoutes.post('/strata', strataController.createStrata);

strataRoutes.put('/strata/:id', strataController.updateStrata);

strataRoutes.delete('/strata/:id', strataController.deleteStrata);

strataRoutes.post('/strata/:id/notes', strataController.addStrataNote);

strataRoutes.delete('/strata/:id/notes/:noteId', strataController.deleteStrataNote);

strataRoutes.get('/strata/:id/sections', strataController.getStrataSections);

strataRoutes.post('/strata/:id/employees', strataController.assignEmployee);

strataRoutes.put('/strata/:id/employees/:employeeId', strataController.updateEmployeePosition);

strataRoutes.delete('/strata/:id/employees/:employeeId', strataController.removeEmployee);


strataRoutes.get('/strata/:id/timelines', strataController.getStrataTimelines);
