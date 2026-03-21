import prisma from '../lib/prismaClient';
import { requirementInclude } from '../constants/prismaIncludes';

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
    const existing = await tx.fileNumberDocumentRequirement.findMany({
      where: { fileId },
      include: {
        fileNumberDocuments: { select: { fileNumberDocumentId: true }, take: 1 },
      },
      orderBy: { fnDocRequirementId: 'asc' },
    });

    type ExistingReq = (typeof existing)[0];
    const existingGroups = new Map<string, ExistingReq[]>();
    for (const req of existing) {
      const key = `${req.documentTypeId}_${req.propertyTypeId ?? 'null'}`;
      if (!existingGroups.has(key)) existingGroups.set(key, []);
      existingGroups.get(key)!.push(req);
    }

    const newGroups = new Map<string, { documentTypeId: number; propertyTypeId: number | null; labels: string[] }>();
    for (const r of requirements) {
      const key = `${r.documentTypeId}_${r.propertyTypeId ?? 'null'}`;
      if (!newGroups.has(key)) {
        newGroups.set(key, { documentTypeId: r.documentTypeId, propertyTypeId: r.propertyTypeId ?? null, labels: [] });
      }
      newGroups.get(key)!.labels.push(r.versionLabel ?? '');
    }

    const handledKeys = new Set<string>();

    for (const [key, { documentTypeId, propertyTypeId, labels }] of newGroups.entries()) {
      handledKeys.add(key);
      const existingReqs = existingGroups.get(key) ?? [];

      // Sort: slots with uploads first (so uploaded docs stay in slot 1)
      existingReqs.sort((a, b) => {
        const aHas = a.fileNumberDocuments.length > 0 ? 0 : 1;
        const bHas = b.fileNumberDocuments.length > 0 ? 0 : 1;
        if (aHas !== bHas) return aHas - bHas;
        return a.fnDocRequirementId - b.fnDocRequirementId;
      });

      // Update existing slots with new labels
      for (let i = 0; i < Math.min(existingReqs.length, labels.length); i++) {
        if (existingReqs[i].versionLabel !== labels[i]) {
          await tx.fileNumberDocumentRequirement.update({
            where: { fnDocRequirementId: existingReqs[i].fnDocRequirementId },
            data: { versionLabel: labels[i] },
          });
        }
      }

      // Create new slots
      for (let i = existingReqs.length; i < labels.length; i++) {
        await tx.fileNumberDocumentRequirement.create({
          data: { fileId, documentTypeId, propertyTypeId, versionLabel: labels[i] },
        });
      }

      // Delete excess slots (frontend validated no uploads exist for these)
      for (let i = labels.length; i < existingReqs.length; i++) {
        await tx.fileNumberDocumentRequirement.delete({
          where: { fnDocRequirementId: existingReqs[i].fnDocRequirementId },
        });
      }
    }

    // Delete groups completely removed from config (frontend validated no uploads exist)
    for (const [key, existingReqs] of existingGroups.entries()) {
      if (!handledKeys.has(key)) {
        for (const req of existingReqs) {
          await tx.fileNumberDocumentRequirement.delete({
            where: { fnDocRequirementId: req.fnDocRequirementId },
          });
        }
      }
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
