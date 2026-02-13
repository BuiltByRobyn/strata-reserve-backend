import { Hono } from 'hono';
import { getClientDashboard, getClientReports, getActiveServiceRequest } from '../controllers/clientController';

const clientRoutes = new Hono();

clientRoutes.get('/dashboard', getClientDashboard);
clientRoutes.get('/reports', getClientReports);
clientRoutes.get('/service-requests/active', getActiveServiceRequest);

export { clientRoutes };
