import { serve } from '@hono/node-server';
// v2 - reload to pick up updated Prisma client schema (parentQuestionId, subLabel)
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { authMiddleware, adminMiddleware } from './shared/middleware/auth';
import prisma from './shared/lib/prismaClient';

// Admin routes
import { adminProfileRoutes } from './admin/routes/adminProfileRoutes';
import { adminUsersRoutes } from './admin/routes/adminUsersRoutes';
import { companyRoutes } from './admin/routes/companyRoutes';
import { strataRoutes } from './admin/routes/strataRoutes';
import { appointmentRoutes } from './admin/routes/appointmentRoutes';
import { inspectorAvailabilityRoutes } from './admin/routes/inspectorAvailabilityRoutes';
import { companyHolidayRoutes } from './admin/routes/companyHolidayRoutes';
import { documentRoutes } from './admin/routes/documentRoutes';
import { fileNumberRoutes } from './admin/routes/fileNumberRoutes';
import { adminSurveyRoutes } from './admin/routes/adminSurveyRoutes';
import { questionRoutes } from './admin/routes/questionRoutes';
import { fnDocRequirementRoutes } from './admin/routes/fnDocRequirementRoutes';
import { propertyTypeRequestRoutes } from './admin/routes/propertyTypeRequestRoutes';
import { fnSurveyQuestionRoutes } from './admin/routes/fnSurveyQuestionRoutes';

// Client routes
import { clientRoutes } from './client/routes/clientRoutes';
import { clientProfileRoutes } from './client/routes/clientProfileRoutes';
import { clientDocumentRoutes } from './client/routes/clientDocumentRoutes';
import { clientSurveyRoutes } from './client/routes/clientSurveyRoutes';
import { clientAppointmentRoutes } from './client/routes/clientAppointmentRoutes';

// Shared routes
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

// API routes (auth required)
app.use('/api/*', authMiddleware);
app.route('/api/lookups', lookupRoutes);

// Admin routes (auth + admin role required)
app.use('/admin/*', authMiddleware);
app.use('/admin/*', adminMiddleware);
app.route('/admin', adminProfileRoutes);
app.route('/admin', adminUsersRoutes);
app.route('/admin', companyRoutes);
app.route('/admin', strataRoutes);
app.route('/admin', appointmentRoutes);
app.route('/admin', inspectorAvailabilityRoutes);
app.route('/admin', companyHolidayRoutes);
app.route('/admin', documentRoutes);
app.route('/admin', fileNumberRoutes);
app.route('/admin', adminSurveyRoutes);
app.route('/admin', questionRoutes);
app.route('/admin', fnDocRequirementRoutes);
app.route('/admin', propertyTypeRequestRoutes);
app.route('/admin', fnSurveyQuestionRoutes);

// Client routes (auth required)
app.use('/client/*', authMiddleware);
app.route('/client', clientRoutes);
app.route('/client', clientProfileRoutes);
app.route('/client', clientDocumentRoutes);
app.route('/client', clientSurveyRoutes);
app.route('/client', clientAppointmentRoutes);

const port = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port,
  hostname: '0.0.0.0',
});

console.log(`Server is running on port ${port}`);

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
