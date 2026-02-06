/**
 * Define Tool v3.0 - Step 5: Save & Export
 * ==========================================
 *
 * Final step where user:
 * 1. Names their project
 * 2. Saves to database
 * 3. Exports research question
 *
 * Features:
 * - Project name input with validation
 * - One-click save to database
 * - Export options (copy to clipboard, download .txt)
 * - Navigation to Query Tool or start new question
 * - Success confirmation with celebration
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useWizardStore, useFrameworkData } from '@/lib/stores/useWizardStore'
import { StepHeader } from '../WizardContainer'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  Save,
  Sparkles,
  FileText,
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { cn } from '@/lib/utils'

// ============================================================================
// Main Component
// ============================================================================

export function Step5SaveExport() {
  const language = useWizardStore((state) => state.language)
  const projectId = useWizardStore((state) => state.projectId)
  const framework = useWizardStore((state) => state.framework)
  const frameworkData = useFrameworkData()
  const questions = useWizardStore((state) => state.questions)
  const finer = useWizardStore((state) => state.finer)
  const setLoading = useWizardStore((state) => state.setLoading)
  const setError = useWizardStore((state) => state.setError)
  const isLoading = useWizardStore((state) => state.isLoading)
  const resetWizard = useWizardStore((state) => state.resetWizard)

  const [projectName, setProjectName] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // Auto-generate project name from framework
  useEffect(() => {
    if (!projectName && framework.type && frameworkData.P) {
      const suggestion = `${framework.type} - ${frameworkData.P.substring(0, 50)}...`
      setProjectName(suggestion)
    }
  }, [])

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleSave = async () => {
    if (!projectName.trim()) {
      setError('Please enter a project name')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Update project with final data
      await apiClient.updateProject(projectId, {
        name: projectName.trim(),
        framework_type: framework.type!,
        framework_data: {
          ...frameworkData,
          selected_question: questions?.narrow.text, // Default to narrow
          finer_assessment: finer,
        },
      })

      setIsSaved(true)
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to save project')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyToClipboard = async () => {
    const exportText = generateExportText()
    try {
      await navigator.clipboard.writeText(exportText)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (error) {
      setError('Failed to copy to clipboard')
    }
  }

  const handleDownload = () => {
    const exportText = generateExportText()
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${projectName || 'research-question'}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleStartNew = () => {
    resetWizard()
  }

  const generateExportText = (): string => {
    const lines: string[] = []

    lines.push('=' .repeat(80))
    lines.push(`Research Question - ${projectName || 'Untitled'}`)
    lines.push('=' .repeat(80))
    lines.push('')

    // Framework
    lines.push(`Framework: ${framework.type}`)
    lines.push(`Confidence: ${framework.confidence}`)
    lines.push('')

    // Components
    lines.push('Framework Components:')
    lines.push('-'.repeat(80))
    Object.entries(frameworkData).forEach(([key, value]) => {
      if (value) {
        const label = framework.schema?.labels?.[key] || key
        lines.push(`${key} - ${label}: ${value}`)
      }
    })
    lines.push('')

    // Selected Question
    if (questions) {
      lines.push('Research Question (Narrow):')
      lines.push('-'.repeat(80))
      lines.push(questions.narrow.text)
      lines.push('')
      lines.push(`Use Case: ${questions.narrow.use_case}`)
      lines.push(`Explanation: ${questions.narrow.explanation}`)
      lines.push('')

      lines.push('Alternative Formulations:')
      lines.push('-'.repeat(80))
      lines.push('')
      lines.push('Broad (Exploratory):')
      lines.push(questions.broad.text)
      lines.push('')
      lines.push('Clinical (Practical):')
      lines.push(questions.clinical.text)
      lines.push('')
    }

    // FINER Assessment
    if (finer) {
      lines.push('FINER Assessment:')
      lines.push('-'.repeat(80))
      lines.push(`Overall Recommendation: ${finer.recommendation.toUpperCase()}`)
      lines.push('')
      lines.push(finer.reasoning)
      lines.push('')

      lines.push('Detailed Scores:')
      lines.push(`  F - Feasible: ${finer.F.score} - ${finer.F.reason}`)
      lines.push(`  I - Interesting: ${finer.I.score} - ${finer.I.reason}`)
      lines.push(`  N - Novel: ${finer.N.score} - ${finer.N.reason}`)
      lines.push(`  E - Ethical: ${finer.E.score} - ${finer.E.reason}`)
      lines.push(`  R - Relevant: ${finer.R.score} - ${finer.R.reason}`)
      lines.push('')

      if (finer.suggestions && finer.suggestions.length > 0) {
        lines.push('Suggestions for Improvement:')
        finer.suggestions.forEach((suggestion, index) => {
          lines.push(`  ${index + 1}. ${suggestion}`)
        })
        lines.push('')
      }
    }

    lines.push('=' .repeat(80))
    lines.push(`Generated by MedAI Hub - Define Tool v3.0`)
    lines.push(`Date: ${new Date().toLocaleString()}`)
    lines.push('=' .repeat(80))

    return lines.join('\n')
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-6">
      <StepHeader
        title={language === 'he' ? 'שמור וייצא' : 'Save & Export'}
        description={
          language === 'he'
            ? 'תן שם לפרויקט שלך ושמור או ייצא את שאלת המחקר'
            : 'Name your project and save or export your research question'
        }
      />

      {!isSaved ? (
        <>
          {/* Project Name */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label htmlFor="project-name">
                  {language === 'he' ? 'שם הפרויקט' : 'Project Name'}
                </Label>
                <Input
                  id="project-name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder={
                    language === 'he'
                      ? 'לדוגמה: מחקר פעילות גופנית בקשישים'
                      : 'Example: Exercise in Elderly Depression Study'
                  }
                  dir={language === 'he' ? 'rtl' : 'ltr'}
                />
              </div>

              <Button
                onClick={handleSave}
                disabled={!projectName.trim() || isLoading}
                className="w-full gap-2"
                size="lg"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {language === 'he' ? 'שמור פרויקט' : 'Save Project'}
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {language === 'he' ? 'תצוגה מקדימה' : 'Preview'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Framework Badge */}
              <div className="flex items-center gap-2">
                <Badge variant="outline">{framework.type}</Badge>
                <Badge
                  variant={
                    framework.confidence === 'high'
                      ? 'default'
                      : framework.confidence === 'medium'
                      ? 'secondary'
                      : 'outline'
                  }
                  className="capitalize"
                >
                  {framework.confidence} confidence
                </Badge>
              </div>

              {/* Selected Question */}
              {questions && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    {language === 'he' ? 'שאלת המחקר:' : 'Research Question:'}
                  </p>
                  <p className="text-sm leading-relaxed">{questions.narrow.text}</p>
                </div>
              )}

              {/* FINER Badge */}
              {finer && (
                <div className="flex items-center justify-between p-3 bg-muted rounded-md">
                  <span className="text-sm font-medium">
                    {language === 'he' ? 'הערכת FINER:' : 'FINER Assessment:'}
                  </span>
                  <Badge
                    variant={
                      finer.recommendation === 'proceed'
                        ? 'default'
                        : finer.recommendation === 'revise'
                        ? 'secondary'
                        : 'destructive'
                    }
                    className="capitalize"
                  >
                    {finer.recommendation}
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        /* Success State */
        <>
          <Card className="border-success bg-success/10">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-success" />
                <div>
                  <h3 className="text-xl font-semibold mb-2">
                    {language === 'he'
                      ? '🎉 הפרויקט נשמר בהצלחה!'
                      : '🎉 Project Saved Successfully!'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {language === 'he'
                      ? 'שאלת המחקר שלך מוכנה לשימוש'
                      : 'Your research question is ready to use'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardHeader>
              <CardTitle>
                {language === 'he' ? 'ייצא את הפרויקט' : 'Export Project'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleCopyToClipboard}
                variant="outline"
                className="w-full gap-2"
              >
                {isCopied ? (
                  <CheckCircle2 className="h-4 w-4 text-success" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {isCopied
                  ? language === 'he'
                    ? 'הועתק!'
                    : 'Copied!'
                  : language === 'he'
                  ? 'העתק ללוח'
                  : 'Copy to Clipboard'}
              </Button>

              <Button
                onClick={handleDownload}
                variant="outline"
                className="w-full gap-2"
              >
                <Download className="h-4 w-4" />
                {language === 'he' ? 'הורד כקובץ טקסט' : 'Download as Text File'}
              </Button>
            </CardContent>
          </Card>

          {/* Next Actions */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <p className="text-sm text-center text-muted-foreground mb-4">
                {language === 'he' ? 'מה עכשיו?' : "What's next?"}
              </p>
              <div className="grid gap-3">
                <Button onClick={handleStartNew} variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  {language === 'he' ? 'התחל שאלה חדשה' : 'Start New Question'}
                </Button>

                {/* TODO: Link to Query Tool when ready */}
                <Button variant="default" className="gap-2" disabled>
                  <FileText className="h-4 w-4" />
                  {language === 'he' ? 'עבור לכלי החיפוש' : 'Go to Query Tool'}
                  <Badge variant="secondary" className="ml-2">
                    Coming Soon
                  </Badge>
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
