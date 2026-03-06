import { Hono } from 'hono';
import * as fnDocRequirementController from '../controllers/fnDocRequirementController';

export const fnDocRequirementRoutes = new Hono();

// GET /admin/file-numbers/:id/document-requirements
fnDocRequirementRoutes.get('/file-numbers/:id/document-requirements', fnDocRequirementController.getRequirements);

// PUT /admin/file-numbers/:id/document-requirements
fnDocRequirementRoutes.put('/file-numbers/:id/document-requirements', fnDocRequirementController.bulkSaveRequirements);

// POST /admin/file-numbers/:id/document-requirements/add
fnDocRequirementRoutes.post('/file-numbers/:id/document-requirements/add', fnDocRequirementController.addRequirement);

// GET /admin/file-numbers/:id/documents
fnDocRequirementRoutes.get('/file-numbers/:id/documents', fnDocRequirementController.getDocumentsBySR);
