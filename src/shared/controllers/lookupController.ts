// Lookup Controller - Handles requests for lookup/reference data
import { Context } from 'hono';
import * as lookupService from '../../services/lookupService';

// ============================================
// User Types
// ============================================
export const getUserTypes = async (c: Context) => {
  try {
    const userTypes = await lookupService.getUserTypes();
    return c.json({ success: true, data: userTypes });
  } catch (error) {
    console.error('Error fetching user types:', error);
    return c.json({ success: false, error: 'Failed to fetch user types' }, 500);
  }
};

// ============================================
// Legal Types
// ============================================
export const getLegalTypes = async (c: Context) => {
  try {
    const legalTypes = await lookupService.getLegalTypes();
    return c.json({ success: true, data: legalTypes });
  } catch (error) {
    console.error('Error fetching legal types:', error);
    return c.json({ success: false, error: 'Failed to fetch legal types' }, 500);
  }
};

// ============================================
// Property Types
// ============================================
export const getPropertyTypes = async (c: Context) => {
  try {
    const propertyTypes = await lookupService.getPropertyTypes();
    return c.json({ success: true, data: propertyTypes });
  } catch (error) {
    console.error('Error fetching property types:', error);
    return c.json({ success: false, error: 'Failed to fetch property types' }, 500);
  }
};

// ============================================
// Services
// ============================================
export const getServices = async (c: Context) => {
  try {
    const services = await lookupService.getServices();
    return c.json({ success: true, data: services });
  } catch (error) {
    console.error('Error fetching services:', error);
    return c.json({ success: false, error: 'Failed to fetch services' }, 500);
  }
};

export const getDocumentTypes = async (c: Context) => {
  try {
    const documentTypes = await lookupService.getDocumentTypes();
    return c.json({ success: true, data: documentTypes });
  } catch (error) {
    console.error('Error fetching document types:', error);
    return c.json({ success: false, error: 'Failed to fetch document types' }, 500);
  }
};

export const getReviewStatuses = async (c: Context) => {
  try {
    const reviewStatuses = await lookupService.getReviewStatuses();
    return c.json({ success: true, data: reviewStatuses });
  } catch (error) {
    console.error('Error fetching review statuses:', error);
    return c.json({ success: false, error: 'Failed to fetch review statuses' }, 500);
  }
};
