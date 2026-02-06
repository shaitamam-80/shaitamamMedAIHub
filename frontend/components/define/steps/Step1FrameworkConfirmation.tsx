/**
 * Define Tool v3.0 - Step 1: Framework Confirmation
 * ==================================================
 *
 * User reviews and confirms the detected framework.
 *
 * Features:
 * - Display detected framework with explanation
 * - Show confidence level
 * - Allow manual framework change (dropdown with all 17+ frameworks)
 * - Educational tooltips
 * - Alternative framework suggestions
 */

'use client'

import React, { useState } from 'react'
import { useWizardStore } from '@/lib/stores/useWizardStore'
import { StepHeader } from '../WizardContainer'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  BookOpen,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FrameworkType } from '@/lib/types/wizard.types'

// ============================================================================
// All Available Frameworks
// ============================================================================

const ALL_FRAMEWORKS: Record<string, { description: string; use_case: string }> = {
  // PICO Family
  PICO: {
    description: 'Population, Intervention, Comparison, Outcome',
    use_case: 'Therapy/intervention effectiveness questions',
  },
  PICOT: {
    description: 'PICO + Time',
    use_case: 'Intervention questions with explicit time component',
  },
  PICOS: {
    description: 'PICO + Study design',
    use_case: 'When study design is a key inclusion criterion',
  },
  PICOC: {
    description: 'PICO + Context',
    use_case: 'When setting/context is critical',
  },
  PICOTS: {
    description: 'Comprehensive PICO + Time + Study design',
    use_case: 'Complex systematic reviews',
  },

  // JBI Standards
  CoCoPop: {
    description: 'Condition, Context, Population',
    use_case: 'Prevalence and frequency questions',
  },
  PEO: {
    description: 'Population, Exposure, Outcome',
    use_case: 'Broad exposure questions without comparison',
  },
  PECO: {
    description: 'Population, Exposure, Comparison, Outcome',
    use_case: 'Etiology and risk factor questions',
  },
  PFO: {
    description: 'Population, Factor, Outcome',
    use_case: 'Prognosis and outcome prediction',
  },
  PIRD: {
    description: 'Population, Index test, Reference standard, Diagnosis',
    use_case: 'Diagnostic accuracy questions',
  },
  PCC: {
    description: 'Population, Concept, Context',
    use_case: 'Scoping reviews and concept exploration',
  },
  PICo: {
    description: 'Population, Interest, Context',
    use_case: 'Qualitative questions about experiences',
  },

  // Qualitative
  SPIDER: {
    description: 'Sample, Phenomenon, Design, Evaluation, Research type',
    use_case: 'Qualitative research and lived experiences',
  },
  SPICE: {
    description: 'Setting, Perspective, Intervention, Comparison, Evaluation',
    use_case: 'Health services and policy questions',
  },

  // Policy/Complex
  ECLIPSE: {
    description: 'Expectation, Client, Location, Impact, Professionals, Service',
    use_case: 'Health services research',
  },
  CIMO: {
    description: 'Context, Intervention, Mechanism, Outcome',
    use_case: 'Realist synthesis and complex interventions',
  },

  // Specialized
  BeHEMoTh: {
    description: 'Behavior, Health context, Exclusions, Models/Theories',
    use_case: 'Behavioral research questions',
  },
  PerSPEcTiF: {
    description: 'Person, Setting, Perspective, Intervention/Exposure, Comparison, Time, Findings',
    use_case: 'Mixed methods and diverse study designs',
  },
  'PICOT-D': {
    description: 'PICOT + Data analysis plan',
    use_case: 'Systematic reviews with meta-analysis',
  },
  'PICOTS-ComTeC': {
    description: 'Comprehensive PICOTS + Commercial + Technical constraints',
    use_case: 'Technology and commercial considerations',
  },
}

// ============================================================================
// Main Component
// ============================================================================

