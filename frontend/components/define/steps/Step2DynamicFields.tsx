/**
 * Define Tool v3.0 - Step 2: Dynamic Fields
 * ==========================================
 *
 * User fills out framework components dynamically based on selected framework.
 *
 * Features:
 * - Dynamic field generation based on framework schema
 * - Required/Optional indicators
 * - Real-time validation
 * - Live preview updates automatically
 * - Help text and examples for each component
 * - RTL/LTR support
 */

'use client'

import React from 'react'
import { useWizardStore, useFrameworkData } from '@/lib/stores/useWizardStore'
import { StepHeader } from '../WizardContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { AlertCircle, HelpCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Example Help Text by Component
// ============================================================================

const COMPONENT_HELP = {
  P: {
    en: 'Define the population or participants. Be specific about age, condition, setting.',
    he: 'הגדר את האוכלוסייה או המשתתפים. היה ספציפי לגבי גיל, מצב, סביבה.',
    example_en: 'Elderly patients (≥65 years) with major depressive disorder',
    example_he: 'חולים קשישים (≥65 שנים) עם הפרעת דיכאון מג\'ורית',
  },
  I: {
    en: 'Describe the intervention or treatment being studied.',
    he: 'תאר את ההתערבות או הטיפול הנחקר.',
    example_en: 'Structured aerobic exercise (30 min, 3×/week for 12 weeks)',
    example_he: 'פעילות גופנית אירובית מובנית (30 דק\', 3 פעמים בשבוע למשך 12 שבועות)',
  },
  C: {
    en: 'What is being compared to? Can be standard care, placebo, or alternative treatment.',
    he: 'למה משווים? יכול להיות טיפול סטנדרטי, פלצבו או טיפול חלופי.',
    example_en: 'Standard antidepressant therapy',
    example_he: 'טיפול סטנדרטי נוגד דיכאון',
  },
  O: {
    en: 'What outcome are you measuring? Include measurement tool if possible.',
    he: 'איזו תוצאה אתה מודד? כלול כלי מדידה אם אפשר.',
    example_en: 'Depression severity (PHQ-9 scores)',
    example_he: 'חומרת דיכאון (ציוני PHQ-9)',
  },
  E: {
    en: 'Describe the exposure or risk factor being investigated.',
    he: 'תאר את החשיפה או גורם הסיכון הנחקר.',
    example_en: 'Chronic aircraft noise exposure (≥60 dB)',
    example_he: 'חשיפה כרונית לרעש מטוסים (≥60 dB)',
  },
  S: {
    en: 'Describe your sampling strategy and participants.',
    he: 'תאר את אסטרטגיית הדגימה והמשתתפים שלך.',
    example_en: 'Women undergoing IVF treatment in fertility clinics',
    example_he: 'נשים העוברות טיפולי הפריה חוץ גופית במרפאות פוריות',
  },
  PI: {
    en: 'What phenomenon or experience are you exploring?',
    he: 'איזו תופעה או חוויה אתה חוקר?',
    example_en: 'Emotional and psychological challenges during IVF',
    example_he: 'אתגרים רגשיים ופסיכולוגיים במהלך הפריה חוץ גופית',
  },
  Co: {
    en: 'Describe the condition or health issue.',
    he: 'תאר את המצב או הבעיה הבריאותית.',
    example_en: 'Anxiety disorders',
    example_he: 'הפרעות חרדה',
  },
  Pop: {
    en: 'Define the population being studied.',
    he: 'הגדר את האוכלוסייה הנחקרת.',
    example_en: 'Elderly patients in primary care',
    example_he: 'חולים קשישים ברפואה ראשונית',
  },
}

// ============================================================================
// Main Component
// ============================================================================

