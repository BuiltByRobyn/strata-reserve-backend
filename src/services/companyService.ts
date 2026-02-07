// Company Service - CRUD operations for companies
import prisma from '../lib/prismaClient';

export interface CreateCompanyInput {
  companyName: string;
  companyTelephone?: string;
}

export interface UpdateCompanyInput {
  companyName?: string;
  companyTelephone?: string | null;
}

// ============================================
// Get All Companies
// ============================================
export const getCompanies = async () => {
  return prisma.company.findMany({
    orderBy: { companyName: 'asc' },
    include: {
      _count: {
        select: { stratas: true }
      }
    }
  });
};

// ============================================
// Get Company by ID
// ============================================
export const getCompanyById = async (id: number) => {
  return prisma.company.findUnique({
    where: { companyId: id },
    include: {
      stratas: {
        select: {
          strataId: true,
          strataPlan: true,
          complexName: true,
          town: true
        }
      }
    }
  });
};

// ============================================
// Create Company
// ============================================
export const createCompany = async (data: CreateCompanyInput) => {
  return prisma.company.create({
    data: {
      companyName: data.companyName,
      companyTelephone: data.companyTelephone
    }
  });
};

// ============================================
// Update Company
// ============================================
export const updateCompany = async (id: number, data: UpdateCompanyInput) => {
  return prisma.company.update({
    where: { companyId: id },
    data: {
      ...(data.companyName !== undefined && { companyName: data.companyName }),
      ...(data.companyTelephone !== undefined && { companyTelephone: data.companyTelephone })
    }
  });
};

// ============================================
// Delete Company
// ============================================
export const deleteCompany = async (id: number) => {
  return prisma.company.delete({
    where: { companyId: id }
  });
};

// ============================================
// Search Companies
// ============================================
export const searchCompanies = async (query: string) => {
  return prisma.company.findMany({
    where: {
      companyName: {
        contains: query,
        mode: 'insensitive'
      }
    },
    orderBy: { companyName: 'asc' }
  });
};
