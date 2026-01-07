import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { userRoutes } from './routes/userRoutes';
import { homeRoutes } from './routes/homeRoutes';
import { uploadRoutes } from './routes/uploadRoutes';

const app = new Hono();

// Middleware
app.use('*', logger());

// Routes
app.route('/users', userRoutes);
app.route('/upload', uploadRoutes);
app.route('/', homeRoutes);

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
