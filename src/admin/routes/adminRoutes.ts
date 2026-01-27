import { Hono } from 'hono';
import { getAdminDashboard, getAllClients, getAllReports } from '../controllers/adminController';

const adminRoutes = new Hono();

adminRoutes.get('/dashboard', getAdminDashboard);
adminRoutes.get('/clients', getAllClients);
adminRoutes.get('/reports', getAllReports);

export { adminRoutes };
