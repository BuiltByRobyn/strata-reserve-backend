export interface QuestionServiceInput {
  serviceId: number;
  sortOrder: number;
}

export interface MultipleChoiceOptionInput {
  optionText: string;
  sortOrder: number;
}

export interface CreateQuestionInput {
  questionText: string;
  isRequired: boolean;
  informationText?: string | null;
  questionCategory: string;
  questionTypeId: number;
  serviceIds: QuestionServiceInput[];
  propertyTypeIds: number[];
  legalTypeIds: number[];
  sectionIds: number[];
  multipleChoiceOptions?: MultipleChoiceOptionInput[];
}

export interface UpdateQuestionInput {
  questionText?: string;
  isRequired?: boolean;
  informationText?: string | null;
  questionCategory?: string;
  questionTypeId?: number;
  serviceIds?: QuestionServiceInput[];
  propertyTypeIds?: number[];
  legalTypeIds?: number[];
  sectionIds?: number[];
  multipleChoiceOptions?: MultipleChoiceOptionInput[];
}
