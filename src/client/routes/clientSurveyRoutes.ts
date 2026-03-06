import { Hono } from 'hono';
import * as surveyController from '../controllers/clientSurveyController';

export const clientSurveyRoutes = new Hono();

clientSurveyRoutes.get('/file-numbers/active/survey/pdf', surveyController.downloadActiveSurveyPdf);
clientSurveyRoutes.get('/file-numbers/:fileNumberId/survey/sections', surveyController.getSurveySections);
clientSurveyRoutes.get('/file-numbers/:fileNumberId/survey/questions', surveyController.getSurveyQuestions);
clientSurveyRoutes.get('/file-numbers/:fileNumberId/survey/responses', surveyController.getSurveyResponses);
clientSurveyRoutes.get('/file-numbers/:fileNumberId/survey/responses/archived', surveyController.getArchivedSurveyResponses);
clientSurveyRoutes.post('/file-numbers/:fileNumberId/survey/responses', surveyController.saveSurveyResponses);
