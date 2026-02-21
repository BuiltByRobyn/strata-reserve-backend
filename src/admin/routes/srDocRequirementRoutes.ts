import { Hono } from 'hono';
import * as srDocRequirementController from '../controllers/srDocRequirementController';

export const srDocRequirementRoutes = new Hono();

// GET /admin/service-requests/:id/document-requirements
srDocRequirementRoutes.get('/service-requests/:id/document-requirements', srDocRequirementController.getRequirements);

// PUT /admin/service-requests/:id/document-requirements
srDocRequirementRoutes.put('/service-requests/:id/document-requirements', srDocRequirementController.bulkSaveRequirements);

// GET /admin/service-requests/:id/documents
srDocRequirementRoutes.get('/service-requests/:id/documents', srDocRequirementController.getDocumentsBySR);
