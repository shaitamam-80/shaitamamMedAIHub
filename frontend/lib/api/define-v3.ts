/**
 * Define Tool v3.0 - API Client
 * ==============================
 *
 * API functions for wizard-based research question formulation.
 *
 * Endpoints:
 * - POST /define/detect-framework - Clarification-based framework detection
 * - POST /define/clarify-framework - Process clarification answers
 * - POST /define/generate-questions - Generate 3 questions + FINER
 */

import { client as apiClient } from './client'
import type {
  DetectFrameworkRequest,
  DetectFrameworkResponse,
  ClarifyFrameworkRequest,
  ClarifyFrameworkResponse,
  GenerateQuestionsRequest,
  GenerateQuestionsResponse,
  ChatMessage,
} from '@/lib/types/wizard.types'

// ============================================================================
// Framework Detection
// ============================================================================

/**
 * Detect appropriate research framework from user input
 *
 * @param request - Detection request with user input
 * @returns Framework type or clarification question
 *
 * @example
 * ```ts
 * const result = await detectFramework({
 *   project_id: projectId,
 *   user_input: "I want to study exercise for depression",
 *   language: "en"
 * })
 *
 * if (result.clarification_needed) {
 *   // Show clarification question to user
 *   console.log(result.clarification_question)
 * } else {
 *   // Framework detected
 *   console.log(result.framework_type) // "PICO"
 * }
 * ```
 */
export async function detectFramework(
  request: Omit<DetectFrameworkRequest, 'chatHistory'> & {
    chatHistory?: ChatMessage[]
  }
): Promise<DetectFrameworkResponse> {
  const response = await apiClient.post<DetectFrameworkResponse>(
    '/api/v1/define/detect-framework',
    {
      project_id: request.projectId,
      user_input: request.userInput,
      language: request.language || 'en',
      chat_history: request.chatHistory || [],
    }
  )

  return response.data
}

// ============================================================================
// Framework Clarification
// ============================================================================

/**
 * Process clarification answer and finalize framework selection
 *
 * @param request - Clarification answer with conversation history
 * @returns Final framework type
 *
 * @example
 * ```ts
 * const result = await clarifyFramework({
 *   project_id: projectId,
 *   answer: "a) Treatment effectiveness",
 *   language: "en",
 *   chat_history: previousMessages
 * })
 *
 * console.log(result.framework_type) // "PICO"
 * console.log(result.confidence) // "high"
 * ```
 */
export async function clarifyFramework(
  request: ClarifyFrameworkRequest
): Promise<ClarifyFrameworkResponse> {
  const response = await apiClient.post<ClarifyFrameworkResponse>(
    '/api/v1/define/clarify-framework',
    {
      project_id: request.projectId,
      answer: request.answer,
      language: request.language || 'en',
      chat_history: request.chatHistory,
    }
  )

  return response.data
}

// ============================================================================
// Question Generation
// ============================================================================

/**
 * Generate three research question formulations with qualitative FINER assessment
 *
 * @param request - Framework type and extracted components
 * @returns Three questions (narrow/broad/clinical) + FINER assessment
 *
 * @example
 * ```ts
 * const result = await generateQuestions({
 *   project_id: projectId,
 *   framework_type: "PICO",
 *   framework_data: {
 *     P: "Elderly patients with depression",
 *     I: "Physical exercise",
 *     C: "Standard care",
 *     O: "Depression severity"
 *   },
 *   language: "en"
 * })
 *
 * console.log(result.questions.narrow.text)
 * console.log(result.finer_assessment.recommendation) // "proceed"
 * ```
 */
export async function generateQuestions(
  request: GenerateQuestionsRequest
): Promise<GenerateQuestionsResponse> {
  const response = await apiClient.post<GenerateQuestionsResponse>(
    '/api/v1/define/generate-questions',
    {
      project_id: request.projectId,
      framework_type: request.frameworkType,
      framework_data: request.frameworkData,
      language: request.language || 'en',
    }
  )

  return response.data
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Detect framework with automatic retry on clarification
 *
 * This function handles the clarification flow automatically:
 * 1. First attempt: detect framework
 * 2. If clarification needed: return question for UI
 * 3. After user answers: call clarifyFramework
 *
 * @param projectId - Project UUID
 * @param userInput - Natural language research question
 * @param language - Language code ("en" or "he")
 * @returns Detection response
 */
export async function detectFrameworkWithRetry(
  projectId: string,
  userInput: string,
  language: 'en' | 'he' = 'en'
): Promise<DetectFrameworkResponse> {
  return detectFramework({
    projectId,
    userInput,
    language,
  })
}

/**
 * Generate questions from framework components
 *
 * Convenience function that handles the full question generation flow.
 *
 * @param projectId - Project UUID
 * @param frameworkType - Selected framework type
 * @param components - Extracted framework components
 * @param language - Language code ("en" or "he")
 * @returns Generated questions and FINER assessment
 */
export async function generateQuestionsFromComponents(
  projectId: string,
  frameworkType: string,
  components: Record<string, string>,
  language: 'en' | 'he' = 'en'
): Promise<GenerateQuestionsResponse> {
  return generateQuestions({
    projectId,
    frameworkType,
    frameworkData: components,
    language,
  })
}

// ============================================================================
// Framework Schemas
// ============================================================================

/**
 * Get all available framework schemas
 *
 * @returns All framework definitions with components, labels, and metadata
 *
 * @example
 * ```ts
 * const { frameworks } = await getFrameworkSchemas()
 * console.log(frameworks.PICO.components) // ['P', 'I', 'C', 'O']
 * console.log(frameworks.PICO.labels.P) // 'Population'
 * ```
 */
export async function getFrameworkSchemas(): Promise<{
  frameworks: Record<string, any>
}> {
  const response = await apiClient.get('/api/v1/define/frameworks')
  return response.data
}

// ============================================================================
// Export all
// ============================================================================

export default {
  detectFramework,
  clarifyFramework,
  generateQuestions,
  detectFrameworkWithRetry,
  generateQuestionsFromComponents,
  getFrameworkSchemas,
}
