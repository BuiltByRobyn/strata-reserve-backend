export interface NewStrataEmailParams {
  strataPlan: string;
  complexName?: string;
  town?: string;
  province?: string;
}

export interface DocumentReviewReadyEmailParams {
  to: string;
  firstName: string | null;
  strataName: string;
  fileNumber: string;
}

export interface DocumentReviewResultEmailParams {
  to: string;
  firstName: string | null;
  strataName: string;
  fileNumber: string;
  items: Array<{
    documentTypeName: string;
    versionLabel: string;
    propertyTypeName: string | null;
    statusName: string;
    notes: string | null;
  }>;
}
