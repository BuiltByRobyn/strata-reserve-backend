import { Hono } from 'hono';
import * as surveyController from '../../client/controllers/clientSurveyController';

export const adminSurveyRoutes = new Hono();

adminSurveyRoutes.get('/file-numbers/:fileId/survey/pdf', surveyController.downloadSurveyPdf);
adminSurveyRoutes.get('/file-numbers/:fileId/survey/sections', surveyController.getSurveySections);
adminSurveyRoutes.get('/file-numbers/:fileId/survey/questions', surveyController.getSurveyQuestions);
adminSurveyRoutes.get('/file-numbers/:fileId/survey/responses', surveyController.getSurveyResponses);
adminSurveyRoutes.get('/file-numbers/:fileId/survey/responses/archived', surveyController.getArchivedSurveyResponses);
adminSurveyRoutes.get('/file-numbers/:fileId/survey-requirements', surveyController.getSurveyRequirements);
adminSurveyRoutes.put('/file-numbers/:fileId/survey-requirements', surveyController.saveSurveyRequirements);
