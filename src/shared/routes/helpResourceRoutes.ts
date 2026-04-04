import { Hono } from 'hono';
import * as helpResourceController from '../controllers/helpResourceController';

export const helpResourceRoutes = new Hono();

helpResourceRoutes.get('/help-resources', helpResourceController.getInternalResources);
helpResourceRoutes.get('/help-resources/:id', helpResourceController.getInternalResourceById);
