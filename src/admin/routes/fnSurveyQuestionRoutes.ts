import { Hono } from 'hono';
import * as fnSurveyQuestionController from '../controllers/fnSurveyQuestionController';

export const fnSurveyQuestionRoutes = new Hono();

// GET /admin/file-numbers/:id/survey-questions
fnSurveyQuestionRoutes.get(
  '/file-numbers/:id/survey-questions', 
  fnSurveyQuestionController.getQuestionsBySR
);

// POST /admin/file-numbers/:id/survey-questions
fnSurveyQuestionRoutes.post(
  '/file-numbers/:id/survey-questions', 
  fnSurveyQuestionController.addQuestionToSR
);

// DELETE /admin/file-numbers/:id/survey-questions/:fnSurveyQuestionId
fnSurveyQuestionRoutes.delete(
  '/file-numbers/:id/survey-questions/:fnSurveyQuestionId',
  fnSurveyQuestionController.removeQuestionFromSR
);
