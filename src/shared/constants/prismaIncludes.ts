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
  reviewStatus: { select: { reviewStatusId: true, statusName: true } }
} as const;

export const serviceRequestIncludeList = {
  service: { select: { serviceId: true, serviceName: true } },
  strata: { select: { strataId: true, strataPlan: true, complexName: true } },
  requestedBy: { select: profileSelectBrief },
  _count: {
    select: { questionResponses: true, serviceRequestDocuments: true, appointments: true }
  }
} as const;

export const strataSelectBrief = {
  strataId: true, strataPlan: true, complexName: true,
  company: { select: { companyId: true, companyName: true } }
} as const;
