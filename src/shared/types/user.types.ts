export interface StrataAssociationInput {
  strataId: number;
  strataPosition?: string;
  sectionIds?: number[];
  propertyTypeIds?: number[];
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userTypeId: number;
  companyName?: string;
  strataAssociations: StrataAssociationInput[];
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userTypeId?: number;
  companyName?: string;
  strataAssociations?: StrataAssociationInput[];
}
