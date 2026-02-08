export interface CreateCompanyInput {
  companyName: string;
  companyTelephone?: string;
}

export interface UpdateCompanyInput {
  companyName?: string;
  companyTelephone?: string | null;
}
