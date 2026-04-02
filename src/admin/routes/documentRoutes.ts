import { Hono } from 'hono';
import * as documentController from '../controllers/documentController';

export const documentRoutes = new Hono();

documentRoutes.get('/documents', documentController.getDocuments);

documentRoutes.get('/documents/search', documentController.searchDocuments);

documentRoutes.get('/documents/:id', documentController.getDocumentById);

documentRoutes.put('/documents/:id/status', documentController.updateDocumentStatus);

documentRoutes.delete('/documents/:id/notes', documentController.clearDocumentNotes);

documentRoutes.delete('/documents/:id', documentController.deleteDocument);
