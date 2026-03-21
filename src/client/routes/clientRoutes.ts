import { Hono } from 'hono';
import { getActiveFileNumber, submitDocumentsForReview, getPropertyTypeRequest, createPropertyTypeRequest } from '../controllers/clientController';
import { getTimelines, updateTimelines } from '../controllers/clientTimelinesController';
import { getActivationRequest, createActivationRequest } from '../controllers/activationRequestController';

const clientRoutes = new Hono();

clientRoutes.get('/file-numbers/active', getActiveFileNumber);
clientRoutes.post('/file-numbers/:id/submit', submitDocumentsForReview);
clientRoutes.get('/file-numbers/:fileId/timelines', getTimelines);
clientRoutes.put('/file-numbers/:fileId/timelines', updateTimelines);
clientRoutes.get('/property-type-request', getPropertyTypeRequest);
clientRoutes.post('/property-type-request', createPropertyTypeRequest);
clientRoutes.get('/activation-request', getActivationRequest);
clientRoutes.post('/activation-request', createActivationRequest);

export { clientRoutes };
