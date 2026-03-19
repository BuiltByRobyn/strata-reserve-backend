export type NaStatusValue = 'not_available' | 'not_applicable';

export interface SetNaStatusInput {
  status: NaStatusValue;
}

export interface BatchDocumentReviewItemInput {
  fnDocRequirementId: number;
  reviewStatusId: number;
  notes?: string;
}

export interface BatchDocumentReviewInput {
  items: BatchDocumentReviewItemInput[];
}
