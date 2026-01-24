import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

import { dashboardRoutes } from './routes/dashboardRoutes';
import { uploadRoutes } from './routes/uploadRoutes';
import { profileRoutes } from './routes/profileRoutes';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Routes
app.route('/', dashboardRoutes);
app.route('/upload', uploadRoutes);
app.route('/profile', profileRoutes);

const port = 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
