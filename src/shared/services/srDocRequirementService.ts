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

export const createRequirement = async (data: {
  serviceRequestId: number;
  documentTypeId: number;
  propertyTypeId?: number | null;
  isRequired?: boolean;
  quantity?: number;
  notes?: string | null;
}) => {
  return prisma.serviceRequestDocumentRequirement.create({
    data: {
      serviceRequestId: data.serviceRequestId,
      documentTypeId: data.documentTypeId,
      propertyTypeId: data.propertyTypeId ?? null,
      isRequired: data.isRequired ?? true,
      quantity: data.quantity ?? 1,
      notes: data.notes ?? null,
    },
    include: requirementInclude,
  });
};

export const updateRequirement = async (id: number, data: {
  isRequired?: boolean;
  quantity?: number;
  notes?: string | null;
}) => {
  return prisma.serviceRequestDocumentRequirement.update({
    where: { srDocRequirementId: id },
    data,
    include: requirementInclude,
  });
};

export const deleteRequirement = async (id: number) => {
  return prisma.serviceRequestDocumentRequirement.delete({
    where: { srDocRequirementId: id },
  });
};

export const initializeFromGlobal = async (
  serviceRequestId: number,
  serviceId: number,
  propertyTypeIds: number[]
) => {
  const globalDocs = await prisma.requiredDocument.findMany({
    where: {
      serviceId,
      OR: [
        { appliesToAllTypes: true },
        { propertyTypeId: { in: propertyTypeIds } },
        { propertyTypeId: null },
      ],
    },
  });

  const createData = globalDocs.map(doc => ({
    serviceRequestId,
    documentTypeId: doc.documentTypeId,
    propertyTypeId: doc.propertyTypeId,
    isRequired: doc.isRequired,
    quantity: 1,
  }));

  if (createData.length > 0) {
    await prisma.serviceRequestDocumentRequirement.createMany({
      data: createData,
      skipDuplicates: true,
    });
  }

  return getRequirementsBySR(serviceRequestId);
};
