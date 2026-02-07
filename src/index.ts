import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

// Admin routes
import { adminRoutes } from './admin/routes/adminRoutes';
import { adminProfileRoutes } from './admin/routes/adminProfileRoutes';
import { adminUsersRoutes } from './admin/routes/adminUsersRoutes';
import { companyRoutes } from './admin/routes/companyRoutes';
import { strataRoutes } from './admin/routes/strataRoutes';
import { appointmentRoutes } from './admin/routes/appointmentRoutes';
import { inspectorAvailabilityRoutes } from './admin/routes/inspectorAvailabilityRoutes';
import { companyHolidayRoutes } from './admin/routes/companyHolidayRoutes';
import { documentRoutes } from './admin/routes/documentRoutes';

// Client routes
import { clientRoutes } from './client/routes/clientRoutes';
import { clientProfileRoutes } from './client/routes/clientProfileRoutes';
import { clientDocumentRoutes } from './client/routes/clientDocumentRoutes';

// Shared routes
import { authRoutes } from './shared/routes/authRoutes';
import { lookupRoutes } from './shared/routes/lookupRoutes';

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

// API routes (shared - lookups accessible to all authenticated users)
app.route('/api/lookups', lookupRoutes);

// Admin routes
app.route('/admin', adminRoutes);
app.route('/admin', adminProfileRoutes);
app.route('/admin', adminUsersRoutes);
app.route('/admin', companyRoutes);
app.route('/admin', strataRoutes);
app.route('/admin', appointmentRoutes);
app.route('/admin', inspectorAvailabilityRoutes);
app.route('/admin', companyHolidayRoutes);
app.route('/admin', documentRoutes);

// Client routes
app.route('/client', clientRoutes);
app.route('/client', clientProfileRoutes);
app.route('/client', clientDocumentRoutes);

// Legacy routes (keeping for backward compatibility)
app.route('/', dashboardRoutes);
app.route('/upload', uploadRoutes);
app.route('/profile', profileRoutes);

const port = 3000;
console.log(`Server is running on port ${port}`);
console.log(`Admin endpoints available at: http://localhost:${port}/admin/*`);
console.log(`Client endpoints available at: http://localhost:${port}/client/*`);
console.log(`API endpoints available at: http://localhost:${port}/api/*`);

serve({
  fetch: app.fetch,
  port,
});
