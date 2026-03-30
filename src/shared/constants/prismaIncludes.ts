export const requirementInclude = {
  documentType: { select: { documentTypeId: true, typeName: true } },
  propertyType: { select: { propertyTypeId: true, propertyTypeName: true } },
  naStatus: { select: { status: true, setAt: true } },
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
} as const;

export const profileSelectBrief = {
  id: true, firstName: true, lastName: true, displayName: true
} as const;

export const profileSelectWithEmail = {
  ...profileSelectBrief,
  email: true
} as const;

export const documentInclude = {
  documentType: { select: { documentTypeId: true, typeName: true } },
  fileNumber: {
    select: {
      fileId: true,
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

export const fileNumberIncludeList = {
  service: { select: { serviceId: true, serviceName: true } },
  appointmentOfferType: { select: { isDraftMeeting: true } },
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
    select: {
      appointmentId: true,
      appointmentDate: true,
      status: true,
      timeSlotId: true,
      appointmentType: { select: { isDraftMeeting: true } }
    },
    orderBy: { appointmentDate: 'asc' as const }
  },
  _count: {
    select: { questionResponses: true, fileNumberDocuments: true, appointments: true }
  }
} as const;

export const strataSelectBrief = {
  strataId: true, strataPlan: true, complexName: true
} as const;

export const strataProfilesInclude = {
  include: {
    strata: {
      select: {
        strataId: true,
        strataPlan: true,
        complexName: true,
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