export function Step1FrameworkConfirmation() {
  const language = useWizardStore((state) => state.language)
  const framework = useWizardStore((state) => state.framework)
  const setFramework = useWizardStore((state) => state.setFramework)

  const [selectedFramework, setSelectedFramework] = useState<string>(
    framework.type || 'PICO'
  )

  const handleFrameworkChange = (newFramework: string) => {
    setSelectedFramework(newFramework)

    // Update framework in store with new schema
    const mockSchema = {
      name: newFramework,
      description: ALL_FRAMEWORKS[newFramework].description,
      use_case: ALL_FRAMEWORKS[newFramework].use_case,
      components: ['P', 'I', 'C', 'O'], // TODO: Get actual components from API
      labels: {
        P: 'Population',
        I: 'Intervention',
        C: 'Comparison',
        O: 'Outcome',
      },
      trigger_words: [],
    }

    setFramework(newFramework as FrameworkType, mockSchema, 'medium')
  }

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-success">High Confidence</Badge>
      case 'medium':
        return <Badge variant="secondary">Medium Confidence</Badge>
      case 'low':
        return <Badge variant="outline">Low Confidence</Badge>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <StepHeader
        title={language === 'he' ? 'אישור מסגרת' : 'Confirm Framework'}
        description={
          language === 'he'
            ? 'בדוק שהמסגרת שזוהתה מתאימה למחקר שלך'
            : 'Verify that the detected framework matches your research question'
        }
      />

      {/* Detected Framework Card */}
      <Card className="border-wizard-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-wizard-primary" />
              {language === 'he' ? 'מסגרת שזוהתה' : 'Detected Framework'}
            </CardTitle>
            {framework.confidence && getConfidenceBadge(framework.confidence)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Framework Name */}
          <div>
            <h3 className="text-2xl font-bold text-wizard-primary">
              {framework.type || selectedFramework}
            </h3>
            <p className="text-sm text-muted-foreground">
              {framework.schema?.description ||
                ALL_FRAMEWORKS[selectedFramework]?.description}
            </p>
          </div>

          {/* Use Case */}
          <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
            <Lightbulb className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">Best For:</p>
              <p className="text-sm text-muted-foreground">
                {framework.schema?.use_case ||
                  ALL_FRAMEWORKS[selectedFramework]?.use_case}
              </p>
            </div>
          </div>

          {/* AI Reasoning (if available) */}
          {framework.clarificationAnswers &&
            Object.keys(framework.clarificationAnswers).length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-wizard-primary/5 rounded-lg border border-wizard-primary/20">
                <AlertCircle className="h-4 w-4 text-wizard-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Why This Framework?</p>
                  <p className="text-sm text-muted-foreground">
                    Based on your research goal, this framework is most appropriate
                    for structuring your question.
                  </p>
                </div>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Manual Framework Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4" />
            {language === 'he'
              ? 'רוצה לשנות מסגרת?'
              : 'Want to Change Framework?'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {language === 'he'
                ? 'אתה יכול לבחור מסגרת אחרת אם אתה מעדיף'
                : 'You can select a different framework if you prefer'}
            </p>

            <Select
              value={selectedFramework}
              onValueChange={handleFrameworkChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {/* PICO Family */}
                <SelectItem value="PICO" className="font-medium">
                  PICO
                </SelectItem>
                <SelectItem value="PICOT">└─ PICOT</SelectItem>
                <SelectItem value="PICOS">└─ PICOS</SelectItem>
                <SelectItem value="PICOC">└─ PICOC</SelectItem>
                <SelectItem value="PICOTS">└─ PICOTS</SelectItem>

                {/* JBI Standards */}
                <SelectItem value="CoCoPop" className="font-medium mt-2">
                  CoCoPop
                </SelectItem>
                <SelectItem value="PEO" className="font-medium">
                  PEO
                </SelectItem>
                <SelectItem value="PECO" className="font-medium">
                  PECO
                </SelectItem>
                <SelectItem value="PFO" className="font-medium">
                  PFO
                </SelectItem>
                <SelectItem value="PIRD" className="font-medium">
                  PIRD
                </SelectItem>
                <SelectItem value="PCC" className="font-medium">
                  PCC
                </SelectItem>
                <SelectItem value="PICo" className="font-medium">
                  PICo
                </SelectItem>

                {/* Qualitative */}
                <SelectItem value="SPIDER" className="font-medium mt-2">
                  SPIDER
                </SelectItem>
                <SelectItem value="SPICE" className="font-medium">
                  SPICE
                </SelectItem>

                {/* Policy/Complex */}
                <SelectItem value="ECLIPSE" className="font-medium mt-2">
                  ECLIPSE
                </SelectItem>
                <SelectItem value="CIMO" className="font-medium">
                  CIMO
                </SelectItem>

                {/* Specialized */}
                <SelectItem value="BeHEMoTh" className="font-medium mt-2">
                  BeHEMoTh
                </SelectItem>
                <SelectItem value="PerSPEcTiF" className="font-medium">
                  PerSPEcTiF
                </SelectItem>
                <SelectItem value="PICOT-D" className="font-medium">
                  PICOT-D
                </SelectItem>
                <SelectItem value="PICOTS-ComTeC" className="font-medium">
                  PICOTS-ComTeC
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Selected Framework Info */}
            {selectedFramework !== framework.type && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedFramework}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {ALL_FRAMEWORKS[selectedFramework]?.description}
                </p>
                <p className="text-xs text-muted-foreground italic mt-1">
                  {ALL_FRAMEWORKS[selectedFramework]?.use_case}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Continue Message */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <p className="text-sm text-center text-muted-foreground">
            {language === 'he'
              ? 'לחץ "הבא" כדי להמשיך למילוי רכיבי המסגרת'
              : 'Click "Next" to continue filling out the framework components'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
