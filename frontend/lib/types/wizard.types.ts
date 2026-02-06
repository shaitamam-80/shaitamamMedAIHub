/**
 * Define Tool v3.0 - Wizard Types
 * ================================
 *
 * Type definitions for the wizard-based research question formulation interface.
 * Supports all 17+ research frameworks with dynamic component extraction.
 */

// ============================================================================
// Framework Types
// ============================================================================

/**
 * Framework component value with metadata
 */
export interface FrameworkComponent {
  key: string;                    // Component key (e.g., "P", "I", "C", "O")
  label: string;                  // Display label (e.g., "Population")
  value: string;                  // User-provided value
  isRequired: boolean;            // Whether this component is required
  placeholder?: string;           // Placeholder text for input
  helpText?: string;              // Additional guidance
}

/**
 * Framework schema definition (from backend)
 */
export interface FrameworkSchema {
  name: string;                   // e.g., "PICO"
  description: string;            // Full name (e.g., "Population, Intervention, Comparison, Outcome")
  use_case: string;               // When to use this framework
  components: string[];           // Component keys (e.g., ["P", "I", "C", "O"])
  labels: Record<string, string>; // Component labels
  trigger_words?: string[];       // Keywords for detection (reference only)
}

/**
 * All supported framework types
 */
export type FrameworkType =
  // PICO family
  | "PICO" | "PICOT" | "PICOS" | "PICOC" | "PICOTS"
  // JBI standards
  | "CoCoPop" | "PEO" | "PECO" | "PFO" | "PIRD" | "PCC" | "PICo"
  // Qualitative
  | "SPIDER" | "SPICE"
  // Policy/Complex
  | "ECLIPSE" | "CIMO"
  // Specialized
  | "BeHEMoTh" | "PerSPEcTiF" | "PICOT-D" | "PICOTS-ComTeC";

// ============================================================================
// Wizard Step Types
// ============================================================================

/**
 * Wizard step identifiers
 */
export type WizardStepId =
  | "welcome"           // Introduction and language selection
  | "framework"         // Framework selection (with clarification)
  | "components"        // Framework component extraction
  | "finer"            // FINER assessment
  | "questions"        // Generated questions (narrow/broad/clinical)
  | "review";          // Final review and save

/**
 * Step completion status
 */
export type StepStatus = "pending" | "active" | "completed";

/**
 * Individual wizard step definition
 */
export interface WizardStep {
  id: WizardStepId;
  label: string;                  // Display name (e.g., "Choose Framework")
  status: StepStatus;
  isSkippable: boolean;           // Can user skip this step?
  canNavigateBack: boolean;       // Can user go back to this step?
}

// ============================================================================
// FINER Assessment Types
// ============================================================================

/**
 * Qualitative score levels (no numeric values)
 */
export type FinerScore = "high" | "medium" | "low";

/**
 * FINER recommendation
 */
export type FinerRecommendation = "proceed" | "revise" | "reconsider";

/**
 * Individual FINER dimension assessment
 */
export interface FinerDimension {
  score: FinerScore;              // Qualitative level
  reason: string;                 // Detailed reasoning (2-3 sentences)
}

/**
 * Complete FINER assessment result
 */
export interface FinerAssessment {
  F: FinerDimension;              // Feasible
  I: FinerDimension;              // Interesting
  N: FinerDimension;              // Novel
  E: FinerDimension;              // Ethical
  R: FinerDimension;              // Relevant
  recommendation: FinerRecommendation;  // Overall recommendation
  suggestions: string[];          // Actionable improvement suggestions
  reasoning: string;              // Holistic judgment explanation (NOT formula-based)
}

// ============================================================================
// Generated Questions Types
// ============================================================================

/**
 * Question specificity level
 */
export type QuestionType = "narrow" | "broad" | "clinical";

/**
 * Single generated research question
 */
export interface GeneratedQuestion {
  type: QuestionType;
  text: string;                   // The actual question text
  explanation: string;            // Why this formulation (1-2 sentences)
  use_case: string;               // When to use this version
}

/**
 * Complete set of generated questions
 */
export interface GeneratedQuestions {
  narrow: GeneratedQuestion;      // Highly specific, PubMed-ready
  broad: GeneratedQuestion;       // Exploratory, scoping review
  clinical: GeneratedQuestion;    // Practical, clinical setting
}

// ============================================================================
// Wizard State Types
// ============================================================================

/**
 * Language selection
 */
export type Language = "en" | "he";

/**
 * Framework selection state
 */
