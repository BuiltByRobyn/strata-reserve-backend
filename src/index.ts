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
import { serviceRequestRoutes } from './admin/routes/serviceRequestRoutes';
import { adminSurveyRoutes } from './admin/routes/adminSurveyRoutes';

// Client routes
import { clientRoutes } from './client/routes/clientRoutes';
import { clientProfileRoutes } from './client/routes/clientProfileRoutes';
import { clientDocumentRoutes } from './client/routes/clientDocumentRoutes';
import { clientSurveyRoutes } from './client/routes/clientSurveyRoutes';

// Shared routes
import { authRoutes } from './shared/routes/authRoutes';
import { lookupRoutes } from './shared/routes/lookupRoutes';

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
app.route('/admin', serviceRequestRoutes);
app.route('/admin', adminSurveyRoutes);

// Client routes
app.route('/client', clientRoutes);
app.route('/client', clientProfileRoutes);
app.route('/client', clientDocumentRoutes);
app.route('/client', clientSurveyRoutes);

const port = 3000;
console.log(`Server is running on port ${port}`);
console.log(`Admin endpoints available at: http://localhost:${port}/admin/*`);
console.log(`Client endpoints available at: http://localhost:${port}/client/*`);
console.log(`API endpoints available at: http://localhost:${port}/api/*`);

serve({
  fetch: app.fetch,
  port,
});
