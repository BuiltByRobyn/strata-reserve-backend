export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  userTypeId: number;
  companyName?: string;
  strataAssociations: Array<{
    strataId: number;
    strataPosition?: string;
  }>;
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  userTypeId?: number;
  companyName?: string;
  strataAssociations?: Array<{
    strataId: number;
    strataPosition?: string;
  }>;
}
