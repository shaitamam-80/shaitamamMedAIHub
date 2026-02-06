/**
 * Define Tool v3.0 - Step 0: Welcome & Free Input
 * ================================================
 *
 * First step where user:
 * 1. Selects language (EN/HE)
 * 2. Enters research question idea in natural language
 * 3. AI detects appropriate framework
 *
 * Features:
 * - RTL/LTR auto-detection
 * - Character counter
 * - Example questions dropdown
 * - Framework detection with clarification support
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useWizardStore } from '@/lib/stores/useWizardStore'
import { StepHeader } from '../WizardContainer'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Sparkles, Languages, Lightbulb } from 'lucide-react'
import { detectFramework, clarifyFramework } from '@/lib/api/define-v3'
import type { Language } from '@/lib/types/wizard.types'

// ============================================================================
// Example Questions
// ============================================================================

const EXAMPLE_QUESTIONS = {
  en: [
    {
      text: 'Does exercise help elderly people with depression?',
      framework: 'PICO',
    },
    {
      text: 'Is living near airports associated with mental health problems?',
      framework: 'PECO',
    },
    {
      text: 'What are the experiences of women undergoing IVF treatment?',
      framework: 'SPIDER',
    },
    {
      text: 'What is the prevalence of anxiety in primary care patients?',
      framework: 'CoCoPop',
    },
  ],
  he: [
    {
      text: 'האם פעילות גופנית עוזרת לקשישים עם דיכאון?',
      framework: 'PICO',
    },
    {
      text: 'האם גרים ליד שדות תעופה קשור לבעיות נפשיות?',
      framework: 'PECO',
    },
    {
      text: 'מה החוויה של נשים שעוברות הפריה חוץ גופית?',
      framework: 'SPIDER',
    },
    {
      text: 'מהי השכיחות של חרדה בקרב מטופלים ברפואה ראשונית?',
      framework: 'CoCoPop',
    },
  ],
}

// ============================================================================
// Main Component
// ============================================================================

export function Step0Welcome() {
  const projectId = useWizardStore((state) => state.projectId)
  const language = useWizardStore((state) => state.language)
  const setLanguage = useWizardStore((state) => state.setLanguage)
  const setFramework = useWizardStore((state) => state.setFramework)
  const addChatMessage = useWizardStore((state) => state.addChatMessage)
  const chatHistory = useWizardStore((state) => state.chatHistory)
  const setLoading = useWizardStore((state) => state.setLoading)
  const setError = useWizardStore((state) => state.setError)
  const nextStep = useWizardStore((state) => state.nextStep)

  const [userInput, setUserInput] = useState('')
  const [clarificationQuestion, setClarificationQuestion] = useState<string | null>(null)
  const [clarificationAnswer, setClarificationAnswer] = useState('')

  // Auto-detect text direction (RTL for Hebrew)
  const textDirection = language === 'he' ? 'rtl' : 'ltr'
  const charCount = userInput.length
  const minChars = 10
  const maxChars = 500

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleDetectFramework = async () => {
    if (charCount < minChars) {
      setError(`Please enter at least ${minChars} characters`)
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Add user message to chat history
      addChatMessage({
        role: 'user',
        content: userInput,
        timestamp: new Date(),
      })

      // Call detection API
      const result = await detectFramework({
        projectId,
        userInput,
        language,
        chatHistory,
      })

      // Add AI response to chat history
      addChatMessage({
        role: 'assistant',
        content: result.reasoning,
        timestamp: new Date(),
      })

      if (result.clarificationNeeded && result.clarificationQuestion) {
        // Show clarification question
        setClarificationQuestion(result.clarificationQuestion)
      } else if (result.frameworkType) {
        // Framework detected - fetch schema and move to next step
        await handleFrameworkDetected(result.frameworkType, result.confidence)
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to detect framework')
    } finally {
      setLoading(false)
    }
  }

  const handleClarificationSubmit = async () => {
    if (!clarificationAnswer.trim()) {
      setError('Please provide an answer')
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Add clarification answer to chat
      addChatMessage({
        role: 'user',
        content: clarificationAnswer,
        timestamp: new Date(),
      })

      // Call clarification API
      const result = await clarifyFramework({
        projectId,
        answer: clarificationAnswer,
        language,
        chatHistory,
      })

      // Add AI response
      addChatMessage({
        role: 'assistant',
        content: result.reasoning,
        timestamp: new Date(),
      })

      if (result.needsMoreClarification && result.clarificationQuestion) {
        // More clarification needed
        setClarificationQuestion(result.clarificationQuestion)
        setClarificationAnswer('')
      } else {
        // Framework finalized
        await handleFrameworkDetected(result.frameworkType, result.confidence)
      }
    } catch (error: any) {
      setError(error.response?.data?.detail || 'Failed to process clarification')
    } finally {
      setLoading(false)
    }
  }

  const handleFrameworkDetected = async (
    frameworkType: string,
    confidence: 'high' | 'medium' | 'low'
  ) => {
    try {
      // Fetch framework schema from API
      const { getFrameworkSchemas } = await import('@/lib/api/define-v3')
      const { frameworks } = await getFrameworkSchemas()

      const schema = frameworks[frameworkType]

      if (!schema) {
        // Fallback to mock if framework not found (shouldn't happen)
        console.warn(`Framework ${frameworkType} not found in API, using fallback`)
        const mockSchema = {
          name: frameworkType,
          description: `${frameworkType} framework`,
          use_case: 'Research question formulation',
          components: ['P', 'I', 'C', 'O'],
          labels: {
            P: 'Population',
            I: 'Intervention',
            C: 'Comparison',
            O: 'Outcome',
          },
          trigger_words: [],
        }
        setFramework(frameworkType as any, mockSchema, confidence)
      } else {
        setFramework(frameworkType as any, schema, confidence)
      }

      setClarificationQuestion(null)
      nextStep()
    } catch (error) {
      console.error('Failed to fetch framework schema:', error)
      setError('Failed to load framework schema')
    }
  }

  const handleExampleClick = (exampleText: string) => {
    setUserInput(exampleText)
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-6">
      <StepHeader
        title={language === 'he' ? 'ברוכים הבאים' : 'Welcome'}
        description={
          language === 'he'
            ? 'תאר את רעיון המחקר שלך בשפה טבעית, והמערכת תזהה את המסגרת המתאימה'
            : 'Describe your research idea in natural language, and the system will identify the appropriate framework'
        }
      />

      {/* Language Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Languages className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <Label htmlFor="language">Language</Label>
              <Select
                value={language}
                onValueChange={(value) => setLanguage(value as Language)}
              >
                <SelectTrigger id="language" className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="he">עברית</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Input Area */}
      {!clarificationQuestion ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div>
              <Label htmlFor="research-idea">
                {language === 'he'
                  ? 'תאר את רעיון המחקר שלך'
                  : 'Describe your research idea'}
              </Label>
              <Textarea
                id="research-idea"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={
                  language === 'he'
                    ? 'לדוגמה: אני רוצה לחקור האם פעילות גופנית עוזרת לקשישים עם דיכאון...'
                    : 'Example: I want to study whether exercise helps elderly people with depression...'
                }
                dir={textDirection}
                rows={6}
                className="resize-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span
                  className={`text-sm ${
                    charCount < minChars
                      ? 'text-destructive'
                      : charCount > maxChars
                      ? 'text-warning'
                      : 'text-muted-foreground'
                  }`}
                >
                  {charCount} / {maxChars} characters
                  {charCount < minChars && ` (min ${minChars})`}
                </span>
              </div>
            </div>

            <Button
              onClick={handleDetectFramework}
              disabled={charCount < minChars || charCount > maxChars}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              {language === 'he' ? 'זהה מסגרת' : 'Detect Framework'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Clarification Question */
        <Card className="border-wizard-primary">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-5 w-5 text-wizard-primary mt-0.5" />
              <div className="flex-1">
                <Label>
                  {language === 'he'
                    ? 'נדרשת הבהרה'
                    : 'Clarification Needed'}
                </Label>
                <p className="text-sm text-muted-foreground mt-1" dir={textDirection}>
                  {clarificationQuestion}
                </p>
              </div>
            </div>

            <Textarea
              value={clarificationAnswer}
              onChange={(e) => setClarificationAnswer(e.target.value)}
              placeholder={
                language === 'he' ? 'הקלד את התשובה שלך...' : 'Type your answer...'
              }
              dir={textDirection}
              rows={3}
            />

            <Button
              onClick={handleClarificationSubmit}
              disabled={!clarificationAnswer.trim()}
              className="w-full"
            >
              {language === 'he' ? 'שלח תשובה' : 'Submit Answer'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Example Questions */}
      <Card>
        <CardContent className="pt-6">
          <Label className="mb-3 block">
            {language === 'he' ? 'דוגמאות לשאלות מחקר' : 'Example Questions'}
          </Label>
          <div className="grid gap-2">
            {EXAMPLE_QUESTIONS[language].map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleClick(example.text)}
                className="text-left p-3 rounded-md border hover:bg-muted/50 transition-colors"
                dir={textDirection}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm flex-1">{example.text}</p>
                  <Badge variant="outline" className="text-xs">
                    {example.framework}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
