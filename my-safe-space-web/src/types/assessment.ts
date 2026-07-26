export type AssessmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type AssessmentType = 'INTERNAL' | 'EXTERNAL' | 'API';
export type QuestionType = 'RADIO' | 'TEXT';
export type ScoringMethod = 'TOTAL_SCORE' | 'AVERAGE_SCORE' | 'WEIGHTED_SCORE';

export interface QuestionChoice {
  id?: string;
  question_id?: string;
  choice_text: string;
  score: number;
  weight?: number;
  order_index: number;
}

export interface AssessmentQuestion {
  id?: string;
  assessment_id?: string;
  question_text: string;
  type: QuestionType;
  order_index: number;
  is_required?: boolean;
  help_text?: string;
  placeholder?: string;
  media_url?: string;
  choices?: QuestionChoice[];
}

export interface InterpretationRule {
  id?: string;
  assessment_id?: string;
  min_score: number;
  max_score: number;
  title: string;
  description?: string;
  recommendation?: string;
  color_code?: string;
}

export interface ImportedAssessmentPayload {
  title: string;
  description?: string;
  category?: string;
  type: AssessmentType;
  status: AssessmentStatus;
  scoring_method?: ScoringMethod;
  questions: Omit<AssessmentQuestion, 'assessment_id'>[];
  interpretation_rules?: Omit<InterpretationRule, 'assessment_id'>[];
}

export interface Assessment {
  id: string;
  title: string;
  description?: string;
  category?: string;
  cover_image_url?: string;
  estimated_time_mins?: number;
  version: number;
  parent_id?: string;
  type: AssessmentType;
  status: AssessmentStatus;
  scoring_method: ScoringMethod;
  external_url?: string;
  open_in_new_tab?: boolean;
  is_active_pre?: boolean;
  is_active_post?: boolean;
  questions?: AssessmentQuestion[];
  interpretation_rules?: InterpretationRule[];
  created_at?: string;
  updated_at?: string;
}
