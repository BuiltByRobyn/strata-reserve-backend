import { Hono } from 'hono';
import { authMiddleware } from '../../shared/middleware/auth';
import { getClientProfile, updateClientProfile } from '../controllers/clientProfileController';

const clientProfileRoutes = new Hono();

clientProfileRoutes.use('*', authMiddleware);
clientProfileRoutes.get('/profile', getClientProfile);
clientProfileRoutes.put('/profile', updateClientProfile);

export { clientProfileRoutes };
