import { Hono } from 'hono';
import { getClientProfile, updateClientProfile, requestSectionChange } from '../controllers/clientProfileController';

const clientProfileRoutes = new Hono();

clientProfileRoutes.get('/profile', getClientProfile);
clientProfileRoutes.put('/profile', updateClientProfile);
clientProfileRoutes.post('/profile/request-section-change', requestSectionChange);

export { clientProfileRoutes };
