import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { authMiddleware, adminMiddleware } from './shared/middleware/auth';

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
import { questionRoutes } from './admin/routes/questionRoutes';
import { srDocRequirementRoutes } from './admin/routes/srDocRequirementRoutes';
import { propertyTypeRequestRoutes } from './admin/routes/propertyTypeRequestRoutes';

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
const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
  : ['http://localhost:5173'];
app.use('*', cors({
  origin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

app.onError((err, c) => {
  console.error('Unhandled error:', err.message);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }, 200));

// Auth routes (shared)
app.route('/auth', authRoutes);

// API routes (auth required)
app.use('/api/*', authMiddleware);
app.route('/api/lookups', lookupRoutes);

// Admin routes (auth + admin role required)
app.use('/admin/*', authMiddleware);
app.use('/admin/*', adminMiddleware);
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
app.route('/admin', questionRoutes);
app.route('/admin', srDocRequirementRoutes);
app.route('/admin', propertyTypeRequestRoutes);

// Client routes (auth required)
app.use('/client/*', authMiddleware);
app.route('/client', clientRoutes);
app.route('/client', clientProfileRoutes);
app.route('/client', clientDocumentRoutes);
app.route('/client', clientSurveyRoutes);

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on port ${port}`);
console.log(`Admin endpoints available at: http://localhost:${port}/admin/*`);
console.log(`Client endpoints available at: http://localhost:${port}/client/*`);
console.log(`API endpoints available at: http://localhost:${port}/api/*`);

serve({
  fetch: app.fetch,
  port,
});
