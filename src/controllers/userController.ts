import { Context } from 'hono';
import { UserService } from '../services/userService';

export const UserController = {
  getUsers: (c: Context) => {
    const users = UserService.getAllUsers();
    return c.json(users);
  },

  getUser: (c: Context) => {
    const id = c.req.param('id');
    const user = UserService.getUserById(id);
    if (!user) {
      return c.json({ message: 'User not found' }, 404);
    }
    return c.json(user);
  },

  createUser: async (c: Context) => {
    const body = await c.req.json();
    if (!body.name || !body.email) {
      return c.json({ message: 'Name and email are required' }, 400);
    }
    const newUser = UserService.createUser({ name: body.name, email: body.email });
    return c.json(newUser, 201);
  },
};
