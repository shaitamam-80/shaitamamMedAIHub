'use client';

import { Sparkles } from 'lucide-react';
import type { FormulatedQuestion } from '@/lib/api';

interface FinerCardV2Props {
  question: FormulatedQuestion;
  language: 'he' | 'en';
}

const TYPE_LABELS = {
  broad: { en: 'Broad', he: 'ניסוח רחב' },
  focused: { en: 'Focused', he: 'ניסוח ממוקד' },
  alternative: { en: 'Alternative', he: 'זווית חלופית' },
};

export function FinerCardV2({ question, language }: FinerCardV2Props) {
  const isHebrew = language === 'he';
  const assessment = question.finer_assessment;
  const score = assessment?.overall_score ?? 0;

  // When language is English, don't show Hebrew text even if AI provided it
  const showHebrew = isHebrew && question.hebrew;
  const questionHebrew = showHebrew ? question.hebrew : null;

  // Color based on score
  const isHighScore = score >= 80;
  const scoreColorClass = isHighScore ? 'bg-green-500' : 'bg-yellow-500';
  const scoreTextClass = isHighScore ? 'text-green-600' : 'text-yellow-600';
  const iconBgClass = isHighScore ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700';

  // Get title based on question type
  const title = isHebrew
    ? TYPE_LABELS[question.type]?.he || question.type
    : TYPE_LABELS[question.type]?.en || question.type;

  return (
    <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-300 relative overflow-hidden group">
      {/* Top colored bar based on score */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 ${scoreColorClass}`} />

      {/* Score header */}
      <div className="flex justify-between items-center mb-3 pt-1">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${iconBgClass}`}>
            <Sparkles size={16} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-muted-foreground">
            FINER Score
          </span>
        </div>
        <span className={`text-xl font-black ${scoreTextClass}`}>
          {score}
        </span>
      </div>

      {/* Title */}
      <h3
        className={`text-gray-900 dark:text-foreground font-bold text-base mb-3 leading-snug ${isHebrew ? 'text-right' : 'text-left'}`}
        dir={isHebrew ? 'rtl' : 'ltr'}
      >
        {title}
      </h3>

      {/* Question blocks */}
      <div className="space-y-2 mt-auto">
        {/* Hebrew question - purple border (only show if Hebrew AND language is Hebrew) */}
        {questionHebrew && (
          <div className="bg-gray-50 dark:bg-muted/30 p-2.5 rounded-lg border-r-4 border-purple-500 text-right">
            <p className="text-sm text-gray-700 dark:text-foreground font-medium leading-relaxed" dir="rtl">
              {questionHebrew}
            </p>
          </div>
        )}

        {/* English question - blue border */}
        {/* If Hebrew is shown: show as translation (smaller). If no Hebrew shown: show as primary (larger) */}
        {question.english && (
          <div className={`p-2.5 rounded-lg border-l-4 border-blue-500 text-left ${
            questionHebrew
              ? 'bg-blue-50 dark:bg-blue-950/30'
              : 'bg-gray-50 dark:bg-muted/30'
          }`}>
            <p
              className={`text-blue-900 dark:text-blue-200 font-medium leading-relaxed ${
                questionHebrew
                  ? 'text-xs font-mono'
                  : 'text-sm'
              }`}
              dir="ltr"
            >
              {question.english}
            </p>
          </div>
        )}
      </div>

      {/* FINER breakdown on hover - mini indicators */}
      {assessment && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-border">
          <div className="flex gap-1">
            {(['F', 'I', 'N', 'E', 'R'] as const).map((key) => {
              const itemScore = assessment[key]?.score;
              const bgColor = itemScore === 'high'
                ? 'bg-green-500'
                : itemScore === 'medium'
                  ? 'bg-yellow-500'
                  : 'bg-red-500';
              return (
                <div
                  key={key}
                  className="flex-1 flex flex-col items-center gap-1"
                  title={assessment[key]?.reason}
                >
                  <span className="text-[9px] font-bold text-gray-400">{key}</span>
                  <div className={`w-full h-1 rounded-full ${bgColor}`} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Export the cards column component for side-by-side layout
interface FinerCardsColumnProps {
  questions: FormulatedQuestion[];
  language: 'he' | 'en';
}

export function FinerCardsColumn({ questions, language }: FinerCardsColumnProps) {
  const isHebrew = language === 'he';

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className={`flex items-center gap-2 px-1 opacity-70 ${isHebrew ? 'flex-row-reverse justify-start' : 'flex-row justify-start'}`}>
        <Sparkles size={14} className="text-purple-500" />
        <span className="text-xs font-semibold text-gray-500 dark:text-muted-foreground">
          {isHebrew ? 'הצעות FINER' : 'FINER Suggestions'}
        </span>
      </div>

      {/* Cards */}
      {questions.map((question, idx) => (
        <FinerCardV2 key={idx} question={question} language={language} />
      ))}
    </div>
  );
}
