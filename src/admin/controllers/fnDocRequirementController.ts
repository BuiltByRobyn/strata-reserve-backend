import * as fnDocRequirementService from '../../shared/services/fnDocRequirementService';
import * as documentService from '../../shared/services/documentService';
import prisma from '../../shared/lib/prismaClient';
import { success, error, asyncHandler } from '../../shared/helpers/responseHelper';
import { parseIntParam } from '../../shared/helpers/parseParams';

export const getRequirements = asyncHandler(async (c) => {
  const fileNumberId = parseIntParam(c, 'id');
  const requirements = await fnDocRequirementService.getRequirementsBySR(fileNumberId);
  return success(c, requirements);
}, 'Failed to fetch document requirements');

export const bulkSaveRequirements = asyncHandler(async (c) => {
  const fileNumberId = parseIntParam(c, 'id');
  const body = await c.req.json();
  const { requirements } = body;

  if (!Array.isArray(requirements)) {
    return error(c, 'Requirements must be an array', 400);
  }

  await prisma.$transaction(async (tx) => {
    await tx.fileNumberDocumentRequirement.deleteMany({
      where: { fileNumberId },
    });

    if (requirements.length > 0) {
      await tx.fileNumberDocumentRequirement.createMany({
        data: requirements.map((r: { documentTypeId: number; propertyTypeId: number | null }) => ({
          fileNumberId,
          documentTypeId: r.documentTypeId,
          propertyTypeId: r.propertyTypeId ?? null,
          isRequired: true,
          quantity: 1,
        })),
        skipDuplicates: true,
      });
    }
  });

  const updated = await fnDocRequirementService.getRequirementsBySR(fileNumberId);
  return success(c, updated);
}, 'Failed to save document requirements');

export const addRequirement = asyncHandler(async (c) => {
  const fileNumberId = parseIntParam(c, 'id');
  const { documentTypeId, propertyTypeId } = await c.req.json();

  await prisma.fileNumberDocumentRequirement.upsert({
    where: {
      fileNumberId_documentTypeId_propertyTypeId: {
        fileNumberId,
        documentTypeId,
        propertyTypeId: propertyTypeId ?? null,
      }
    },
    update: {},
    create: {
      fileNumberId,
      documentTypeId,
      propertyTypeId: propertyTypeId ?? null,
      isRequired: true,
      quantity: 1,
    },
  });

  return success(c, { added: true });
}, 'Failed to add document requirement');

export const getDocumentsBySR = asyncHandler(async (c) => {
  const fileNumberId = parseIntParam(c, 'id');
  const documents = await documentService.getDocumentsByFileNumber(fileNumberId);
  return success(c, documents);
}, 'Failed to fetch documents for file number');
