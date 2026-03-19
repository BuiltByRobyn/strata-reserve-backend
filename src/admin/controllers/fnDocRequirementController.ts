import * as fnDocRequirementService from '../../shared/services/fnDocRequirementService';
import * as documentService from '../../shared/services/documentService';
import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getRequirements = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'id');
  const requirements = await fnDocRequirementService.getRequirementsBySR(fileId);
  return success(c, requirements);
}, 'Failed to fetch document requirements');

export const bulkSaveRequirements = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'id');
  const body = await c.req.json();
  const { requirements } = body;

  if (!Array.isArray(requirements)) {
    return error(c, 'Requirements must be an array', 400);
  }

  await fnDocRequirementService.bulkSaveRequirements(fileId, requirements);
  const updated = await fnDocRequirementService.getRequirementsBySR(fileId);
  return success(c, updated);
}, 'Failed to save document requirements');

export const addRequirementVersion = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'id');
  const { documentTypeId, propertyTypeId, versionLabel } = await c.req.json();

  if (!documentTypeId) return error(c, 'documentTypeId is required', 400);

  const req = await fnDocRequirementService.addRequirementVersion(
    fileId,
    documentTypeId,
    propertyTypeId ?? null,
    versionLabel ?? ''
  );
  return success(c, req);
}, 'Failed to add requirement version');

export const removeRequirementVersion = asyncHandler(async (c) => {
  const reqId = parseIntParam(c, 'reqId');
  await fnDocRequirementService.removeRequirementVersion(reqId);
  return success(c, { removed: true });
}, 'Failed to remove requirement version');

export const getDocumentsBySR = asyncHandler(async (c) => {
  const fileId = parseIntParam(c, 'id');
  const documents = await documentService.getDocumentsByFileNumber(fileId);
  return success(c, documents);
}, 'Failed to fetch documents for file number');
