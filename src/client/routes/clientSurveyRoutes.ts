import { Hono } from 'hono';
import * as surveyController from '../controllers/clientSurveyController';

export const clientSurveyRoutes = new Hono();

clientSurveyRoutes.get('/service-requests/active/survey/pdf', surveyController.downloadActiveSurveyPdf);
clientSurveyRoutes.get('/service-requests/:serviceRequestId/survey/sections', surveyController.getSurveySections);
clientSurveyRoutes.get('/service-requests/:serviceRequestId/survey/questions', surveyController.getSurveyQuestions);
clientSurveyRoutes.get('/service-requests/:serviceRequestId/survey/responses', surveyController.getSurveyResponses);
clientSurveyRoutes.get('/service-requests/:serviceRequestId/survey/responses/archived', surveyController.getArchivedSurveyResponses);
clientSurveyRoutes.post('/service-requests/:serviceRequestId/survey/responses', surveyController.saveSurveyResponses);
