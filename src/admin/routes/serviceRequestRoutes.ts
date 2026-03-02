import { Hono } from 'hono';
import * as serviceRequestController from '../controllers/serviceRequestController';
import { updateServiceRequestTimelines } from '../controllers/strataController';

export const serviceRequestRoutes = new Hono();

serviceRequestRoutes.get('/service-requests', serviceRequestController.getServiceRequests);
serviceRequestRoutes.get('/service-requests/active', serviceRequestController.getActiveByStrata);
serviceRequestRoutes.get('/service-requests/detail', serviceRequestController.getServiceRequestById);
serviceRequestRoutes.post('/service-requests', serviceRequestController.createServiceRequest);
serviceRequestRoutes.delete('/service-requests', serviceRequestController.deleteServiceRequest);
serviceRequestRoutes.put('/service-requests/:id/offer-appointment', serviceRequestController.offerAppointment);
serviceRequestRoutes.put('/service-requests/:serviceRequestId/timelines', updateServiceRequestTimelines);
