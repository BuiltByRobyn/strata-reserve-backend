import { Hono } from 'hono';
import * as fnSurveyQuestionController from '../controllers/fnSurveyQuestionController';

export const fnSurveyQuestionRoutes = new Hono();

fnSurveyQuestionRoutes.get(
  '/file-numbers/:id/survey-questions', 
  fnSurveyQuestionController.getQuestionsBySR
);

fnSurveyQuestionRoutes.post(
  '/file-numbers/:id/survey-questions', 
  fnSurveyQuestionController.addQuestionToSR
);

fnSurveyQuestionRoutes.delete(
  '/file-numbers/:id/survey-questions/:fnSurveyQuestionId',
  fnSurveyQuestionController.removeQuestionFromSR
);
