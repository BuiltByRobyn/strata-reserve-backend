import { Hono } from 'hono';
import { getClientDashboard, getClientReports, getActiveServiceRequest, submitDocumentsForReview } from '../controllers/clientController';
import { getTimelines, updateTimelines } from '../controllers/clientTimelinesController';

const clientRoutes = new Hono();

clientRoutes.get('/dashboard', getClientDashboard);
clientRoutes.get('/reports', getClientReports);
clientRoutes.get('/service-requests/active', getActiveServiceRequest);
clientRoutes.post('/service-requests/:id/submit', submitDocumentsForReview);
clientRoutes.get('/service-requests/:serviceRequestId/timelines', getTimelines);
clientRoutes.put('/service-requests/:serviceRequestId/timelines', updateTimelines);

export { clientRoutes };
