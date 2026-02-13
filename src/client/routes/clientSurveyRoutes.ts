import { Hono } from 'hono';
import * as surveyController from '../controllers/clientSurveyController';

export const clientSurveyRoutes = new Hono();

clientSurveyRoutes.get('/service-requests/:serviceRequestId/survey/sections', surveyController.getSurveySections);
clientSurveyRoutes.get('/service-requests/:serviceRequestId/survey/questions', surveyController.getSurveyQuestions);
clientSurveyRoutes.get('/service-requests/:serviceRequestId/survey/responses', surveyController.getSurveyResponses);
clientSurveyRoutes.post('/service-requests/:serviceRequestId/survey/responses', surveyController.saveSurveyResponses);
