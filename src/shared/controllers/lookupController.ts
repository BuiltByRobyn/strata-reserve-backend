import * as lookupService from '../services/lookupService';
import { success } from '../helpers/responseHelper';
import { asyncHandler } from '../helpers/responseHelper';

export const getUserTypes = asyncHandler(async (c) => {
  const userTypes = await lookupService.getUserTypes();
  return success(c, userTypes);
}, 'Failed to fetch user types');

export const getLegalTypes = asyncHandler(async (c) => {
  const legalTypes = await lookupService.getLegalTypes();
  return success(c, legalTypes);
}, 'Failed to fetch legal types');

export const getPropertyTypes = asyncHandler(async (c) => {
  const propertyTypes = await lookupService.getPropertyTypes();
  return success(c, propertyTypes);
}, 'Failed to fetch property types');

export const getServices = asyncHandler(async (c) => {
  const services = await lookupService.getServices();
  return success(c, services);
}, 'Failed to fetch services');

export const getDocumentTypes = asyncHandler(async (c) => {
  const documentTypes = await lookupService.getDocumentTypes();
  return success(c, documentTypes);
}, 'Failed to fetch document types');

export const getReviewStatuses = asyncHandler(async (c) => {
  const reviewStatuses = await lookupService.getReviewStatuses();
  return success(c, reviewStatuses);
}, 'Failed to fetch review statuses');

export const getSections = asyncHandler(async (c) => {
  const sections = await lookupService.getSections();
  return success(c, sections);
}, 'Failed to fetch sections');

export const getQuestionTypes = asyncHandler(async (c) => {
  const questionTypes = await lookupService.getQuestionTypes();
  return success(c, questionTypes);
}, 'Failed to fetch question types');

export const getLocations = asyncHandler(async (c) => {
  const locations = await lookupService.getLocations();
  return success(c, locations);
}, 'Failed to fetch locations');

export const getAppointmentTypes = asyncHandler(async (c) => {
  const appointmentTypes = await lookupService.getAppointmentTypes();
  return success(c, appointmentTypes);
}, 'Failed to fetch appointment types');
