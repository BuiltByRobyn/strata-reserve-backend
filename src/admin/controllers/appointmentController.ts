// Appointment Controller - Handles requests for appointment management
import { Context } from 'hono';
import * as appointmentService from '../../services/appointmentService';

// ============================================
// Get All Appointments
// ============================================
export const getAppointments = async (c: Context) => {
  try {
    const appointments = await appointmentService.getAppointments();
    return c.json({ success: true, data: appointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return c.json({ success: false, error: 'Failed to fetch appointments' }, 500);
  }
};

// ============================================
// Get Appointment by ID
// ============================================
export const getAppointmentById = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid appointment ID' }, 400);
    }

    const appointment = await appointmentService.getAppointmentById(id);
    if (!appointment) {
      return c.json({ success: false, error: 'Appointment not found' }, 404);
    }

    return c.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return c.json({ success: false, error: 'Failed to fetch appointment' }, 500);
  }
};

// ============================================
// Update Appointment Status
// ============================================
export const updateAppointmentStatus = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid appointment ID' }, 400);
    }

    const body = await c.req.json();
    const { status, completionNote } = body;

    if (!status) {
      return c.json({ success: false, error: 'Status is required' }, 400);
    }

    const validStatuses = ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'];
    if (!validStatuses.includes(status)) {
      return c.json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, 400);
    }

    const appointment = await appointmentService.updateAppointmentStatus(id, status, completionNote);
    return c.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    return c.json({ success: false, error: 'Failed to update appointment status' }, 500);
  }
};

// ============================================
// Cancel Appointment
// ============================================
export const cancelAppointment = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid appointment ID' }, 400);
    }

    const appointment = await appointmentService.cancelAppointment(id);
    return c.json({ success: true, data: appointment, message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    return c.json({ success: false, error: 'Failed to cancel appointment' }, 500);
  }
};

// ============================================
// Assign Inspector
// ============================================
export const assignInspector = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid appointment ID' }, 400);
    }

    const body = await c.req.json();
    const { inspectorProfileId } = body;

    if (!inspectorProfileId) {
      return c.json({ success: false, error: 'Inspector profile ID is required' }, 400);
    }

    const appointment = await appointmentService.assignInspector(id, inspectorProfileId);
    return c.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error assigning inspector:', error);
    return c.json({ success: false, error: 'Failed to assign inspector' }, 500);
  }
};

// ============================================
// Reschedule Appointment
// ============================================
export const rescheduleAppointment = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid appointment ID' }, 400);
    }

    const body = await c.req.json();
    const { appointmentDate, timeSlotId } = body;

    if (!appointmentDate || !timeSlotId) {
      return c.json({ success: false, error: 'Appointment date and time slot are required' }, 400);
    }

    const appointment = await appointmentService.rescheduleAppointment(
      id, 
      new Date(appointmentDate), 
      parseInt(timeSlotId)
    );
    return c.json({ success: true, data: appointment });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    return c.json({ success: false, error: 'Failed to reschedule appointment' }, 500);
  }
};

// ============================================
// Get Time Slots (for dropdowns)
// ============================================
export const getTimeSlots = async (c: Context) => {
  try {
    const timeSlots = await appointmentService.getTimeSlots();
    return c.json({ success: true, data: timeSlots });
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return c.json({ success: false, error: 'Failed to fetch time slots' }, 500);
  }
};

// ============================================
// Get Appointment Types (for dropdowns)
// ============================================
export const getAppointmentTypes = async (c: Context) => {
  try {
    const appointmentTypes = await appointmentService.getAppointmentTypes();
    return c.json({ success: true, data: appointmentTypes });
  } catch (error) {
    console.error('Error fetching appointment types:', error);
    return c.json({ success: false, error: 'Failed to fetch appointment types' }, 500);
  }
};
