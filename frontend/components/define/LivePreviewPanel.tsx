/**
 * Define Tool v3.0 - Live Preview Panel
 * ======================================
 *
 * Real-time preview panel showing:
 * - Selected framework
 * - Extracted components
 * - Composed research question
 * - FINER assessment (when available)
 * - Generated questions (final step)
 *
 * Updates automatically as user progresses through wizard.
 */

'use client'

import React, { useMemo } from 'react'
import { useWizardStore, useFrameworkData } from '@/lib/stores/useWizardStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Check, Circle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Main Preview Panel Component
// ============================================================================

export function LivePreviewPanel() {
  const framework = useWizardStore((state) => state.framework)
  const extraction = useWizardStore((state) => state.extraction)
  const finer = useWizardStore((state) => state.finer)
  const questions = useWizardStore((state) => state.questions)
  const currentStepId = useWizardStore((state) => state.currentStepId)

  return (
    <div className="space-y-6">
      {/* Framework Badge */}
      {framework.type && <FrameworkBadge />}

      {/* Components Preview */}
      {framework.type && extraction.components.length > 0 && (
        <ComponentsCard />
      )}

      {/* Composed Question Preview */}
      {framework.type && extraction.isComplete && <QuestionPreview />}

      {/* FINER Mini Indicator */}
      {finer && <FinerMiniCard />}

      {/* Generated Questions */}
      {questions && currentStepId === 'questions' && <GeneratedQuestionsCard />}

      {/* Validation Warnings */}
      {Object.keys(extraction.validationErrors).length > 0 && (
        <ValidationWarnings />
      )}
    </div>
  )
}

// ============================================================================
// Framework Badge Component
// ============================================================================

