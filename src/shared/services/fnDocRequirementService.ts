import prisma from '../lib/prismaClient';

const requirementInclude = {
  documentType: { select: { documentTypeId: true, typeName: true } },
  propertyType: { select: { propertyTypeId: true, propertyTypeName: true } },
};

export const getRequirementsBySR = async (fileNumberId: number) => {
  return prisma.fileNumberDocumentRequirement.findMany({
    where: { fileNumberId },
    include: requirementInclude,
    orderBy: { fnDocRequirementId: 'asc' },
  });
};
