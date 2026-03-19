import prisma from '../lib/prismaClient';

const requirementInclude = {
  documentType: { select: { documentTypeId: true, typeName: true } },
  propertyType: { select: { propertyTypeId: true, propertyTypeName: true } },
  naStatus: { select: { status: true } },
  fileNumberDocuments: {
    orderBy: { uploadedAt: 'desc' as const },
    take: 1,
    select: {
      fileNumberDocumentId: true,
      fileName: true,
      filePath: true,
      uploadedAt: true,
      fnDocRequirementId: true,
    },
  },
};

export const getRequirementsBySR = async (fileId: number) => {
  return prisma.fileNumberDocumentRequirement.findMany({
    where: { fileId },
    include: requirementInclude,
    orderBy: { fnDocRequirementId: 'asc' },
  });
};

export const bulkSaveRequirements = async (
  fileId: number,
  requirements: Array<{ documentTypeId: number; propertyTypeId: number | null; versionLabel?: string }>
) => {
  await prisma.$transaction(async (tx) => {
    await tx.fileNumberDocumentRequirement.deleteMany({ where: { fileId } });
    if (requirements.length > 0) {
      await tx.fileNumberDocumentRequirement.createMany({
        data: requirements.map((r) => ({
          fileId,
          documentTypeId: r.documentTypeId,
          propertyTypeId: r.propertyTypeId ?? null,
          versionLabel: r.versionLabel ?? '',
        })),
        skipDuplicates: true,
      });
    }
  });
};

export const addRequirementVersion = async (
  fileId: number,
  documentTypeId: number,
  propertyTypeId: number | null,
  versionLabel: string
) => {
  return prisma.fileNumberDocumentRequirement.create({
    data: { fileId, documentTypeId, propertyTypeId: propertyTypeId ?? null, versionLabel },
    include: requirementInclude,
  });
};

export const removeRequirementVersion = async (fnDocRequirementId: number) => {
  return prisma.fileNumberDocumentRequirement.delete({
    where: { fnDocRequirementId },
  });
};

export const checkAllRequirementsAnswered = async (fileId: number): Promise<boolean> => {
  const requirements = await prisma.fileNumberDocumentRequirement.findMany({
    where: { fileId },
    select: {
      fnDocRequirementId: true,
      fileNumberDocuments: { select: { fileNumberDocumentId: true }, take: 1 },
      naStatus: { select: { naStatusId: true } },
    },
  });

  if (requirements.length === 0) return false;
  return requirements.every((r) => r.fileNumberDocuments.length > 0 || r.naStatus !== null);
};
