import { Hono } from 'hono';
import * as serviceRequestController from '../controllers/serviceRequestController';

export const serviceRequestRoutes = new Hono();

serviceRequestRoutes.get('/service-requests', serviceRequestController.getServiceRequests);
serviceRequestRoutes.get('/service-requests/active', serviceRequestController.getActiveByStrata);
serviceRequestRoutes.get('/service-requests/detail', serviceRequestController.getServiceRequestById);
serviceRequestRoutes.post('/service-requests', serviceRequestController.createServiceRequest);
serviceRequestRoutes.delete('/service-requests', serviceRequestController.deleteServiceRequest);
