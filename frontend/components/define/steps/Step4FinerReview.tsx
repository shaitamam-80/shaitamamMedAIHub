/**
 * Define Tool v3.0 - Step 4: FINER Review
 * ========================================
 *
 * Review the qualitative FINER assessment for the selected research question.
 *
 * Features:
 * - Display full FINER assessment (Feasible, Interesting, Novel, Ethical, Relevant)
 * - Qualitative scores only (high/medium/low) - NO numeric values
 * - Detailed reasoning for each dimension
 * - Overall recommendation (proceed/revise/reconsider)
 * - Holistic judgment explanation
 * - Specific, actionable improvement suggestions
 */

'use client'

import React from 'react'
import { useWizardStore } from '@/lib/stores/useWizardStore'
import { StepHeader } from '../WizardContainer'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// FINER Dimension Labels
// ============================================================================

const FINER_DIMENSIONS = {
  F: { label: 'Feasible', description: 'Can this study be conducted?' },
  I: { label: 'Interesting', description: 'Is this engaging to researchers?' },
  N: { label: 'Novel', description: 'Does this add new knowledge?' },
  E: { label: 'Ethical', description: 'Can this be conducted ethically?' },
  R: { label: 'Relevant', description: 'Will results matter?' },
}

// ============================================================================
// Main Component
// ============================================================================

export function Step4FinerReview() {
  const language = useWizardStore((state) => state.language)
  const questions = useWizardStore((state) => state.questions)
  const finer = useWizardStore((state) => state.finer)

  if (!finer || !questions) {
    return (
      <div className="space-y-6">
        <StepHeader
          title={language === 'he' ? 'סקירת FINER' : 'FINER Review'}
          description={
            language === 'he'
              ? 'טוען הערכת FINER...'
              : 'Loading FINER assessment...'
          }
        />
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              {language === 'he'
                ? 'אנא צור שאלות מחקר תחילה'
                : 'Please generate questions first'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getScoreIcon = (score: string) => {
    switch (score) {
      case 'high':
        return <CheckCircle2 className="h-5 w-5 text-success" />
      case 'medium':
        return <AlertTriangle className="h-5 w-5 text-warning" />
      case 'low':
        return <AlertCircle className="h-5 w-5 text-destructive" />
      default:
        return null
    }
  }

  const getScoreBadge = (score: string) => {
    switch (score) {
      case 'high':
        return (
          <Badge className="bg-success capitalize">{score}</Badge>
        )
      case 'medium':
        return (
          <Badge variant="secondary" className="capitalize">
            {score}
          </Badge>
        )
      case 'low':
        return (
          <Badge variant="destructive" className="capitalize">
            {score}
          </Badge>
        )
      default:
        return null
    }
  }

  const getRecommendationConfig = (recommendation: string) => {
    switch (recommendation) {
      case 'proceed':
        return {
          icon: CheckCircle2,
          color: 'text-success',
          bg: 'bg-success/10',
          border: 'border-success',
          label: language === 'he' ? 'המשך' : 'Proceed',
          description:
            language === 'he'
              ? 'השאלה מוצקה ומוכנה להמשך'
              : 'Question is strong and ready to proceed',
        }
      case 'revise':
        return {
          icon: AlertTriangle,
          color: 'text-warning',
          bg: 'bg-warning/10',
          border: 'border-warning',
          label: language === 'he' ? 'שפר' : 'Revise',
          description:
            language === 'he'
              ? 'הרעיון טוב אך דורש שיפורים'
              : 'Good potential, but needs refinement',
        }
      case 'reconsider':
        return {
          icon: AlertCircle,
          color: 'text-destructive',
          bg: 'bg-destructive/10',
          border: 'border-destructive',
          label: language === 'he' ? 'שקול מחדש' : 'Reconsider',
          description:
            language === 'he'
              ? 'חששות משמעותיים - שקול מחדש את השאלה'
              : 'Significant concerns - rethink the question',
        }
      default:
        return null
    }
  }

  const recommendationConfig = getRecommendationConfig(finer.recommendation)
  const RecommendationIcon = recommendationConfig?.icon

  return (
    <div className="space-y-6">
      <StepHeader
        title={language === 'he' ? 'סקירת FINER' : 'FINER Review'}
        description={
          language === 'he'
            ? 'הערכת איכות שאלת המחקר שלך לפי קריטריוני FINER'
            : 'Quality assessment of your research question using FINER criteria'
        }
      />

      {/* Overall Recommendation */}
      {recommendationConfig && (
        <Card
          className={cn(
            'border-2',
            recommendationConfig.border,
            recommendationConfig.bg
          )}
        >
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              {RecommendationIcon && (
                <RecommendationIcon
                  className={cn('h-8 w-8 flex-shrink-0', recommendationConfig.color)}
                />
              )}
              <div className="flex-1">
                <h3
                  className={cn(
                    'text-lg font-semibold mb-1',
                    recommendationConfig.color
                  )}
                >
                  {language === 'he' ? 'המלצה: ' : 'Recommendation: '}
                  {recommendationConfig.label}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {recommendationConfig.description}
                </p>
                <div className="p-3 bg-background rounded-md">
                  <p className="text-sm leading-relaxed">{finer.reasoning}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* FINER Dimensions */}
      <Card>
        <CardHeader>
          <CardTitle>
            {language === 'he' ? 'קריטריוני FINER' : 'FINER Criteria'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(FINER_DIMENSIONS).map(([key, config]) => {
            const dimension = finer[key as keyof typeof FINER_DIMENSIONS]

            return (
              <div key={key} className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {getScoreIcon(dimension.score)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {key} - {config.label}
                        </h4>
                        {getScoreBadge(dimension.score)}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {config.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="ml-8 p-3 bg-muted/50 rounded-md">
                  <p className="text-sm leading-relaxed">{dimension.reason}</p>
                </div>

                {/* Divider except for last item */}
                {key !== 'R' && <div className="border-t" />}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Improvement Suggestions */}
      {finer.suggestions && finer.suggestions.length > 0 && (
        <Card className="border-wizard-primary/50 bg-wizard-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-wizard-primary" />
              {language === 'he' ? 'הצעות לשיפור' : 'Suggestions for Improvement'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {finer.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-wizard-primary text-white text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <p className="text-sm flex-1 pt-0.5">{suggestion}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* What's Next */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            {finer.recommendation === 'proceed'
              ? language === 'he'
                ? 'מעולה! השאלה שלך מוכנה. לחץ "הבא" לשמירה וייצוא'
                : 'Great! Your question is ready. Click "Next" to save and export'
              : language === 'he'
              ? 'שקול את ההצעות לשיפור לפני שתמשיך'
              : 'Consider the improvement suggestions before proceeding'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
