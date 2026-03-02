export const profileSelectBrief = {
  id: true, firstName: true, lastName: true, displayName: true
} as const;

export const profileSelectWithEmail = {
  ...profileSelectBrief,
  email: true
} as const;

export const documentInclude = {
  documentType: { select: { documentTypeId: true, typeName: true } },
  serviceRequest: {
    select: {
      serviceRequestId: true,
      strata: { select: { strataId: true, strataPlan: true, complexName: true } }
    }
  },
  uploadedBy: { select: profileSelectBrief },
  reviewStatus: { select: { reviewStatusId: true, statusName: true } }
} as const;

export const documentIncludeCompact = {
  documentType: { select: { documentTypeId: true, typeName: true } },
  uploadedBy: { select: profileSelectBrief },
  reviewStatus: { select: { reviewStatusId: true, statusName: true } },
  propertyType: { select: { propertyTypeId: true, propertyTypeName: true } }
} as const;

export const serviceRequestIncludeList = {
  service: { select: { serviceId: true, serviceName: true } },
  strata: {
    select: {
      strataId: true,
      strataPlan: true,
      complexName: true,
      strataPropertyTypes: {
        select: {
          propertyTypeId: true,
          propertyType: { select: { propertyTypeId: true, propertyTypeName: true } }
        }
      }
    }
  },
  requestedBy: { select: profileSelectBrief },
  appointments: {
    where: { status: { not: 'Cancelled' } },
    select: { appointmentId: true, appointmentDate: true, status: true, timeSlotId: true },
    orderBy: { appointmentDate: 'asc' as const }
  },
  _count: {
    select: { questionResponses: true, serviceRequestDocuments: true, appointments: true }
  }
} as const;

export const strataSelectBrief = {
  strataId: true, strataPlan: true, complexName: true,
  company: { select: { companyId: true, companyName: true } }
} as const;

export const strataProfilesInclude = {
  include: {
    strata: {
      select: {
        strataId: true,
        strataPlan: true,
        complexName: true,
        company: { select: { companyId: true, companyName: true } },
        strataPropertyTypes: {
          select: { propertyTypeId: true, propertyType: { select: { propertyTypeId: true, propertyTypeName: true } } }
        }
      }
    },
    strataProfileSections: {
      include: { section: true }
    },
    strataProfilePropertyTypes: {
      include: { propertyType: true }
    }
  }
} as const;
