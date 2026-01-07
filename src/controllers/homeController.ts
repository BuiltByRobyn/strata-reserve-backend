import { Context } from 'hono';

export const HomeController = {
  index: (c: Context) => {
    return c.json({
      message: 'Welcome to the API!',
      documentation: '/docs', // Placeholder for future docs
      status: 'active',
    });
  },
};
