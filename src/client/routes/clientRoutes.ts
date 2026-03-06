import { Hono } from 'hono';
import { getActiveFileNumber, submitDocumentsForReview, getPropertyTypeRequest, createPropertyTypeRequest } from '../controllers/clientController';
import { getTimelines, updateTimelines } from '../controllers/clientTimelinesController';

const clientRoutes = new Hono();

clientRoutes.get('/file-numbers/active', getActiveFileNumber);
clientRoutes.post('/file-numbers/:id/submit', submitDocumentsForReview);
clientRoutes.get('/file-numbers/:fileNumberId/timelines', getTimelines);
clientRoutes.put('/file-numbers/:fileNumberId/timelines', updateTimelines);
clientRoutes.get('/property-type-request', getPropertyTypeRequest);
clientRoutes.post('/property-type-request', createPropertyTypeRequest);

export { clientRoutes };
