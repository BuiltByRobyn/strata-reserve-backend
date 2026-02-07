// Strata Controller - Handles requests for strata property management
import { Context } from 'hono';
import * as strataService from '../../services/strataService';

// ============================================
// Get All Stratas
// ============================================
export const getStratas = async (c: Context) => {
  try {
    const stratas = await strataService.getStratas();
    return c.json({ success: true, data: stratas });
  } catch (error) {
    console.error('Error fetching stratas:', error);
    return c.json({ success: false, error: 'Failed to fetch stratas' }, 500);
  }
};

// ============================================
// Get Strata by ID
// ============================================
export const getStrataById = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid strata ID' }, 400);
    }

    const strata = await strataService.getStrataById(id);
    if (!strata) {
      return c.json({ success: false, error: 'Strata not found' }, 404);
    }

    return c.json({ success: true, data: strata });
  } catch (error) {
    console.error('Error fetching strata:', error);
    return c.json({ success: false, error: 'Failed to fetch strata' }, 500);
  }
};

// ============================================
// Create Strata
// ============================================
export const createStrata = async (c: Context) => {
  try {
    const body = await c.req.json();
    
    const strata = await strataService.createStrata({
      strataPlan: body.strataPlan?.trim(),
      complexName: body.complexName?.trim(),
      unitNumber: body.unitNumber?.trim(),
      streetName: body.streetName?.trim(),
      town: body.town?.trim(),
      province: body.province?.trim(),
      postalCode: body.postalCode?.trim(),
      country: body.country?.trim() || 'Canada',
      website: body.website?.trim(),
      legalTypeId: body.legalTypeId ? parseInt(body.legalTypeId) : undefined,
      propertyTypeId: body.propertyTypeId ? parseInt(body.propertyTypeId) : undefined,
      companyId: body.companyId ? parseInt(body.companyId) : undefined
    });

    return c.json({ success: true, data: strata }, 201);
  } catch (error) {
    console.error('Error creating strata:', error);
    return c.json({ success: false, error: 'Failed to create strata' }, 500);
  }
};

// ============================================
// Update Strata
// ============================================
export const updateStrata = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid strata ID' }, 400);
    }

    const body = await c.req.json();
    const strata = await strataService.updateStrata(id, {
      strataPlan: body.strataPlan?.trim(),
      complexName: body.complexName?.trim(),
      unitNumber: body.unitNumber?.trim(),
      streetName: body.streetName?.trim(),
      town: body.town?.trim(),
      province: body.province?.trim(),
      postalCode: body.postalCode?.trim(),
      country: body.country?.trim(),
      website: body.website?.trim(),
      legalTypeId: body.legalTypeId !== undefined ? parseInt(body.legalTypeId) : undefined,
      propertyTypeId: body.propertyTypeId !== undefined ? parseInt(body.propertyTypeId) : undefined,
      companyId: body.companyId !== undefined ? parseInt(body.companyId) : undefined
    });

    return c.json({ success: true, data: strata });
  } catch (error) {
    console.error('Error updating strata:', error);
    return c.json({ success: false, error: 'Failed to update strata' }, 500);
  }
};

// ============================================
// Delete Strata
// ============================================
export const deleteStrata = async (c: Context) => {
  try {
    const id = parseInt(c.req.param('id'));
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid strata ID' }, 400);
    }

    await strataService.deleteStrata(id);
    return c.json({ success: true, message: 'Strata deleted successfully' });
  } catch (error) {
    console.error('Error deleting strata:', error);
    return c.json({ success: false, error: 'Failed to delete strata' }, 500);
  }
};

// ============================================
// Search Stratas
// ============================================
export const searchStratas = async (c: Context) => {
  try {
    const query = c.req.query('q') || '';
    const stratas = await strataService.searchStratas(query);
    return c.json({ success: true, data: stratas });
  } catch (error) {
    console.error('Error searching stratas:', error);
    return c.json({ success: false, error: 'Failed to search stratas' }, 500);
  }
};

