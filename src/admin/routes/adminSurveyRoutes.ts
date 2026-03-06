import { Hono } from 'hono';
import * as surveyController from '../../client/controllers/clientSurveyController';

export const adminSurveyRoutes = new Hono();

adminSurveyRoutes.get('/file-numbers/:fileNumberId/survey/pdf', surveyController.downloadSurveyPdf);
adminSurveyRoutes.get('/file-numbers/:fileNumberId/survey/sections', surveyController.getSurveySections);
adminSurveyRoutes.get('/file-numbers/:fileNumberId/survey/questions', surveyController.getSurveyQuestions);
adminSurveyRoutes.get('/file-numbers/:fileNumberId/survey/responses', surveyController.getSurveyResponses);
adminSurveyRoutes.get('/file-numbers/:fileNumberId/survey/responses/archived', surveyController.getArchivedSurveyResponses);
adminSurveyRoutes.get('/file-numbers/:fileNumberId/survey-requirements', surveyController.getSurveyRequirements);
adminSurveyRoutes.put('/file-numbers/:fileNumberId/survey-requirements', surveyController.saveSurveyRequirements);
