// Document Routes - Admin API endpoints for document management
import { Hono } from 'hono';
import * as documentController from '../controllers/documentController';

export const documentRoutes = new Hono();

// GET /admin/documents - Get all documents
documentRoutes.get('/documents', documentController.getDocuments);

// GET /admin/documents/search - Search documents
documentRoutes.get('/documents/search', documentController.searchDocuments);

// GET /admin/documents/:id - Get document by ID
documentRoutes.get('/documents/:id', documentController.getDocumentById);

// PUT /admin/documents/:id/status - Update document review status
documentRoutes.put('/documents/:id/status', documentController.updateDocumentStatus);

// DELETE /admin/documents/:id - Delete document
documentRoutes.delete('/documents/:id', documentController.deleteDocument);
