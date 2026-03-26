export interface CreateFileNumberInput {
  serviceId: number;
  strataId: number;
  requestedByProfileId: string;
  fileNumber: string;
  notes?: string;
}

export interface UpdateFileNumberInput {
  fileNumber: string;
}
