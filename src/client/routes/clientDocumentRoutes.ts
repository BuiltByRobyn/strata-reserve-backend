import { Hono } from 'hono';
import * as clientDocumentController from '../controllers/clientDocumentController';

export const clientDocumentRoutes = new Hono();

clientDocumentRoutes.get('/documents', clientDocumentController.getMyDocuments);
clientDocumentRoutes.get('/documents/search', clientDocumentController.searchMyDocuments);
clientDocumentRoutes.get('/documents/:id', clientDocumentController.getMyDocumentById);
clientDocumentRoutes.get('/file-numbers/:id/required-documents', clientDocumentController.getRequiredDocuments);
clientDocumentRoutes.get('/file-numbers/:id/documents', clientDocumentController.getDocumentsByFileNumber);
