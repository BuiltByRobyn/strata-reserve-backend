import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

// Admin routes
import { adminRoutes } from './admin/routes/adminRoutes';
import { adminProfileRoutes } from './admin/routes/adminProfileRoutes';

// Client routes
import { clientRoutes } from './client/routes/clientRoutes';
import { clientProfileRoutes } from './client/routes/clientProfileRoutes';

// Shared routes
import { authRoutes } from './shared/routes/authRoutes';

// Legacy routes (for backward compatibility, will be moved to shared)
import { dashboardRoutes } from './routes/dashboardRoutes';
import { uploadRoutes } from './routes/uploadRoutes';
import { profileRoutes } from './routes/profileRoutes';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());

// Auth routes (shared)
app.route('/auth', authRoutes);

// Admin routes
app.route('/admin', adminRoutes);
app.route('/admin', adminProfileRoutes);

// Client routes
app.route('/client', clientRoutes);
app.route('/client', clientProfileRoutes);

// Legacy routes (keeping for backward compatibility)
app.route('/', dashboardRoutes);
app.route('/upload', uploadRoutes);
app.route('/profile', profileRoutes);

const port = 3000;
console.log(`Server is running on port ${port}`);
console.log(`Admin endpoints available at: http://localhost:${port}/admin/*`);
console.log(`Client endpoints available at: http://localhost:${port}/client/*`);

serve({
  fetch: app.fetch,
  port,
});
