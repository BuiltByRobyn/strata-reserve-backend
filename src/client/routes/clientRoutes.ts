import { Hono } from 'hono';
import { getClientDashboard, getClientReports } from '../controllers/clientController';

const clientRoutes = new Hono();

clientRoutes.get('/dashboard', getClientDashboard);
clientRoutes.get('/reports', getClientReports);

export { clientRoutes };
