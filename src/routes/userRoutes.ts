import { Hono } from 'hono';
import { UserController } from '../controllers/userController';

export const userRoutes = new Hono();

userRoutes.get('/', UserController.getUsers);
userRoutes.get('/:id', UserController.getUser);
userRoutes.post('/', UserController.createUser);
