/**
 * Define Tool v3.0 - Wizard Container
 * ====================================
 *
 * Main container for wizard-based research question formulation.
 *
 * Layout:
 * - Left panel (60%): Current step content + navigation
 * - Right panel (40%): Live preview (sticky)
 *
 * Features:
 * - Step-by-step progression
 * - Real-time validation
 * - Live preview updates
 * - Keyboard navigation support
 */

'use client'

import React, { useEffect } from 'react'
import { useWizardStore, useCurrentStep, useCanProceed, useProgress } from '@/lib/stores/useWizardStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LivePreviewPanel } from './LivePreviewPanel'

// ============================================================================
// Props Interface
// ============================================================================

export interface WizardContainerProps {
  children: React.ReactNode
}

// ============================================================================
// Wizard Container Component
// ============================================================================

export function WizardContainer({
  children,
}: WizardContainerProps) {
  const currentStep = useCurrentStep()
  const canProceed = useCanProceed()
  const progress = useProgress()
  const isLoading = useWizardStore((state) => state.isLoading)
  const error = useWizardStore((state) => state.error)
  const setError = useWizardStore((state) => state.setError)

  const nextStep = useWizardStore((state) => state.nextStep)
  const previousStep = useWizardStore((state) => state.previousStep)

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent keyboard navigation when in input fields
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      if (e.key === 'ArrowRight' && canProceed && !isLoading) {
        nextStep()
      } else if (e.key === 'ArrowLeft' && currentStep?.canNavigateBack) {
        previousStep()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canProceed, currentStep, isLoading, nextStep, previousStep])

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Progress Bar */}
      <div className="w-full h-1 bg-muted">
        <div
          className="h-full bg-wizard-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Content: Split Screen Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Wizard Steps (60%) */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl mx-auto">
            {/* Error Display */}
            {error && (
              <Card className="mb-6 border-destructive">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-destructive">
                        {error}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setError(null)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Current Step Content */}
            <div className="mb-8">{children}</div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              {/* Back Button */}
              <Button
                variant="outline"
                onClick={previousStep}
                disabled={!currentStep?.canNavigateBack || isLoading}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>

              {/* Step Indicator */}
              <div className="text-sm text-muted-foreground">
                Step {(useWizardStore((state) => state.steps.findIndex((s) => s.id === state.currentStepId)) || 0) + 1} of{' '}
                {useWizardStore((state) => state.steps.length)}
              </div>

              {/* Next Button */}
              <Button
                onClick={nextStep}
                disabled={!canProceed || isLoading}
                className="gap-2 bg-wizard-primary hover:bg-wizard-primary-dark"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Panel: Live Preview (40%) */}
        <div className="w-wizard-panel border-l bg-muted/30 overflow-y-auto">
          <div className="sticky top-0 p-6">
            <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
            <LivePreviewPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Step Progress Indicator Component
// ============================================================================

interface StepProgressProps {
  className?: string
}

export function StepProgress({ className }: StepProgressProps) {
  const steps = useWizardStore((state) => state.steps)
  const currentStepId = useWizardStore((state) => state.currentStepId)
  const goToStep = useWizardStore((state) => state.goToStep)

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => {
        const isActive = step.id === currentStepId
        const isCompleted = step.status === 'completed'
        const isPending = step.status === 'pending'

        return (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <button
              onClick={() => {
                if (isCompleted || isActive) {
                  goToStep(step.id)
                }
              }}
              disabled={isPending}
              className={cn(
                'flex items-center justify-center w-step-indicator h-step-indicator rounded-full border-2 transition-all',
                'text-sm font-medium',
                {
                  'bg-wizard-step-active border-wizard-step-active text-white':
                    isActive,
                  'bg-wizard-step-complete border-wizard-step-complete text-white':
                    isCompleted,
                  'bg-background border-wizard-step-pending text-muted-foreground':
                    isPending,
                  'cursor-pointer hover:scale-105': isCompleted || isActive,
                  'cursor-not-allowed': isPending,
                }
              )}
            >
              {index + 1}
            </button>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-2 transition-colors',
                  isCompleted
                    ? 'bg-wizard-step-complete'
                    : 'bg-wizard-step-pending'
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ============================================================================
// Step Header Component
// ============================================================================

interface StepHeaderProps {
  title: string
  description?: string
  className?: string
}

export function StepHeader({
  title,
  description,
  className,
}: StepHeaderProps) {
  return (
    <div className={cn('mb-8', className)}>
      <h2 className="text-3xl font-bold tracking-tight mb-2">{title}</h2>
      {description && (
        <p className="text-muted-foreground text-lg">{description}</p>
      )}
      <StepProgress className="mt-6" />
    </div>
  )
}