export interface FrameworkSelection {
  type: FrameworkType | null;
  schema: FrameworkSchema | null;
  clarificationAnswers?: Record<string, string>; // Answers to clarification questions
  confidence: "high" | "medium" | "low";         // AI confidence in selection
}

/**
 * Component extraction state
 */
export interface ComponentExtractionState {
  components: FrameworkComponent[];
  isComplete: boolean;            // All required components filled?
  validationErrors: Record<string, string>; // Component key -> error message
}

/**
 * Complete wizard state
 */
export interface WizardState {
  // Project context
  projectId: string;
  projectName: string;

  // User preferences
  language: Language;

  // Wizard progress
  steps: WizardStep[];
  currentStepId: WizardStepId;

  // Framework selection
  framework: FrameworkSelection;

  // Component extraction
  extraction: ComponentExtractionState;

  // FINER assessment
  finer: FinerAssessment | null;

  // Generated questions
  questions: GeneratedQuestions | null;

  // Chat history (for context)
  chatHistory: ChatMessage[];

  // UI state
  isLoading: boolean;
  error: string | null;
}

/**
 * Chat message (for AI interaction)
 */
export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

// ============================================================================
// Wizard Actions Types
// ============================================================================

/**
 * Wizard action types (for reducer pattern)
 */
export type WizardAction =
  | { type: "SET_LANGUAGE"; payload: Language }
  | { type: "SET_FRAMEWORK"; payload: FrameworkSelection }
  | { type: "UPDATE_COMPONENT"; payload: { key: string; value: string } }
  | { type: "SET_FINER_ASSESSMENT"; payload: FinerAssessment }
  | { type: "SET_GENERATED_QUESTIONS"; payload: GeneratedQuestions }
  | { type: "NAVIGATE_TO_STEP"; payload: WizardStepId }
  | { type: "COMPLETE_STEP"; payload: WizardStepId }
  | { type: "ADD_CHAT_MESSAGE"; payload: ChatMessage }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET_WIZARD" };

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request to detect framework from user input
 */
export interface DetectFrameworkRequest {
  projectId: string;
  userInput: string;              // Natural language description
  language: Language;
  chatHistory?: ChatMessage[];    // Previous conversation context
}

/**
 * Response from framework detection
 */
export interface DetectFrameworkResponse {
  frameworkType: string | null;      // Null if clarification needed
  confidence: "high" | "medium" | "low";
  reasoning: string;                 // Why this framework was selected / why clarification needed
  clarificationNeeded: boolean;      // Should we ask follow-up questions?
  clarificationQuestion?: string;    // Single clarification question (if needed)
  alternativeFrameworks?: Array<{    // Alternative framework options
    frameworkType: string;
    reason: string;
  }>;
}

/**
 * Request to extract components from conversation
 */
export interface ExtractComponentsRequest {
  projectId: string;
  framework: FrameworkType;
  userInput: string;
  language: Language;
  chatHistory: ChatMessage[];
}

/**
 * Response from component extraction
 */
export interface ExtractComponentsResponse {
  components: Record<string, string>; // Component key -> extracted value
  missingRequired: string[];          // Keys of missing required components
  suggestions: Record<string, string>; // Component key -> suggestion
}

/**
 * Request for clarification follow-up
 */
export interface ClarifyFrameworkRequest {
  projectId: string;
  answer: string;                    // User's answer to clarification question
  language: Language;
  chatHistory: ChatMessage[];        // Full conversation history
}

/**
 * Response after clarification
 */
export interface ClarifyFrameworkResponse {
  frameworkType: string;             // Final detected framework type
  confidence: 'high' | 'medium' | 'low';
  reasoning: string;                 // Why this framework fits
  needsMoreClarification: boolean;   // If true, ask another question
  clarificationQuestion?: string;    // Next clarification question (if needed)
}

/**
 * Request to generate questions
 */
export interface GenerateQuestionsRequest {
  projectId: string;
  frameworkType: string;             // Selected framework type
  frameworkData: Record<string, string>; // Extracted framework components
  language: Language;
}

/**
 * Response with generated questions
 */
export interface GenerateQuestionsResponse {
  questions: GeneratedQuestions;
  finer: FinerAssessment;
}

// ============================================================================
// Preview Panel Types
// ============================================================================

/**
 * Preview panel content sections
 */
export interface PreviewContent {
  framework: {
    name: string;
    description: string;
    components: FrameworkComponent[];
  } | null;

  finer: FinerAssessment | null;

  questions: GeneratedQuestions | null;

  // Real-time validation feedback
  validation: {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  };
}

/**
 * Preview panel display mode
 */
export type PreviewMode = "compact" | "expanded";
