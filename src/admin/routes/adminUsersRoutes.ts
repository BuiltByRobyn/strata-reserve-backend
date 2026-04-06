import { Hono } from 'hono';
import * as adminUsersController from '../controllers/adminUsersController';

export const adminUsersRoutes = new Hono();

adminUsersRoutes.get('/users', adminUsersController.getUsers);

adminUsersRoutes.get('/users/:id', adminUsersController.getUserById);

adminUsersRoutes.post('/users', adminUsersController.createUser);

adminUsersRoutes.post('/users/:id/resend-invite', adminUsersController.resendInvite);

adminUsersRoutes.put('/users/:id', adminUsersController.updateUser);

adminUsersRoutes.delete('/users/:id', adminUsersController.deleteUser);
