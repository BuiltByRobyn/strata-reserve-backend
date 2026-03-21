import { Hono } from 'hono';
import { getPendingRequests, approveRequest, rejectRequest } from '../controllers/activationRequestController';

const activationRequestRoutes = new Hono();

activationRequestRoutes.get('/activation-requests/pending', getPendingRequests);
activationRequestRoutes.post('/activation-requests/:id/approve', approveRequest);
activationRequestRoutes.post('/activation-requests/:id/reject', rejectRequest);

export { activationRequestRoutes };