export function Step2DynamicFields() {
  const language = useWizardStore((state) => state.language)
  const framework = useWizardStore((state) => state.framework)
  const extraction = useWizardStore((state) => state.extraction)
  const updateComponent = useWizardStore((state) => state.updateComponent)
  const setValidationError = useWizardStore((state) => state.setValidationError)

  const handleComponentChange = (key: string, value: string) => {
    updateComponent(key, value)

    // Simple validation: required fields must not be empty
    const component = extraction.components.find((c) => c.key === key)
    if (component?.isRequired && value.trim().length === 0) {
      setValidationError(key, 'This field is required')
    } else if (value.trim().length > 0 && value.trim().length < 5) {
      setValidationError(key, 'Please provide at least 5 characters')
    } else {
      setValidationError(key, null)
    }
  }

  const getFieldStatus = (key: string) => {
    const component = extraction.components.find((c) => c.key === key)
    const hasValue = component && component.value.trim().length > 0
    const hasError = extraction.validationErrors[key]

    if (hasError) return 'error'
    if (hasValue) return 'valid'
    if (component?.isRequired) return 'required'
    return 'optional'
  }

  const textDirection = language === 'he' ? 'rtl' : 'ltr'

  return (
    <div className="space-y-6">
      <StepHeader
        title={language === 'he' ? 'מלא את הרכיבים' : 'Fill Components'}
        description={
          language === 'he'
            ? `מלא את כל רכיבי ${framework.type || 'המסגרת'}. הרכיבים המסומנים בכוכבית (*) הם חובה.`
            : `Fill out all ${framework.type || 'framework'} components. Required fields are marked with an asterisk (*).`
        }
      />

      {/* Component Fields */}
      <div className="space-y-4">
        {extraction.components.map((component) => {
          const status = getFieldStatus(component.key)
          const helpText = COMPONENT_HELP[component.key as keyof typeof COMPONENT_HELP]

          return (
            <Card
              key={component.key}
              className={cn({
                'border-destructive': status === 'error',
                'border-success': status === 'valid',
              })}
            >
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Label with Required Badge and Help */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={component.key} className="text-base font-semibold">
                        {component.key} - {component.label}
                      </Label>
                      {component.isRequired ? (
                        <Badge variant="destructive" className="text-xs">
                          *{' '}
                          {language === 'he' ? 'חובה' : 'Required'}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {language === 'he' ? 'אופציונלי' : 'Optional'}
                        </Badge>
                      )}
                    </div>

                    {/* Help Tooltip */}
                    {helpText && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground">
                              <HelpCircle className="h-4 w-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="left"
                            className="max-w-xs"
                            dir={textDirection}
                          >
                            <p className="text-sm mb-2">
                              {language === 'he' ? helpText.he : helpText.en}
                            </p>
                            <p className="text-xs text-muted-foreground italic">
                              {language === 'he'
                                ? 'דוגמה: '
                                : 'Example: '}
                              {language === 'he'
                                ? helpText.example_he
                                : helpText.example_en}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>

                  {/* Textarea */}
                  <Textarea
                    id={component.key}
                    value={component.value}
                    onChange={(e) =>
                      handleComponentChange(component.key, e.target.value)
                    }
                    placeholder={component.placeholder || `Enter ${component.label}...`}
                    dir={textDirection}
                    rows={3}
                    className={cn('resize-none', {
                      'border-destructive': status === 'error',
                      'border-success': status === 'valid',
                    })}
                  />

                  {/* Status Message */}
                  <div className="flex items-center gap-2 min-h-[20px]">
                    {status === 'error' && (
                      <>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <span className="text-sm text-destructive">
                          {extraction.validationErrors[component.key]}
                        </span>
                      </>
                    )}
                    {status === 'valid' && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" />
                        <span className="text-sm text-success">
                          {language === 'he' ? 'תקין' : 'Valid'}
                        </span>
                      </>
                    )}
                    {status === 'required' && (
                      <span className="text-sm text-muted-foreground">
                        {language === 'he'
                          ? 'שדה זה נדרש'
                          : 'This field is required'}
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Completion Status */}
      <Card className={cn('bg-muted/30', {
        'border-success bg-success/5': extraction.isComplete,
      })}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-3">
            {extraction.isComplete ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-success" />
                <p className="text-sm font-medium text-success">
                  {language === 'he'
                    ? 'כל השדות החובה מולאו! לחץ "הבא" להמשיך'
                    : 'All required fields completed! Click "Next" to continue'}
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-warning" />
                <p className="text-sm text-muted-foreground">
                  {language === 'he'
                    ? 'אנא מלא את כל השדות החובה להמשך'
                    : 'Please fill all required fields to continue'}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
