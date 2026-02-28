import { Hono } from 'hono';
import * as surveyController from '../../client/controllers/clientSurveyController';

export const adminSurveyRoutes = new Hono();

adminSurveyRoutes.get('/service-requests/:serviceRequestId/survey/sections', surveyController.getSurveySections);
adminSurveyRoutes.get('/service-requests/:serviceRequestId/survey/questions', surveyController.getSurveyQuestions);
adminSurveyRoutes.get('/service-requests/:serviceRequestId/survey/responses', surveyController.getSurveyResponses);
adminSurveyRoutes.get('/service-requests/:serviceRequestId/survey/responses/archived', surveyController.getArchivedSurveyResponses);
adminSurveyRoutes.get('/service-requests/:serviceRequestId/survey-requirements', surveyController.getSurveyRequirements);
adminSurveyRoutes.put('/service-requests/:serviceRequestId/survey-requirements', surveyController.saveSurveyRequirements);
