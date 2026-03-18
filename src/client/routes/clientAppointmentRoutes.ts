import { Hono } from 'hono';
import * as clientAppointmentController from '../controllers/clientAppointmentController';

export const clientAppointmentRoutes = new Hono();

clientAppointmentRoutes.get('/appointments/availability', clientAppointmentController.getAvailability);
clientAppointmentRoutes.get('/appointments/active', clientAppointmentController.getActiveAppointment);
clientAppointmentRoutes.get('/appointments/draft-meeting-eligibility', clientAppointmentController.getDraftMeetingEligibility);
clientAppointmentRoutes.get('/appointments/notifications', clientAppointmentController.getNotifications);
clientAppointmentRoutes.post('/appointments/request', clientAppointmentController.createAppointmentRequest);
clientAppointmentRoutes.put('/appointments/request/:id/cancel', clientAppointmentController.cancelAppointmentRequest);
clientAppointmentRoutes.put('/appointments/:id/cancel', clientAppointmentController.cancelAppointment);
clientAppointmentRoutes.put('/appointments/:id/reschedule', clientAppointmentController.rescheduleAppointment);
