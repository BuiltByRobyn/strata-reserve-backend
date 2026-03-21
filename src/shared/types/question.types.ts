export interface SubQuestionDef {
  id?: number;
  label: string;  // e.g. 'a', 'b', 'c'
  text: string;
  type: 'textarea' | 'text' | 'number' | 'select' | 'multi_select' | 'boolean' | 'none_or_explain' | 'checkbox' | 'multiple_choice';
}

export interface QuestionDef {
  id?: number;
  text: string;
  category: string;
  type: 'textarea' | 'boolean' | 'none_or_explain' | 'checkbox' | 'multiple_choice' | 'text' | 'number' | 'select' | 'multi_select';
  propertyTypes: string[];
  informationText?: string;
  multipleChoiceOptions?: string[];
  subQuestions?: SubQuestionDef[];
}

export interface QuestionServiceInput {
  serviceId: number;
  sortOrder: number;
}

export interface MultipleChoiceOptionInput {
  optionText: string;
  sortOrder: number;
}

export interface CreateQuestionInput {
  parentQuestionId?: number | null;
  subLabel?: string | null;
  questionText: string;
  isRequired: boolean;
  informationText?: string | null;
  questionCategory: string;
  questionTypeId: number;
  serviceIds: QuestionServiceInput[];
  propertyTypeIds: number[];
  multipleChoiceOptions?: MultipleChoiceOptionInput[];
}

export interface SaveResponseInput {
  fileId: number;
  answeredByProfileId: string;
  questionId: number;
  propertyTypeId: number;
  responseText?: string | null;
  responseDate?: string | null;
  responseNumber?: number | null;
  responseBoolean?: boolean | null;
  multipleChoiceOptionId?: number | null;
}

export interface UpdateQuestionInput {
  parentQuestionId?: number | null;
  subLabel?: string | null;
  questionText?: string;
  isRequired?: boolean;
  informationText?: string | null;
  questionCategory?: string;
  questionTypeId?: number;
  serviceIds?: QuestionServiceInput[];
  propertyTypeIds?: number[];
  multipleChoiceOptions?: MultipleChoiceOptionInput[];
}
