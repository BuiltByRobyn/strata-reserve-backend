// Lookup Routes - API endpoints for lookup/reference data
import { Hono } from 'hono';
import * as lookupController from '../controllers/lookupController';

export const lookupRoutes = new Hono();

// User Types
lookupRoutes.get('/user-types', lookupController.getUserTypes);

// Legal Types
lookupRoutes.get('/legal-types', lookupController.getLegalTypes);

// Property Types
lookupRoutes.get('/property-types', lookupController.getPropertyTypes);

// Services
lookupRoutes.get('/services', lookupController.getServices);

lookupRoutes.get('/document-types', lookupController.getDocumentTypes);
lookupRoutes.get('/review-statuses', lookupController.getReviewStatuses);
