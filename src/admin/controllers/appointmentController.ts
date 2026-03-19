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
  let reason: string | undefined;
  try {
    const body = await c.req.json();
    reason = body.reason;
  } catch { /* no body is fine */ }
  const appointment = await appointmentService.cancelAppointment(id, reason);
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
    parseInt(timeSlotId),
    {
      inspectorProfileId: body.inspectorProfileId,
      secondInspectorProfileId: body.secondInspectorProfileId,
      reason: body.reason,
    }
  );
  return success(c, appointment);
}, 'Failed to reschedule appointment');

export const getAppointmentRequests = asyncHandler(async (c) => {
  const status = c.req.query('status');
  const requests = await appointmentService.getAppointmentRequests(status);
  return success(c, requests);
}, 'Failed to fetch appointment requests');

export const getAppointmentRequestById = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const request = await appointmentService.getAppointmentRequestById(id);
  if (!request) return error(c, 'Appointment request not found', 404);
  return success(c, request);
}, 'Failed to fetch appointment request');

export const reviewAppointmentRequest = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const user = c.get('user');
  const body = await c.req.json();

  const { approved, approvedDateChoice, rejectionReason, inspectorProfileId, comments } = body;

  if (typeof approved !== 'boolean') {
    return error(c, 'approved field is required (true/false)', 400);
  }

  if (approved && !inspectorProfileId) {
    return error(c, 'Inspector must be assigned when approving', 400);
  }

  if (!approved && !rejectionReason) {
    return error(c, 'Rejection reason is required when rejecting', 400);
  }

  try {
    const result = await appointmentService.reviewAppointmentRequest({
      appointmentRequestId: id,
      reviewedByProfileId: user.id,
      approved,
      approvedDateChoice: approvedDateChoice ? parseInt(approvedDateChoice) : undefined,
      rejectionReason,
      inspectorProfileId,
      comments,
    });
    return success(c, result, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Review failed';
    return error(c, msg, 400);
  }
}, 'Failed to review appointment request');

export const createAppointment = asyncHandler(async (c) => {
  const body = await c.req.json();
  const { fileId, appointmentDate, timeSlotId, appointmentTypeId, inspectorProfileId, secondInspectorProfileId } = body;

  if (!fileId || !appointmentDate || !timeSlotId || !appointmentTypeId) {
    return error(c, 'Strata, date, time slot, and appointment type are required', 400);
  }

  try {
    const appointment = await appointmentService.createAppointment({
      appointmentDate: new Date(appointmentDate + 'T00:00:00Z'),
      timeSlotId: parseInt(timeSlotId),
      fileId: parseInt(fileId),
      appointmentTypeId: parseInt(appointmentTypeId),
      inspectorProfileId: inspectorProfileId || null,
      secondInspectorProfileId: secondInspectorProfileId || null,
    });
    return success(c, appointment, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create appointment';
    return error(c, msg, 400);
  }
}, 'Failed to create appointment');

export const getTimeSlots = asyncHandler(async (c) => {
  const timeSlots = await appointmentService.getTimeSlots();
  return success(c, timeSlots);
}, 'Failed to fetch time slots');

export const getAppointmentTypes = asyncHandler(async (c) => {
  const appointmentTypes = await appointmentService.getAppointmentTypes();
  return success(c, appointmentTypes);
}, 'Failed to fetch appointment types');

export const requestRebooking = asyncHandler(async (c) => {
  const id = parseIntParam(c, 'id');
  const result = await appointmentService.requestRebooking(id);
  return success(c, result);
}, 'Failed to request rebooking');
