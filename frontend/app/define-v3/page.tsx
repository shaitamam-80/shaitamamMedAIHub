/**
 * Define Tool v3.0 - Main Wizard Page
 * ====================================
 *
 * Production-ready wizard-based research question formulation system.
 *
 * Features:
 * - 6-step wizard flow with progress tracking
 * - Split-screen layout (60% input + 40% live preview)
 * - Clarification-based framework detection (no keyword matching)
 * - Dynamic support for 17+ research frameworks
 * - Qualitative FINER assessment (high/medium/low only)
 * - Three question formulations (narrow/broad/clinical)
 * - Real-time validation and preview
 * - Bilingual support (EN/HE) with RTL
 * - State persistence via localStorage
 *
 * Navigation:
 * - Step 0: Welcome - Free input + framework detection
 * - Step 1: Framework - Confirm or change detected framework
 * - Step 2: Components - Extract framework components
 * - Step 3: Questions - Generate 3 formulations + FINER mini
 * - Step 4: FINER - Full qualitative assessment review
 * - Step 5: Save - Project name + export options
 */

'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '@/lib/stores/useWizardStore'
import { WizardContainer } from '@/components/define/WizardContainer'
import {
  Step0Welcome,
  Step1FrameworkConfirmation,
  Step2DynamicFields,
  Step3GenerateQuestions,
  Step4FinerReview,
  Step5SaveExport,
} from '@/components/define/steps'

// ============================================================================
// Main Page Component
// ============================================================================

export default function DefineV3Page() {
  const router = useRouter()
  const currentStep = useWizardStore((state) => state.currentStep)
  const projectId = useWizardStore((state) => state.projectId)
  const initializeProject = useWizardStore((state) => state.initializeProject)
  const error = useWizardStore((state) => state.error)
  const setError = useWizardStore((state) => state.setError)

  // Initialize project on mount
  useEffect(() => {
    if (!projectId) {
      initializeProject()
    }
  }, [projectId, initializeProject])

  // ============================================================================
  // Step Routing
  // ============================================================================

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <Step0Welcome />
      case 1:
        return <Step1FrameworkConfirmation />
      case 2:
        return <Step2DynamicFields />
      case 3:
        return <Step3GenerateQuestions />
      case 4:
        return <Step4FinerReview />
      case 5:
        return <Step5SaveExport />
      default:
        return <Step0Welcome />
    }
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-destructive/10 border border-destructive rounded-lg p-6">
          <h2 className="text-lg font-semibold text-destructive mb-2">
            Error
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-sm text-destructive underline"
          >
            Dismiss
          </button>
        </div>
      </div>
    )
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-background">
      <WizardContainer>{renderStep()}</WizardContainer>
    </div>
  )
}
