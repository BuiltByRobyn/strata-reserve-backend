import * as srDocRequirementService from '../../shared/services/srDocRequirementService';
import * as documentService from '../../shared/services/documentService';
import prisma from '../../shared/lib/prismaClient';
import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getRequirements = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'id');
  const requirements = await srDocRequirementService.getRequirementsBySR(serviceRequestId);
  return success(c, requirements);
}, 'Failed to fetch document requirements');

export const bulkSaveRequirements = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'id');
  const body = await c.req.json();
  const { requirements } = body;

  if (!Array.isArray(requirements)) {
    return error(c, 'Requirements must be an array', 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.serviceRequestDocumentRequirement.deleteMany({
      where: { serviceRequestId },
    });

    if (requirements.length > 0) {
      await tx.serviceRequestDocumentRequirement.createMany({
        data: requirements.map((r: { documentTypeId: number; propertyTypeId: number | null }) => ({
          serviceRequestId,
          documentTypeId: r.documentTypeId,
          propertyTypeId: r.propertyTypeId ?? null,
          isRequired: true,
          quantity: 1,
        })),
        skipDuplicates: true,
      });
    }
  });

  const updated = await srDocRequirementService.getRequirementsBySR(serviceRequestId);
  return success(c, updated);
}, 'Failed to save document requirements');

export const getDocumentsBySR = asyncHandler(async (c) => {
  const serviceRequestId = parseIntParam(c, 'id');
  const documents = await documentService.getDocumentsByServiceRequest(serviceRequestId);
  return success(c, documents);
}, 'Failed to fetch documents for service request');
