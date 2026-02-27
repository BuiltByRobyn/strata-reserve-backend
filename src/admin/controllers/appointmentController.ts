import * as appointmentService from '../../shared/services/appointmentService';
import { success, error, asyncHandler, getByIdHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getAppointments = asyncHandler(async (c) => {
  const appointments = await appointmentService.getAppointments();
  return success(c, appointments);
}, 'Failed to fetch appointments');

export const getAppointmentById = getByIdHandler(appointmentService.getAppointmentById, 'Appointment');

export const updateAppointmentStatus = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();
  const { status, completionNote } = body;

  if (!status) {
    return error(c, 'Status is required', 400);
  }

  const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'];
  if (!validStatuses.includes(status)) {
    return error(c, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
  }

  const appointment = await appointmentService.updateAppointmentStatus(id, status, completionNote);
  return success(c, appointment);
}, 'Failed to update appointment status');

export const cancelAppointment = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const appointment = await appointmentService.cancelAppointment(id);
  return success(c, appointment);
}, 'Failed to cancel appointment');

export const assignInspector = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();
  if (!body.inspectorProfileId) {
    return error(c, 'Inspector profile ID is required', 400);
  }
  const appointment = await appointmentService.assignInspector(id, body.inspectorProfileId);
  return success(c, appointment);
}, 'Failed to assign inspector');

export const rescheduleAppointment = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const body = await c.req.json();
  const { appointmentDate, timeSlotId } = body;

  if (!appointmentDate || !timeSlotId) {
    return error(c, 'Appointment date and time slot are required', 400);
  }

  const appointment = await appointmentService.rescheduleAppointment(
    id,
    new Date(appointmentDate),
    parseInt(timeSlotId)
  );
  return success(c, appointment);
}, 'Failed to reschedule appointment');

export const getTimeSlots = asyncHandler(async (c) => {
  const timeSlots = await appointmentService.getTimeSlots();
  return success(c, timeSlots);
}, 'Failed to fetch time slots');

export const getAppointmentTypes = asyncHandler(async (c) => {
  const appointmentTypes = await appointmentService.getAppointmentTypes();
  return success(c, appointmentTypes);
}, 'Failed to fetch appointment types');
