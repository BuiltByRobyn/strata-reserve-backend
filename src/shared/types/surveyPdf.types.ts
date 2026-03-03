export interface SurveyPdfMeta {
  serviceRequestId: number;
  strataPlan?: string | null;
  complexName?: string | null;
  serviceName?: string | null;
  status?: string | null;
  requestDate?: string | null;
  generatedAtIso?: string;
}

export interface FlatSurveyQuestion {
  srSurveyQuestionId: number;
  propertyTypeId: number;
  propertyTypeName: string;
  questionId: number;
  parentQuestionId: number | null;
  subLabel: string | null;
  questionText: string;
  isRequired: boolean;
  informationText: string | null;
  questionCategory: string;
  questionType: string;
  sortOrder: number;
  multipleChoiceOptions: Array<{ optionId: number; optionText: string; sortOrder: number }>;
}

export interface ActiveSurveyResponse {
  questionId: number;
  propertyTypeId: number;
  responseText: string | null;
  responseDate: string | null;
  responseNumber: number | null;
  responseBoolean: boolean | null;
  multipleChoiceOptionId: number | null;
}
