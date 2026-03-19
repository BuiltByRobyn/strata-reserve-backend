import { Hono } from 'hono';
import * as documentReviewController from '../controllers/documentReviewController';

export const documentReviewRoutes = new Hono();

documentReviewRoutes.get('/file-numbers/:id/document-review', documentReviewController.getDocumentReview);
documentReviewRoutes.post('/file-numbers/:id/document-review', documentReviewController.submitDocumentReview);
