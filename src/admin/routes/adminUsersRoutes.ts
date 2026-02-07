// Admin Users Routes - API endpoints for user management
import { Hono } from 'hono';
import * as adminUsersController from '../controllers/adminUsersController';

export const adminUsersRoutes = new Hono();

// GET /admin/users - Get all users with optional filters
adminUsersRoutes.get('/users', adminUsersController.getUsers);

// GET /admin/users/:id - Get user by ID
adminUsersRoutes.get('/users/:id', adminUsersController.getUserById);

// POST /admin/users - Create new user
adminUsersRoutes.post('/users', adminUsersController.createUser);

// PUT /admin/users/:id - Update user
adminUsersRoutes.put('/users/:id', adminUsersController.updateUser);

// DELETE /admin/users/:id - Delete user
adminUsersRoutes.delete('/users/:id', adminUsersController.deleteUser);
