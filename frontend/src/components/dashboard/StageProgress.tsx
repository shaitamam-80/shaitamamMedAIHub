'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { STAGES } from '@/lib/utils/stage-config';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { type Language } from '@/components/layout/LanguageToggle';

// ── Hook: listen to language changes ──────────────────────────────

function useLanguage(): Language {
  const [lang, setLang] = React.useState<Language>('en');

  React.useEffect(() => {
    const htmlLang = document.documentElement.lang as Language;
    if (htmlLang === 'he' || htmlLang === 'en') setLang(htmlLang);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Language;
      setLang(detail);
    };
    window.addEventListener('languagechange', handler);
    return () => window.removeEventListener('languagechange', handler);
  }, []);

  return lang;
}

// ── Component ──────────────────────────────────────────────────────

interface StageProgressProps {
  currentStage: string;
  completedStages: number;
}

export default function StageProgress({
  currentStage,
  completedStages,
}: StageProgressProps) {
  const lang = useLanguage();

  return (
    <TooltipProvider>
      <div className="relative">
        {/* Progress line */}
        <div className="absolute top-4 right-0 left-0 h-0.5 bg-border" />

        {/* Stages */}
        <div className="relative grid grid-cols-10 gap-1.5">
          {Object.values(STAGES).map((stage, index) => {
            const isCompleted = index < completedStages;
            const isCurrent = stage.slug === currentStage;
            const isUpcoming = index >= completedStages && !isCurrent;

            return (
              <Tooltip key={stage.slug}>
                <TooltipTrigger asChild>
                  <div className="flex flex-col items-center">
                    {/* Stage circle */}
                    <div
                      className={cn(
                        'flex size-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all z-10',
                        isCompleted && 'bg-emerald-500 border-emerald-500 text-white',
                        isCurrent && 'bg-primary border-primary text-primary-foreground animate-pulse',
                        isUpcoming && 'bg-muted border-border text-muted-foreground'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="size-4" />
                      ) : (
                        <span>{stage.order}</span>
                      )}
                    </div>

                    {/* Stage name */}
                    <div className="mt-1.5 text-center">
                      <div
                        className={cn(
                          'text-[10px] font-medium transition-colors line-clamp-2 leading-tight',
                          isCurrent && 'text-primary',
                          isCompleted && 'text-emerald-600',
                          isUpcoming && 'text-muted-foreground'
                        )}
                      >
                        {stage.name[lang]}
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{stage.description[lang]}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
