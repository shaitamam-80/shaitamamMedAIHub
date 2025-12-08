'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Trophy,
  Target,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { FormulatedQuestion } from '@/lib/api';

interface FinerScoreCardProps {
  questions: FormulatedQuestion[];
  language: 'he' | 'en';
}

// Helper functions
const getScoreIcon = (score: 'high' | 'medium' | 'low', size: string = 'h-3 w-3') => {
  switch (score) {
    case 'high':
      return <CheckCircle2 className={`${size} text-green-600`} />;
    case 'medium':
      return <AlertCircle className={`${size} text-amber-500`} />;
    case 'low':
      return <XCircle className={`${size} text-red-500`} />;
  }
};

const getScoreColor = (score: 'high' | 'medium' | 'low') => {
  switch (score) {
    case 'high':
      return 'bg-green-500';
    case 'medium':
      return 'bg-amber-500';
    case 'low':
      return 'bg-red-500';
  }
};

const getRecommendationBg = (rec?: 'proceed' | 'revise' | 'reconsider') => {
  switch (rec) {
    case 'proceed':
      return 'bg-green-500';
    case 'revise':
      return 'bg-amber-500';
    case 'reconsider':
      return 'bg-red-500';
    default:
      return 'bg-gray-400';
  }
};

const TYPE_LABELS = {
  broad: { en: 'Broad', he: 'רחב' },
  focused: { en: 'Focused', he: 'ממוקד' },
  alternative: { en: 'Alternative', he: 'חלופי' },
};

const FINER_KEYS = ['F', 'I', 'N', 'E', 'R'] as const;

// Compact question card - optimized for horizontal display
function CompactQuestionCard({
  question,
  language,
  isRecommended,
}: {
  question: FormulatedQuestion;
  language: 'he' | 'en';
  isRecommended: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isHebrew = language === 'he';
  const assessment = question.finer_assessment;

  if (!assessment) return null;

  return (
    <div
      className={cn(
        'border rounded-lg overflow-hidden transition-all',
        isRecommended ? 'ring-2 ring-primary border-primary' : 'border-border'
      )}
    >
      {/* Compact Header - Score bar */}
      <div className={cn('px-3 py-2 text-white flex items-center justify-between', getRecommendationBg(assessment.recommendation))}>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
            {isHebrew ? TYPE_LABELS[question.type].he : TYPE_LABELS[question.type].en}
          </Badge>
          {isRecommended && (
            <Trophy className="h-4 w-4 text-yellow-300" />
          )}
        </div>
        <span className="font-bold text-lg">
          {assessment.overall_score ?? '—'}
        </span>
      </div>

      {/* Question text - show both Hebrew and English */}
      <div className="px-3 py-2 bg-card space-y-2">
        {/* Hebrew version */}
        {question.hebrew && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5" dir="rtl">🇮🇱 עברית</p>
            <p
              className="text-xs line-clamp-2"
              dir="rtl"
              title={question.hebrew}
            >
              {question.hebrew}
            </p>
          </div>
        )}
        {/* English version */}
        {question.english && (
          <div>
            <p className="text-[10px] text-muted-foreground mb-0.5">🇺🇸 English</p>
            <p
              className="text-xs line-clamp-2"
              dir="ltr"
              title={question.english}
            >
              {question.english}
            </p>
          </div>
        )}
        {/* Fallback if neither exists */}
        {!question.hebrew && !question.english && (
          <p className="text-xs text-muted-foreground italic">
            {isHebrew ? 'אין שאלה זמינה' : 'No question available'}
          </p>
        )}
      </div>

      {/* FINER mini bar */}
      <div className="px-3 py-1.5 bg-muted/30 flex items-center gap-0.5">
        {FINER_KEYS.map((key) => (
          <div
            key={key}
            className={cn(
              'flex-1 h-1.5 rounded-full',
              getScoreColor(assessment[key].score)
            )}
            title={`${key}: ${assessment[key].reason}`}
          />
        ))}
      </div>

      {/* Expand button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-1 text-xs text-muted-foreground hover:bg-muted/50 flex items-center justify-center gap-1 border-t"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 py-2 bg-muted/20 border-t space-y-1.5 text-xs">
          {FINER_KEYS.map((key) => (
            <div key={key} className="flex items-start gap-2">
              <span className="font-medium w-4">{key}</span>
              {getScoreIcon(assessment[key].score)}
              <span className="text-muted-foreground flex-1 line-clamp-1">
                {assessment[key].reason}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Main component - horizontal grid layout
export function FinerScoreCard({ questions, language }: FinerScoreCardProps) {
  const isHebrew = language === 'he';

  // Find the recommended question (highest score)
  const sortedQuestions = [...questions].sort((a, b) => {
    const scoreA = a.finer_assessment?.overall_score ?? 0;
    const scoreB = b.finer_assessment?.overall_score ?? 0;
    return scoreB - scoreA;
  });

  const recommendedIndex = questions.findIndex(
    (q) => q === sortedQuestions[0]
  );

  return (
    <div className="space-y-3">
      {/* Compact Header with comparison bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">
            {isHebrew ? 'הערכת FINER' : 'FINER Assessment'}
          </span>
        </div>

        {/* Mini comparison bars */}
        {questions.length > 1 && (
          <div className="flex items-center gap-2">
            {sortedQuestions.map((q, idx) => (
              <div key={idx} className="flex items-center gap-1" title={`${TYPE_LABELS[q.type][isHebrew ? 'he' : 'en']}: ${q.finer_assessment?.overall_score ?? 0}`}>
                <span className="text-[10px] text-muted-foreground">
                  {TYPE_LABELS[q.type][isHebrew ? 'he' : 'en'].charAt(0)}
                </span>
                <Progress
                  value={q.finer_assessment?.overall_score ?? 0}
                  className="w-12 h-1.5"
                />
                <span className="text-[10px] font-medium">
                  {q.finer_assessment?.overall_score ?? 0}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Question cards in horizontal grid */}
      <div className={cn(
        'grid gap-2',
        questions.length === 1 ? 'grid-cols-1' :
        questions.length === 2 ? 'grid-cols-2' :
        'grid-cols-3'
      )}>
        {questions.map((question, idx) => (
          <CompactQuestionCard
            key={idx}
            question={question}
            language={language}
            isRecommended={idx === recommendedIndex && questions.length > 1}
          />
        ))}
      </div>
    </div>
  );
}
