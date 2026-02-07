import { Hono } from 'hono';
import { getClientProfile, updateClientProfile } from '../controllers/clientProfileController';

const clientProfileRoutes = new Hono();

clientProfileRoutes.get('/profile', getClientProfile);
clientProfileRoutes.put('/profile', updateClientProfile);

export { clientProfileRoutes };
