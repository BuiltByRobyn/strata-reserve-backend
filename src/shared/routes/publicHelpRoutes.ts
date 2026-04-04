import { Hono } from 'hono';
import * as helpResourceController from '../controllers/helpResourceController';

export const publicHelpRoutes = new Hono();

publicHelpRoutes.get('/help-resources', helpResourceController.getPublicResources);
publicHelpRoutes.get('/help-resources/:id', helpResourceController.getPublicResourceById);
