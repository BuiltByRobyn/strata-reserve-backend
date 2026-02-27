import prisma from '../lib/prismaClient';

const requirementInclude = {
  documentType: { select: { documentTypeId: true, typeName: true } },
  propertyType: { select: { propertyTypeId: true, propertyTypeName: true } },
};

export const getRequirementsBySR = async (serviceRequestId: number) => {
  return prisma.serviceRequestDocumentRequirement.findMany({
    where: { serviceRequestId },
    include: requirementInclude,
    orderBy: { srDocRequirementId: 'asc' },
  });
};