// ============================================
// Strata Notes
// ============================================
export const addStrataNote = async (c: Context) => {
  try {
    const strataId = parseInt(c.req.param('id'));
    if (isNaN(strataId)) {
      return c.json({ success: false, error: 'Invalid strata ID' }, 400);
    }

    const body = await c.req.json();
    if (!body.noteMessage || body.noteMessage.trim() === '') {
      return c.json({ success: false, error: 'Note message is required' }, 400);
    }

    const note = await strataService.addStrataNote({
      strataId,
      noteMessage: body.noteMessage.trim(),
      createdByProfileId: body.createdByProfileId,
      createdByUser: body.createdByUser?.trim()
    });

    return c.json({ success: true, data: note }, 201);
  } catch (error) {
    console.error('Error adding strata note:', error);
    return c.json({ success: false, error: 'Failed to add strata note' }, 500);
  }
};

export const deleteStrataNote = async (c: Context) => {
  try {
    const noteId = parseInt(c.req.param('noteId'));
    if (isNaN(noteId)) {
      return c.json({ success: false, error: 'Invalid note ID' }, 400);
    }

    await strataService.deleteStrataNote(noteId);
    return c.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting strata note:', error);
    return c.json({ success: false, error: 'Failed to delete strata note' }, 500);
  }
};

// ============================================
// Strata Employees
// ============================================
export const assignEmployee = async (c: Context) => {
  try {
    const strataId = parseInt(c.req.param('id'));
    if (isNaN(strataId)) {
      return c.json({ success: false, error: 'Invalid strata ID' }, 400);
    }

    const body = await c.req.json();
    if (!body.profileId) {
      return c.json({ success: false, error: 'Profile ID is required' }, 400);
    }

    const assignment = await strataService.assignEmployeeToStrata({
      strataId,
      profileId: body.profileId,
      strataPosition: body.strataPosition?.trim()
    });

    return c.json({ success: true, data: assignment }, 201);
  } catch (error) {
    console.error('Error assigning employee:', error);
    return c.json({ success: false, error: 'Failed to assign employee' }, 500);
  }
};

export const updateEmployeePosition = async (c: Context) => {
  try {
    const strataEmployeeId = parseInt(c.req.param('employeeId'));
    if (isNaN(strataEmployeeId)) {
      return c.json({ success: false, error: 'Invalid assignment ID' }, 400);
    }

    const body = await c.req.json();
    const assignment = await strataService.updateStrataEmployeePosition(
      strataEmployeeId,
      body.strataPosition?.trim() || ''
    );

    return c.json({ success: true, data: assignment });
  } catch (error) {
    console.error('Error updating employee position:', error);
    return c.json({ success: false, error: 'Failed to update employee position' }, 500);
  }
};

export const removeEmployee = async (c: Context) => {
  try {
    const strataEmployeeId = parseInt(c.req.param('employeeId'));
    if (isNaN(strataEmployeeId)) {
      return c.json({ success: false, error: 'Invalid assignment ID' }, 400);
    }

    await strataService.removeEmployeeFromStrata(strataEmployeeId);
    return c.json({ success: true, message: 'Employee removed successfully' });
  } catch (error) {
    console.error('Error removing employee:', error);
    return c.json({ success: false, error: 'Failed to remove employee' }, 500);
  }
};

// ============================================
// Strata Services
// ============================================
export const addService = async (c: Context) => {
  try {
    const strataId = parseInt(c.req.param('id'));
    if (isNaN(strataId)) {
      return c.json({ success: false, error: 'Invalid strata ID' }, 400);
    }

    const body = await c.req.json();
    if (!body.serviceId) {
      return c.json({ success: false, error: 'Service ID is required' }, 400);
    }

    const strataService2 = await strataService.addServiceToStrata({
      strataId,
      serviceId: parseInt(body.serviceId)
    });

    return c.json({ success: true, data: strataService2 }, 201);
  } catch (error) {
    console.error('Error adding service to strata:', error);
    return c.json({ success: false, error: 'Failed to add service' }, 500);
  }
};

export const removeService = async (c: Context) => {
  try {
    const strataServiceId = parseInt(c.req.param('serviceId'));
    if (isNaN(strataServiceId)) {
      return c.json({ success: false, error: 'Invalid strata service ID' }, 400);
    }

    await strataService.removeServiceFromStrata(strataServiceId);
    return c.json({ success: true, message: 'Service removed successfully' });
  } catch (error) {
    console.error('Error removing service:', error);
    return c.json({ success: false, error: 'Failed to remove service' }, 500);
  }
};
