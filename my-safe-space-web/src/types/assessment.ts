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
  dimension?: string;
  choices?: QuestionChoice[];
}

export interface InterpretationRule {
  id?: string;
  assessment_id?: string;
  dimension?: string;
  min_score: number;
  max_score: number;
  title: string;
  description?: string;
  recommendation?: string;
  color_code?: string;
  severity?: string;
}

export interface OnboardingInfo {
  has_completed_onboarding: boolean;
  baseline_score: number | null;
  baseline_at: string | null;
  last_assessed_at: string | null;
  last_score: number | null;
  last_severity: 'normal' | 'moderate' | 'severe' | 'critical' | string;
}

export interface DimensionResult {
  dimension: string;
  score: number;
  max_score: number;
  severity: string;
  title: string;
  description?: string;
  recommendation?: string;
  color_code?: string;
}

export interface SubmitAssessmentPayload {
  assessment_id: string;
  total_score: number;
  max_score?: number;
  severity?: string;
  rule_title?: string;
  rule_color?: string;
  answers?: Record<string, unknown>;
  dimensions?: DimensionResult[];
}

export interface AssessmentSubmission {
  id: string;
  user_id?: string;
  assessment_id: string;
  assessment_code?: string;
  assessment_title?: string;
  total_score: number;
  max_score?: number;
  severity?: string;
  rule_title?: string;
  rule_color?: string;
  answers?: Record<string, unknown>;
  dimensions?: DimensionResult[];
  created_at: string;
}

export interface MyAssessmentHistory {
  status: OnboardingInfo | null;
  submissions: AssessmentSubmission[];
}

export interface ImportedAssessmentPayload {
  title: string;
  description?: string;
  category?: string;
  type: AssessmentType;
  status: AssessmentStatus;
  scoring_method?: ScoringMethod;
  code?: string;
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
  code?: string;
  score_multiplier?: number;
  is_active_pre?: boolean;
  is_active_post?: boolean;
  questions?: AssessmentQuestion[];
  interpretation_rules?: InterpretationRule[];
  created_at?: string;
  updated_at?: string;
}
