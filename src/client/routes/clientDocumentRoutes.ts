import { Hono } from 'hono';
import * as clientDocumentController from '../controllers/clientDocumentController';

export const clientDocumentRoutes = new Hono();

clientDocumentRoutes.get('/documents', clientDocumentController.getMyDocuments);
clientDocumentRoutes.get('/service-requests/:id/required-documents', clientDocumentController.getRequiredDocuments);
clientDocumentRoutes.get('/service-requests/:id/documents', clientDocumentController.getDocumentsByServiceRequest);
