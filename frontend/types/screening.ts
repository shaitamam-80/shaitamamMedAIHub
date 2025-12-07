/**
 * Type definitions for Smart Screener module
 */

// ============================================================================
// Criteria Library Types
// ============================================================================

export interface CriteriaCode {
  code: string;
  label: string;
  description: string;
  exclude: boolean;
  query_filter?: string;
}

export interface CriteriaLibrary {
  population: Record<string, CriteriaCode>;
  intervention: Record<string, CriteriaCode>;
  comparator: Record<string, CriteriaCode>;
  outcome: Record<string, CriteriaCode>;
  study_design: Record<string, CriteriaCode>;
}

// ============================================================================
// Criteria Configuration Types
// ============================================================================

export interface PopulationCriteria {
  codes: string[];
  custom_text?: string;
}

export interface StudyDesignCriteria {
  inclusion_codes: string[];
  exclusion_codes: string[];
}

export interface CriteriaConfig {
  review_type: 'systematic' | 'scoping' | 'quick';
  date_range_start?: number;
  date_range_end?: number;
  languages: string[];
  population: PopulationCriteria;
  study_design: StudyDesignCriteria;
  custom_inclusion?: string;
  custom_exclusion?: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface InitCriteriaRequest {
  project_id: string;
  review_type: string;
  filters: CriteriaConfig;
}

export interface InitCriteriaResponse {
  id: string;
  project_id: string;
  review_type: string;
  filters: CriteriaConfig;
  created_at: string;
}

export interface ProcessPmidsRequest {
  project_id: string;
  pmids: string[];
  criteria_config: CriteriaConfig;
}

export interface ArticleDecision {
  pmid: string;
  title: string;
  status: 'included' | 'excluded' | 'unclear';
  source: 'rule_engine' | 'ai_model';
  reason: string;
  evidence_quote?: string;
  study_type_classification?: string;
}

export interface ScreeningResult {
  processed: number;
  included: number;
  excluded: number;
  details: ArticleDecision[];
}

// ============================================================================
// UI State Types
// ============================================================================

export interface WizardState {
  currentStep: number;
  projectId: string;
  frameworkData?: Record<string, string>;
  reviewType?: 'systematic' | 'scoping' | 'quick';
  criteriaConfig?: CriteriaConfig;
  pmids?: string[];
  result?: ScreeningResult;
}

export interface ReviewTypeInfo {
  id: 'systematic' | 'scoping' | 'quick';
  name: string;
  description: string;
  icon: string;
  characteristics: string[];
  recommended_for: string;
}
