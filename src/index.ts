import { serve } from '@hono/node-server';
// v2 - reload to pick up updated Prisma client schema (parentQuestionId, subLabel)
import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { authMiddleware, internalUserMiddleware, noDeleteMiddleware, adminAssistantOnlyMiddleware, inspectorReadOnlyMiddleware } from './shared/middleware/auth';
import prisma from './shared/lib/prismaClient';

// Admin routes
import { adminProfileRoutes } from './admin/routes/adminProfileRoutes';
import { adminUsersRoutes } from './admin/routes/adminUsersRoutes';
import { strataRoutes } from './admin/routes/strataRoutes';
import { appointmentRoutes } from './admin/routes/appointmentRoutes';
import { inspectorAvailabilityRoutes } from './admin/routes/inspectorAvailabilityRoutes';
import { companyHolidayRoutes } from './admin/routes/companyHolidayRoutes';
import { documentRoutes } from './admin/routes/documentRoutes';
import { fileNumberRoutes } from './admin/routes/fileNumberRoutes';
import { adminSurveyRoutes } from './admin/routes/adminSurveyRoutes';
import { questionRoutes } from './admin/routes/questionRoutes';
import { fnDocRequirementRoutes } from './admin/routes/fnDocRequirementRoutes';
import { documentReviewRoutes } from './admin/routes/documentReviewRoutes';
import { adminNotificationRoutes } from './admin/routes/adminNotificationRoutes';
import { propertyTypeRequestRoutes } from './admin/routes/propertyTypeRequestRoutes';
import { fnSurveyQuestionRoutes } from './admin/routes/fnSurveyQuestionRoutes';
import { activationRequestRoutes } from './admin/routes/activationRequestRoutes';

// Client routes
import { clientRoutes } from './client/routes/clientRoutes';
import { clientProfileRoutes } from './client/routes/clientProfileRoutes';
import { clientDocumentRoutes } from './client/routes/clientDocumentRoutes';
import { clientSurveyRoutes } from './client/routes/clientSurveyRoutes';
import { clientAppointmentRoutes } from './client/routes/clientAppointmentRoutes';

// Shared routes
import { lookupRoutes } from './shared/routes/lookupRoutes';
import { notificationRoutes } from './shared/routes/notificationRoutes';
import { publicHelpRoutes } from './shared/routes/publicHelpRoutes';
import { helpResourceRoutes } from './shared/routes/helpResourceRoutes';

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

// Public routes (no auth)
app.route('/public', publicHelpRoutes);

// API routes (auth required)
app.use('/api/*', authMiddleware);
app.route('/api/lookups', lookupRoutes);
app.route('/api', helpResourceRoutes);

// Admin routes (auth + admin role required)
app.use('/admin/*', authMiddleware);
app.use('/admin/*', internalUserMiddleware);
app.use('/admin/*', noDeleteMiddleware);
app.use('/admin/questions/*', adminAssistantOnlyMiddleware);
app.use('/admin/company-holidays/*', adminAssistantOnlyMiddleware);
app.use('/admin/*', inspectorReadOnlyMiddleware);
app.route('/admin', adminProfileRoutes);
app.route('/admin', adminUsersRoutes);
app.route('/admin', strataRoutes);
app.route('/admin', appointmentRoutes);
app.route('/admin', inspectorAvailabilityRoutes);
app.route('/admin', companyHolidayRoutes);
app.route('/admin', documentRoutes);
app.route('/admin', fileNumberRoutes);
app.route('/admin', adminSurveyRoutes);
app.route('/admin', questionRoutes);
app.route('/admin', fnDocRequirementRoutes);
app.route('/admin', documentReviewRoutes);
app.route('/admin', propertyTypeRequestRoutes);
app.route('/admin', fnSurveyQuestionRoutes);
app.route('/admin', activationRequestRoutes);

// Client routes (auth required)
app.use('/client/*', authMiddleware);
app.route('/client', clientRoutes);
app.route('/client', clientProfileRoutes);
app.route('/client', clientDocumentRoutes);
app.route('/client', clientSurveyRoutes);
app.route('/client', clientAppointmentRoutes);
app.route('/client', notificationRoutes);
app.route('/admin', adminNotificationRoutes);

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