function FrameworkBadge() {
  const framework = useWizardStore((state) => state.framework)

  if (!framework.type || !framework.schema) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Framework</CardTitle>
          <Badge
            variant={
              framework.confidence === 'high'
                ? 'default'
                : framework.confidence === 'medium'
                ? 'secondary'
                : 'outline'
            }
            className="text-xs"
          >
            {framework.confidence} confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{framework.type}</h3>
          <p className="text-sm text-muted-foreground">
            {framework.schema.description}
          </p>
          <p className="text-xs text-muted-foreground italic">
            {framework.schema.use_case}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Components Card Component
// ============================================================================

function ComponentsCard() {
  const extraction = useWizardStore((state) => state.extraction)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Components</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {extraction.components.map((component) => {
            const hasValue = component.value.trim().length > 0
            const hasError = extraction.validationErrors[component.key]

            return (
              <div key={component.key} className="space-y-1">
                <div className="flex items-start gap-2">
                  {/* Status Icon */}
                  {hasError ? (
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                  ) : hasValue ? (
                    <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}

                  {/* Component Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {component.key}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({component.label})
                      </span>
                      {component.isRequired && (
                        <Badge variant="outline" className="text-xs">
                          Required
                        </Badge>
                      )}
                    </div>

                    {/* Component Value */}
                    {hasValue ? (
                      <p className="text-sm text-foreground mt-1 line-clamp-2">
                        {component.value}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        {component.placeholder || 'Not provided'}
                      </p>
                    )}

                    {/* Validation Error */}
                    {hasError && (
                      <p className="text-xs text-destructive mt-1">
                        {hasError}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Question Preview Component
// ============================================================================

function QuestionPreview() {
  const framework = useWizardStore((state) => state.framework)
  const frameworkData = useFrameworkData()

  const composedQuestion = useMemo(() => {
    return composeQuestion(framework.type, frameworkData)
  }, [framework.type, frameworkData])

  if (!composedQuestion) return null

  return (
    <Card className="border-wizard-primary/50 bg-wizard-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Research Question (Draft)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed">{composedQuestion}</p>
        <p className="text-xs text-muted-foreground mt-3 italic">
          This is a preliminary composition. Final versions will be generated in step 5.
        </p>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// FINER Mini Card Component
// ============================================================================

function FinerMiniCard() {
  const finer = useWizardStore((state) => state.finer)

  if (!finer) return null

  const dimensions = [
    { key: 'F', label: 'Feasible', value: finer.F },
    { key: 'I', label: 'Interesting', value: finer.I },
    { key: 'N', label: 'Novel', value: finer.N },
    { key: 'E', label: 'Ethical', value: finer.E },
    { key: 'R', label: 'Relevant', value: finer.R },
  ]

  const getScoreColor = (score: string) => {
    switch (score) {
      case 'high':
        return 'bg-success'
      case 'medium':
        return 'bg-warning'
      case 'low':
        return 'bg-destructive'
      default:
        return 'bg-muted'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            FINER Assessment
          </CardTitle>
          <Badge
            variant={
              finer.recommendation === 'proceed'
                ? 'default'
                : finer.recommendation === 'revise'
                ? 'secondary'
                : 'outline'
            }
          >
            {finer.recommendation}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dimensions.map((dim) => (
            <div key={dim.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {dim.key} - {dim.label}
                </span>
                <span className="text-muted-foreground capitalize">
                  {dim.value.score}
                </span>
              </div>
              {/* Score Bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full transition-all',
                    getScoreColor(dim.value.score)
                  )}
                  style={{
                    width:
                      dim.value.score === 'high'
                        ? '100%'
                        : dim.value.score === 'medium'
                        ? '66%'
                        : '33%',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Generated Questions Card Component
// ============================================================================

function GeneratedQuestionsCard() {
  const questions = useWizardStore((state) => state.questions)

  if (!questions) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">
          Generated Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Narrow Question */}
          <div className="space-y-1">
            <Badge variant="outline" className="text-xs">
              Narrow (PubMed-ready)
            </Badge>
            <p className="text-sm line-clamp-3">{questions.narrow.text}</p>
          </div>

          {/* Broad Question */}
          <div className="space-y-1">
            <Badge variant="outline" className="text-xs">
              Broad (Exploratory)
            </Badge>
            <p className="text-sm line-clamp-3">{questions.broad.text}</p>
          </div>

          {/* Clinical Question */}
          <div className="space-y-1">
            <Badge variant="outline" className="text-xs">
              Clinical (Practical)
            </Badge>
            <p className="text-sm line-clamp-3">{questions.clinical.text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Validation Warnings Component
// ============================================================================

function ValidationWarnings() {
  const validationErrors = useWizardStore(
    (state) => state.extraction.validationErrors
  )

  const errorCount = Object.keys(validationErrors).length

  if (errorCount === 0) return null

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Validation Issues ({errorCount})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {Object.entries(validationErrors).map(([key, error]) => (
            <li key={key} className="flex items-start gap-2">
              <span className="font-medium min-w-8">{key}:</span>
              <span className="text-muted-foreground">{error}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Helper: Compose Question from Components
// ============================================================================

/**
 * Compose a draft research question from framework components.
 * This is a simple template-based composition for live preview.
 * Final questions will be AI-generated in step 5.
 */
function composeQuestion(
  frameworkType: string | null,
  data: Record<string, string>
): string | null {
  if (!frameworkType) return null

  // Filter out empty values
  const filled = Object.entries(data).filter(([_, value]) => value.trim())
  if (filled.length === 0) return null

  switch (frameworkType) {
    case 'PICO':
      const { P, I, C, O } = data
      if (P && I && O) {
        return `In ${P}, does ${I}${
          C ? ` compared to ${C}` : ''
        } affect ${O}?`
      }
      break

    case 'PECO':
      const { P: Pop, E, C: Comp, O: Out } = data
      if (Pop && E && Out) {
        return `In ${Pop}, is exposure to ${E}${
          Comp ? ` compared to ${Comp}` : ''
        } associated with ${Out}?`
      }
      break

    case 'SPIDER':
      const { S, PI, E: Eval } = data
      if (S && PI) {
        return `What are the ${Eval || 'experiences'} of ${S} regarding ${PI}?`
      }
      break

    case 'CoCoPop':
      const { Co: Condition, Pop: Population } = data
      if (Condition && Population) {
        return `What is the prevalence of ${Condition} in ${Population}?`
      }
      break

    default:
      // Generic composition for other frameworks
      const values = filled.map(([key, value]) => `${key}: ${value}`)
      return values.join(', ')
  }

  return null
}
