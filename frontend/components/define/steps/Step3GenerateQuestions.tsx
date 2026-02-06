/**
 * Define Tool v3.0 - Step 3: Generate Questions
 * ==============================================
 *
 * Generate three research question formulations with FINER assessment.
 *
 * Features:
 * - Generate 3 versions: narrow (PubMed-ready), broad (exploratory), clinical (practical)
 * - Display FINER mini-indicators for each question
 * - Allow selection of preferred question
 * - Show loading state during generation (30-45 seconds)
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useWizardStore, useFrameworkData } from '@/lib/stores/useWizardStore'
import { StepHeader } from '../WizardContainer'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Sparkles, Target, Compass, Stethoscope, Loader2 } from 'lucide-react'
import { generateQuestions } from '@/lib/api/define-v3'
import { cn } from '@/lib/utils'
import type { GeneratedQuestion } from '@/lib/types/wizard.types'

// ============================================================================
// Question Type Icons & Labels
// ============================================================================

const QUESTION_TYPES = {
  narrow: {
    icon: Target,
    label: 'Narrow (PubMed-ready)',
    description: 'Highly specific, systematic review ready',
    color: 'text-blue-600',
  },
  broad: {
    icon: Compass,
    label: 'Broad (Exploratory)',
    description: 'General, scoping review suitable',
    color: 'text-purple-600',
  },
  clinical: {
    icon: Stethoscope,
    label: 'Clinical (Practical)',
    description: 'Real-world, clinical practice focused',
    color: 'text-green-600',
  },
}

// ============================================================================
// Main Component
// ============================================================================

export function Step3GenerateQuestions() {
  const language = useWizardStore((state) => state.language)
  const projectId = useWizardStore((state) => state.projectId)
  const framework = useWizardStore((state) => state.framework)
  const frameworkData = useFrameworkData()
  const questions = useWizardStore((state) => state.questions)
  const finer = useWizardStore((state) => state.finer)
  const setGeneratedQuestions = useWizardStore((state) => state.setGeneratedQuestions)
  const setFinerAssessment = useWizardStore((state) => state.setFinerAssessment)
  const setLoading = useWizardStore((state) => state.setLoading)
  const setError = useWizardStore((state) => state.setError)
  const isLoading = useWizardStore((state) => state.isLoading)

  const [selectedQuestion, setSelectedQuestion] = useState<'narrow' | 'broad' | 'clinical'>('narrow')
  const [generationProgress, setGenerationProgress] = useState(0)

  // Auto-generate if not already generated
  useEffect(() => {
    if (!questions && !isLoading && framework.type) {
      handleGenerate()
    }
  }, [])

  // Progress simulation during generation
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isLoading) {
      setGenerationProgress(0)
      interval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 95) return prev
          return prev + 5
        })
      }, 1500)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isLoading])

  const handleGenerate = async () => {
    try {
      setLoading(true)
      setError(null)

      const result = await generateQuestions({
        projectId,
        frameworkType: framework.type!,
        frameworkData,
        language,
      })

      setGeneratedQuestions(result.questions)
      setFinerAssessment(result.finer)
      setGenerationProgress(100)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to generate questions')
    } finally {
      setLoading(false)
    }
  }

  const getFinerColor = (score: string) => {
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
    <div className="space-y-6">
      <StepHeader
        title={language === 'he' ? 'צור שאלות מחקר' : 'Generate Questions'}
        description={
          language === 'he'
            ? 'המערכת תייצר 3 גרסאות של שאלת המחקר שלך - ספציפית, רחבה וקלינית'
            : 'The system will generate 3 versions of your research question - narrow, broad, and clinical'
        }
      />

      {/* Generate Button / Loading State */}
      {!questions && (
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-wizard-primary" />
                  <p className="text-lg font-medium">
                    {language === 'he'
                      ? 'יוצר שאלות...'
                      : 'Generating questions...'}
                  </p>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-wizard-primary transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  {language === 'he'
                    ? 'זה עשוי לקחת 30-45 שניות...'
                    : 'This may take 30-45 seconds...'}
                </p>
              </div>
            ) : (
              <Button
                onClick={handleGenerate}
                className="w-full gap-2"
                size="lg"
              >
                <Sparkles className="h-5 w-5" />
                {language === 'he' ? 'צור שאלות מחקר' : 'Generate Research Questions'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generated Questions */}
      {questions && (
        <RadioGroup
          value={selectedQuestion}
          onValueChange={(value) => setSelectedQuestion(value as any)}
          className="space-y-4"
        >
          {Object.entries(questions).map(([type, question]) => {
            const config = QUESTION_TYPES[type as keyof typeof QUESTION_TYPES]
            const Icon = config.icon

            return (
              <Card
                key={type}
                className={cn(
                  'cursor-pointer transition-all hover:shadow-md',
                  selectedQuestion === type && 'border-wizard-primary bg-wizard-primary/5'
                )}
                onClick={() => setSelectedQuestion(type as any)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      <RadioGroupItem value={type} id={type} className="mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={cn('h-5 w-5', config.color)} />
                          <CardTitle className="text-base">{config.label}</CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Question Text */}
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm leading-relaxed">{question.text}</p>
                  </div>

                  {/* Explanation */}
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Why this formulation?</Label>
                    <p className="text-sm">{question.explanation}</p>
                  </div>

                  {/* Use Case */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {question.use_case}
                    </Badge>
                  </div>

                  {/* Mini FINER Indicators */}
                  {finer && (
                    <div className="pt-3 border-t">
                      <Label className="text-xs text-muted-foreground mb-2 block">
                        FINER Assessment
                      </Label>
                      <div className="flex gap-2">
                        {[
                          { key: 'F', label: 'Feasible', value: finer.F },
                          { key: 'I', label: 'Interesting', value: finer.I },
                          { key: 'N', label: 'Novel', value: finer.N },
                          { key: 'E', label: 'Ethical', value: finer.E },
                          { key: 'R', label: 'Relevant', value: finer.R },
                        ].map((dim) => (
                          <div
                            key={dim.key}
                            className="flex-1 text-center"
                            title={`${dim.label}: ${dim.value.score}`}
                          >
                            <div
                              className={cn(
                                'h-1.5 rounded-full',
                                getFinerColor(dim.value.score)
                              )}
                            />
                            <span className="text-xs text-muted-foreground mt-1 block">
                              {dim.key}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </RadioGroup>
      )}

      {/* Regenerate Button */}
      {questions && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {language === 'he'
                  ? 'לא מרוצה מהשאלות? נסה שוב'
                  : 'Not satisfied with the questions? Try again'}
              </p>
              <Button
                onClick={handleGenerate}
                variant="outline"
                size="sm"
                disabled={isLoading}
              >
                {language === 'he' ? 'צור מחדש' : 'Regenerate'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
