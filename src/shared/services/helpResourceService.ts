import prisma from '../lib/prismaClient';

export const getResourcesByAudience = async (audience: string) => {
  return prisma.helpResource.findMany({
    where: {
      audience,
      isActive: true,
    },
    orderBy: { sortOrder: 'asc' },
  });
};

export const getResourceById = async (id: number, audience?: string) => {
  return prisma.helpResource.findFirst({
    where: {
      helpResourceId: id,
      isActive: true,
      ...(audience && { audience }),
    },
  });
};
