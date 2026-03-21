import { Hono } from 'hono';
import * as fnDocRequirementController from '../controllers/fnDocRequirementController';

export const fnDocRequirementRoutes = new Hono();

fnDocRequirementRoutes.get('/file-numbers/:id/document-requirements', fnDocRequirementController.getRequirements);
fnDocRequirementRoutes.put('/file-numbers/:id/document-requirements', fnDocRequirementController.bulkSaveRequirements);
fnDocRequirementRoutes.post('/file-numbers/:id/document-requirements/version', fnDocRequirementController.addRequirementVersion);
fnDocRequirementRoutes.delete('/file-numbers/:id/document-requirements/:reqId', fnDocRequirementController.removeRequirementVersion);
fnDocRequirementRoutes.get('/file-numbers/:id/documents', fnDocRequirementController.getDocumentsBySR);
