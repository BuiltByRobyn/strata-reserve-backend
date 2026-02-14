import { Hono } from 'hono';
import * as questionController from '../controllers/questionController';

export const questionRoutes = new Hono();

questionRoutes.get('/questions', questionController.getQuestions);
questionRoutes.get('/questions/:id', questionController.getQuestionById);
questionRoutes.post('/questions', questionController.createQuestion);
questionRoutes.put('/questions/:id', questionController.updateQuestion);
questionRoutes.delete('/questions/:id', questionController.deleteQuestion);
