import { Hono } from 'hono';
import * as srSurveyQuestionController from '../controllers/srSurveyQuestionController';

export const srSurveyQuestionRoutes = new Hono();

// GET /admin/service-requests/:id/survey-questions
srSurveyQuestionRoutes.get(
  '/service-requests/:id/survey-questions', 
  srSurveyQuestionController.getQuestionsBySR
);

// POST /admin/service-requests/:id/survey-questions
srSurveyQuestionRoutes.post(
  '/service-requests/:id/survey-questions', 
  srSurveyQuestionController.addQuestionToSR
);

// DELETE /admin/service-requests/:id/survey-questions/:srSurveyQuestionId
srSurveyQuestionRoutes.delete(
  '/service-requests/:id/survey-questions/:srSurveyQuestionId',
  srSurveyQuestionController.removeQuestionFromSR
);
