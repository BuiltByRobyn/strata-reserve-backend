import { Hono } from 'hono';
import { getPendingRequests, approveRequest, rejectRequest } from '../controllers/propertyTypeRequestController';

const propertyTypeRequestRoutes = new Hono();

propertyTypeRequestRoutes.get('/property-type-requests/pending', getPendingRequests);
propertyTypeRequestRoutes.post('/property-type-requests/:id/approve', approveRequest);
propertyTypeRequestRoutes.post('/property-type-requests/:id/reject', rejectRequest);

export { propertyTypeRequestRoutes };
