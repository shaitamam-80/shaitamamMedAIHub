/**
 * Define Tool v3.0 - Wizard State Management
 * ==========================================
 *
 * Zustand store for wizard state with localStorage persistence.
 *
 * Key Features:
 * - Type-safe state management
 * - Automatic persistence to localStorage
 * - Step validation before navigation
 * - Reset functionality
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  WizardState,
  WizardStepId,
  WizardStep,
  FrameworkType,
  FrameworkSchema,
  FrameworkComponent,
  GeneratedQuestions,
  FinerAssessment,
  Language,
  ChatMessage,
} from '@/lib/types/wizard.types'

// ============================================================================
// Initial State
// ============================================================================

const initialSteps: WizardStep[] = [
  {
    id: 'welcome',
    label: 'Welcome',
    status: 'active',
    isSkippable: false,
    canNavigateBack: false,
  },
  {
    id: 'framework',
    label: 'Framework',
    status: 'pending',
    isSkippable: false,
    canNavigateBack: true,
  },
  {
    id: 'components',
    label: 'Components',
    status: 'pending',
    isSkippable: false,
    canNavigateBack: true,
  },
  {
    id: 'finer',
    label: 'FINER',
    status: 'pending',
    isSkippable: false,
    canNavigateBack: true,
  },
  {
    id: 'questions',
    label: 'Questions',
    status: 'pending',
    isSkippable: false,
    canNavigateBack: true,
  },
  {
    id: 'review',
    label: 'Review',
    status: 'pending',
    isSkippable: false,
    canNavigateBack: true,
  },
]

const initialState: Omit<WizardState, 'actions'> = {
  // Project context
  projectId: '',
  projectName: '',

  // User preferences
  language: 'en',

  // Wizard progress
  steps: initialSteps,
  currentStepId: 'welcome',

  // Framework selection
  framework: {
    type: null,
    schema: null,
    clarificationAnswers: {},
    confidence: 'low',
  },

  // Component extraction
  extraction: {
    components: [],
    isComplete: false,
    validationErrors: {},
  },

  // FINER assessment
  finer: null,

  // Generated questions
  questions: null,

  // Chat history
  chatHistory: [],

  // UI state
  isLoading: false,
  error: null,
}

// ============================================================================
// Store Interface
// ============================================================================

interface WizardStore extends WizardState {
  // Navigation actions
  goToStep: (stepId: WizardStepId) => void
  nextStep: () => void
  previousStep: () => void
  completeCurrentStep: () => void

  // Project actions
  setProject: (projectId: string, projectName: string) => void
  setLanguage: (language: Language) => void

  // Framework actions
  setFramework: (
    type: FrameworkType,
    schema: FrameworkSchema,
    confidence: 'high' | 'medium' | 'low'
  ) => void
  addClarificationAnswer: (question: string, answer: string) => void

  // Component actions
  updateComponent: (key: string, value: string) => void
  setComponents: (components: FrameworkComponent[]) => void
  setValidationError: (key: string, error: string | null) => void

  // FINER actions
  setFinerAssessment: (finer: FinerAssessment) => void

  // Questions actions
  setGeneratedQuestions: (questions: GeneratedQuestions) => void

  // Chat actions
  addChatMessage: (message: ChatMessage) => void
  clearChatHistory: () => void

  // UI actions
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void

  // Reset
  resetWizard: () => void
}

// ============================================================================
// Store Implementation
// ============================================================================

export const useWizardStore = create<WizardStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // Navigation Actions
      // ========================================================================

      goToStep: (stepId: WizardStepId) => {
        set((state) => {
          const steps = state.steps.map((step) => ({
            ...step,
            status:
              step.id === stepId
                ? ('active' as const)
                : step.status === 'completed'
                ? ('completed' as const)
                : ('pending' as const),
          }))

          return {
            steps,
            currentStepId: stepId,
          }
        })
      },

      nextStep: () => {
        const state = get()
        const currentIndex = state.steps.findIndex(
          (s) => s.id === state.currentStepId
        )

        if (currentIndex < state.steps.length - 1) {
          const nextStepId = state.steps[currentIndex + 1].id
          get().completeCurrentStep()
          get().goToStep(nextStepId)
        }
      },

      previousStep: () => {
        const state = get()
        const currentIndex = state.steps.findIndex(
          (s) => s.id === state.currentStepId
        )

        if (currentIndex > 0) {
          const previousStepId = state.steps[currentIndex - 1].id
          const previousStep = state.steps[currentIndex - 1]

          if (previousStep.canNavigateBack) {
            get().goToStep(previousStepId)
          }
        }
      },

      completeCurrentStep: () => {
        set((state) => ({
          steps: state.steps.map((step) =>
            step.id === state.currentStepId
              ? { ...step, status: 'completed' as const }
              : step
          ),
        }))
      },

      // ========================================================================
      // Project Actions
      // ========================================================================

      setProject: (projectId: string, projectName: string) => {
        set({ projectId, projectName })
      },

      setLanguage: (language: Language) => {
        set({ language })
      },

      // ========================================================================
      // Framework Actions
      // ========================================================================

      setFramework: (
        type: FrameworkType,
        schema: FrameworkSchema,
        confidence: 'high' | 'medium' | 'low'
      ) => {
        set((state) => ({
          framework: {
            ...state.framework,
            type,
            schema,
            confidence,
          },
          // Initialize components based on framework schema
          extraction: {
            components: schema.components.map((key) => ({
              key,
              label: schema.labels[key] || key,
              value: '',
              isRequired: true, // TODO: Get from schema
              placeholder: `Enter ${schema.labels[key] || key}`,
            })),
            isComplete: false,
            validationErrors: {},
          },
        }))
      },

      addClarificationAnswer: (question: string, answer: string) => {
        set((state) => ({
          framework: {
            ...state.framework,
            clarificationAnswers: {
              ...state.framework.clarificationAnswers,
              [question]: answer,
            },
          },
        }))
      },

      // ========================================================================
      // Component Actions
      // ========================================================================

      updateComponent: (key: string, value: string) => {
        set((state) => {
          const updatedComponents = state.extraction.components.map((comp) =>
            comp.key === key ? { ...comp, value } : comp
          )

          // Check if all required components are filled
          const isComplete = updatedComponents
            .filter((c) => c.isRequired)
            .every((c) => c.value.trim().length > 0)

          return {
            extraction: {
              ...state.extraction,
              components: updatedComponents,
              isComplete,
            },
          }
        })
      },

      setComponents: (components: FrameworkComponent[]) => {
        set((state) => ({
          extraction: {
            ...state.extraction,
            components,
            isComplete: components
              .filter((c) => c.isRequired)
              .every((c) => c.value.trim().length > 0),
          },
        }))
      },

      setValidationError: (key: string, error: string | null) => {
        set((state) => {
          const errors = { ...state.extraction.validationErrors }
          if (error === null) {
            delete errors[key]
          } else {
            errors[key] = error
          }
          return {
            extraction: {
              ...state.extraction,
              validationErrors: errors,
            },
          }
        })
      },

      // ========================================================================
      // FINER Actions
      // ========================================================================

      setFinerAssessment: (finer: FinerAssessment) => {
        set({ finer })
      },

      // ========================================================================
      // Questions Actions
      // ========================================================================

      setGeneratedQuestions: (questions: GeneratedQuestions) => {
        set({ questions })
      },

      // ========================================================================
      // Chat Actions
      // ========================================================================

      addChatMessage: (message: ChatMessage) => {
        set((state) => ({
          chatHistory: [...state.chatHistory, message],
        }))
      },

      clearChatHistory: () => {
        set({ chatHistory: [] })
      },

      // ========================================================================
      // UI Actions
      // ========================================================================

      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      // ========================================================================
      // Reset
      // ========================================================================

      resetWizard: () => {
        set({
          ...initialState,
          // Preserve project context
          projectId: get().projectId,
          projectName: get().projectName,
        })
      },
    }),
    {
      name: 'wizard-storage', // localStorage key
      storage: createJSONStorage(() => localStorage),
      // Only persist specific fields (exclude UI state like isLoading)
      partialize: (state) => ({
        projectId: state.projectId,
        projectName: state.projectName,
        language: state.language,
        currentStepId: state.currentStepId,
        steps: state.steps,
        framework: state.framework,
        extraction: state.extraction,
        finer: state.finer,
        questions: state.questions,
        chatHistory: state.chatHistory,
      }),
    }
  )
)

// ============================================================================
// Selectors (for performance optimization)
// ============================================================================

/**
 * Get current step object
 */
export const useCurrentStep = () => {
  return useWizardStore((state) =>
    state.steps.find((s) => s.id === state.currentStepId)
  )
}

/**
 * Check if can proceed to next step
 */
export const useCanProceed = () => {
  return useWizardStore((state) => {
    const { currentStepId, framework, extraction } = state

    switch (currentStepId) {
      case 'welcome':
        return state.language !== null

      case 'framework':
        return framework.type !== null

      case 'components':
        return extraction.isComplete && Object.keys(extraction.validationErrors).length === 0

      case 'finer':
        return state.finer !== null

      case 'questions':
        return state.questions !== null

      case 'review':
        return true

      default:
        return false
    }
  })
}

/**
 * Get framework components as key-value object
 */
export const useFrameworkData = () => {
  return useWizardStore((state) => {
    const data: Record<string, string> = {}
    state.extraction.components.forEach((comp) => {
      data[comp.key] = comp.value
    })
    return data
  })
}

/**
 * Get step progress percentage
 */
export const useProgress = () => {
  return useWizardStore((state) => {
    const completedCount = state.steps.filter(
      (s) => s.status === 'completed'
    ).length
    return Math.round((completedCount / state.steps.length) * 100)
  })
}
