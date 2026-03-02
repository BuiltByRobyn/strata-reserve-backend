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
  propertyTypeId?: number | null;
  companyId?: number;
  fiscalYearEnd?: string | null;
  locationId?: number | null;
  sectionIds?: number[];
  propertyTypeIds?: number[];
}

export interface UpdateStrataInput extends Partial<CreateStrataInput> {}

export interface CreateStrataProfileInput {
  strataId: number;
  profileId: string;
  strataPosition?: string;
  sectionIds?: number[];
}


export interface CreateStrataNoteInput {
  strataId: number;
  noteMessage: string;
  createdByProfileId?: string;
  createdByUser?: string;
}
