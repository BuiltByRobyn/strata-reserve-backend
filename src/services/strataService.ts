// Strata Service - CRUD operations for strata properties
import prisma from '../lib/prismaClient';

export interface CreateStrataInput {
  strataPlan?: string;
  complexName?: string;
  unitNumber?: string;
  streetName?: string;
  town?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  website?: string;
  legalTypeId?: number;
  propertyTypeId?: number;
  companyId?: number;
}

export interface UpdateStrataInput extends Partial<CreateStrataInput> {}

export interface CreateStrataProfileInput {
  strataId: number;
  profileId: string;
  strataPosition?: string;
}

export interface CreateStrataServiceInput {
  strataId: number;
  serviceId: number;
}

export interface CreateStrataNoteInput {
  strataId: number;
  noteMessage: string;
  createdByProfileId?: string;
  createdByUser?: string;
}

// ============================================
// Get All Stratas
// ============================================
export const getStratas = async () => {
  return prisma.strata.findMany({
    orderBy: { strataPlan: 'asc' },
    include: {
      company: { select: { companyId: true, companyName: true } },
      legalType: { select: { legalTypeId: true, legalTypeName: true } },
      propertyType: { select: { propertyTypeId: true, propertyTypeName: true } },
      _count: {
        select: { strataNotes: true, strataProfiles: true, strataServices: true }
      }
    }
  });
};

// ============================================
// Get Strata by ID
// ============================================
export const getStrataById = async (id: number) => {
  return prisma.strata.findUnique({
    where: { strataId: id },
    include: {
      company: true,
      legalType: true,
      propertyType: true,
      strataNotes: {
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, displayName: true }
          }
        }
      },
      strataProfiles: {
        include: {
          profile: {
            select: { id: true, firstName: true, lastName: true, displayName: true, email: true }
          }
        }
      },
      strataServices: {
        include: {
          service: { select: { serviceId: true, serviceName: true, serviceDescription: true } }
        }
      }
    }
  });
};

// ============================================
// Create Strata
// ============================================
export const createStrata = async (data: CreateStrataInput) => {
  return prisma.strata.create({
    data: {
      strataPlan: data.strataPlan,
      complexName: data.complexName,
      unitNumber: data.unitNumber,
      streetName: data.streetName,
      town: data.town,
      province: data.province,
      postalCode: data.postalCode,
      country: data.country || 'Canada',
      website: data.website,
      legalTypeId: data.legalTypeId,
      propertyTypeId: data.propertyTypeId,
      companyId: data.companyId
    }
  });
};

// ============================================
// Update Strata
// ============================================
export const updateStrata = async (id: number, data: UpdateStrataInput) => {
  return prisma.strata.update({
    where: { strataId: id },
    data
  });
};

// ============================================
// Delete Strata
// ============================================
export const deleteStrata = async (id: number) => {
  return prisma.strata.delete({
    where: { strataId: id }
  });
};

// ============================================
// Strata Notes
// ============================================
export const addStrataNote = async (data: CreateStrataNoteInput) => {
  return prisma.strataNotes.create({
    data: {
      strataId: data.strataId,
      noteMessage: data.noteMessage,
      createdByProfileId: data.createdByProfileId,
      createdByUser: data.createdByUser
    }
  });
};

export const deleteStrataNote = async (noteId: number) => {
  return prisma.strataNotes.delete({
    where: { noteId }
  });
};

// ============================================
// Strata Employees (Assignments)
// ============================================
export const assignEmployeeToStrata = async (data: CreateStrataProfileInput) => {
  return prisma.strataProfile.create({
    data: {
      strataId: data.strataId,
      profileId: data.profileId,
      strataPosition: data.strataPosition
    }
  });
};

export const updateStrataProfilePosition = async (strataProfileId: number, position: string) => {
  return prisma.strataProfile.update({
    where: { strataProfileId },
    data: { strataPosition: position }
  });
};

export const removeProfileFromStrata = async (strataProfileId: number) => {
  return prisma.strataProfile.delete({
    where: { strataProfileId }
  });
};

export const getStratasByEmployee = async (profileId: string) => {
  return prisma.strataProfile.findMany({
    where: { profileId },
    include: {
      strata: {
        include: {
          company: { select: { companyId: true, companyName: true } }
        }
      }
    }
  });
};

// ============================================
// Strata Services
// ============================================
export const addServiceToStrata = async (data: CreateStrataServiceInput) => {
  return prisma.strataService.create({
    data: {
      strataId: data.strataId,
      serviceId: data.serviceId
    }
  });
};

export const removeServiceFromStrata = async (strataServiceId: number) => {
  return prisma.strataService.delete({
    where: { strataServiceId }
  });
};

// ============================================
// Search Stratas
// ============================================
export const searchStratas = async (query: string) => {
  return prisma.strata.findMany({
    where: {
      OR: [
        { strataPlan: { contains: query, mode: 'insensitive' } },
        { complexName: { contains: query, mode: 'insensitive' } },
        { town: { contains: query, mode: 'insensitive' } }
      ]
    },
    include: {
      company: { select: { companyId: true, companyName: true } }
    },
    orderBy: { strataPlan: 'asc' }
  });
};
