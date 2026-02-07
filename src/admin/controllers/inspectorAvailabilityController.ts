// Inspector Availability Controller - Handles requests for inspector availability management
import { Context } from 'hono';
import * as inspectorAvailabilityService from '../../services/inspectorAvailabilityService';

// ============================================
// Get All Available Dates
// ============================================
export const getAvailableDates = async (c: Context) => {
  try {
    const inspectorProfileId = c.req.query('inspectorProfileId');
    const availableDates = await inspectorAvailabilityService.getAvailableDates(inspectorProfileId);
    return c.json({ success: true, data: availableDates });
  } catch (error) {
    console.error('Error fetching available dates:', error);
    return c.json({ success: false, error: 'Failed to fetch available dates' }, 500);
  }
};

// ============================================
// Get Available Date by ID
// ============================================
export const getAvailableDateById = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid ID' }, 400);
    }

    const availableDate = await inspectorAvailabilityService.getAvailableDateById(id);
    if (!availableDate) {
      return c.json({ success: false, error: 'Available date not found' }, 404);
    }

    return c.json({ success: true, data: availableDate });
  } catch (error) {
    console.error('Error fetching available date:', error);
    return c.json({ success: false, error: 'Failed to fetch available date' }, 500);
  }
};

// ============================================
// Create Available Date
// ============================================
export const createAvailableDate = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { availableDate, availableStartTime, availableEndTime, inspectorProfileId } = body;

    if (!availableDate || !inspectorProfileId) {
      return c.json({ 
        success: false, 
        error: 'Available date and inspector profile ID are required' 
      }, 400);
    }

    const newAvailableDate = await inspectorAvailabilityService.createAvailableDate({
      availableDate: new Date(availableDate),
      availableStartTime: availableStartTime ? new Date(`1970-01-01T${availableStartTime}`) : null,
      availableEndTime: availableEndTime ? new Date(`1970-01-01T${availableEndTime}`) : null,
      inspectorProfileId
    });

    return c.json({ success: true, data: newAvailableDate }, 201);
  } catch (error) {
    console.error('Error creating available date:', error);
    return c.json({ success: false, error: 'Failed to create available date' }, 500);
  }
};

// ============================================
// Update Available Date
// ============================================
export const updateAvailableDate = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid ID' }, 400);
    }

    const body = await c.req.json();
    const { availableDate, availableStartTime, availableEndTime } = body;

    const updateData: {
      availableDate?: Date;
      availableStartTime?: Date | null;
      availableEndTime?: Date | null;
    } = {};

    if (availableDate) {
      updateData.availableDate = new Date(availableDate);
    }
    if (availableStartTime !== undefined) {
      updateData.availableStartTime = availableStartTime 
        ? new Date(`1970-01-01T${availableStartTime}`) 
        : null;
    }
    if (availableEndTime !== undefined) {
      updateData.availableEndTime = availableEndTime 
        ? new Date(`1970-01-01T${availableEndTime}`) 
        : null;
    }

    const updatedAvailableDate = await inspectorAvailabilityService.updateAvailableDate(id, updateData);
    return c.json({ success: true, data: updatedAvailableDate });
  } catch (error) {
    console.error('Error updating available date:', error);
    return c.json({ success: false, error: 'Failed to update available date' }, 500);
  }
};

// ============================================
// Delete Available Date
// ============================================
export const deleteAvailableDate = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid ID' }, 400);
    }

    await inspectorAvailabilityService.deleteAvailableDate(id);
    return c.json({ success: true, message: 'Available date deleted successfully' });
  } catch (error) {
    console.error('Error deleting available date:', error);
    return c.json({ success: false, error: 'Failed to delete available date' }, 500);
  }
};

// ============================================
// Get Available Dates by Date Range
// ============================================
export const getAvailableDatesByRange = async (c: Context) => {
  try {
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const inspectorProfileId = c.req.query('inspectorProfileId');

    if (!startDate || !endDate) {
      return c.json({ success: false, error: 'Start date and end date are required' }, 400);
    }

    const availableDates = await inspectorAvailabilityService.getAvailableDatesByRange(
      new Date(startDate),
      new Date(endDate),
      inspectorProfileId
    );

    return c.json({ success: true, data: availableDates });
  } catch (error) {
    console.error('Error fetching available dates by range:', error);
    return c.json({ success: false, error: 'Failed to fetch available dates' }, 500);
  }
};
