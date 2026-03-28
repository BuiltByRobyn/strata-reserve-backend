import { Hono } from 'hono';
import { getClientProfile, updateClientProfile, requestSectionChange, notifyPasswordUpdated } from '../controllers/clientProfileController';

const clientProfileRoutes = new Hono();

clientProfileRoutes.get('/profile', getClientProfile);
clientProfileRoutes.put('/profile', updateClientProfile);
clientProfileRoutes.post('/profile/request-section-change', requestSectionChange);
clientProfileRoutes.post('/profile/password-updated', notifyPasswordUpdated);

export { clientProfileRoutes };
