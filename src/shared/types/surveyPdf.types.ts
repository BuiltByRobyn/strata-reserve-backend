export interface SurveyPdfMeta {
  fileId: number;
  strataPlan?: string | null;
  complexName?: string | null;
  serviceName?: string | null;
  fileNumber?: string | null;
  requestDate?: string | null;
  generatedAtIso?: string;
}

export interface FlatSurveyQuestion {
  fnSurveyQuestionId: number;
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
  parentQuestionId: number | null;
  responseText: string | null;
  responseDate: string | null;
  responseNumber: number | null;
  responseBoolean: boolean | null;
  multipleChoiceOptionId: number | null;
}
