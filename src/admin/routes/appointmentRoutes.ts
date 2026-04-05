// Appointment Routes - Admin API endpoints for appointment management
import { Hono } from 'hono';
import * as appointmentController from '../controllers/appointmentController';

export const appointmentRoutes = new Hono();

// ============================================
// Appointment CRUD
// ============================================

// POST /admin/appointments - Create new appointment directly
appointmentRoutes.post('/appointments', appointmentController.createAppointment);

// GET /admin/appointments - Get all appointments
appointmentRoutes.get('/appointments', appointmentController.getAppointments);

// GET /admin/appointments/time-slots - Get time slots for dropdowns
appointmentRoutes.get('/appointments/time-slots', appointmentController.getTimeSlots);

// GET /admin/appointments/types - Get appointment types for dropdowns
appointmentRoutes.get('/appointments/types', appointmentController.getAppointmentTypes);

// GET /admin/appointments/recent-cancellations - Get recently cancelled appointments for dashboard
appointmentRoutes.get('/appointments/recent-cancellations', appointmentController.getRecentCancellations);

// Appointment Requests
appointmentRoutes.get('/appointments/requests', appointmentController.getAppointmentRequests);
appointmentRoutes.get('/appointments/requests/:id', appointmentController.getAppointmentRequestById);
appointmentRoutes.post('/appointments/requests/:id/review', appointmentController.reviewAppointmentRequest);

appointmentRoutes.get('/appointments/:id', appointmentController.getAppointmentById);

appointmentRoutes.put('/appointments/:id/status', appointmentController.updateAppointmentStatus);

appointmentRoutes.put('/appointments/:id/inspector', appointmentController.assignInspector);

appointmentRoutes.put('/appointments/:id/reschedule', appointmentController.rescheduleAppointment);

appointmentRoutes.post('/appointments/:id/request-rebooking', appointmentController.requestRebooking);

appointmentRoutes.delete('/appointments/:id', appointmentController.cancelAppointment);
