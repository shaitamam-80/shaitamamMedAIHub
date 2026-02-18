'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { STAGES } from '@/lib/utils/stage-config';
import { cn } from '@/lib/utils';
import { Check, Circle, Loader2, ArrowLeft } from 'lucide-react';
import { getProjectStages, type ProjectStage } from '@/lib/api/backend-client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { type Language } from '@/components/layout/LanguageToggle';

// ── Labels ──────────────────────────────────────────────────────────

const LABELS = {
  backToOverview: { en: 'Back to Overview', he: 'חזרה לסקירה כללית' },
  projectStages: { en: 'Project Stages', he: 'שלבי הפרויקט' },
  stagesDesc: {
    en: '10 stages for systematic review',
    he: '10 שלבים לסקירה שיטתית',
  },
} as const;

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

interface ProjectSidebarProps {
  projectId: string;
}

export default function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const pathname = usePathname();
  const lang = useLanguage();
  const [stageStatuses, setStageStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjectStages(projectId)
      .then((stages) => {
        const statusMap: Record<string, string> = {};
        stages.forEach((s) => {
          statusMap[s.stage_name] = s.status;
        });
        setStageStatuses(statusMap);
      })
      .catch((err) => {
        console.error('Failed to load stages:', err);
      })
      .finally(() => setLoading(false));
  }, [projectId, pathname]);

  const isStageActive = (stageSlug: string) => {
    return pathname.includes(`/stages/${stageSlug}`);
  };

  const isStageCompleted = (stageSlug: string) => {
    return stageStatuses[stageSlug] === 'completed';
  };

  const isStageInProgress = (stageSlug: string) => {
    return stageStatuses[stageSlug] === 'in_progress';
  };

  return (
    <aside className="w-72 border-e bg-background">
      <div className="p-4">
        {/* Header */}
        <Button variant="ghost" size="sm" asChild className="mb-3 -ms-2">
          <Link href={`/projects/${projectId}`}>
            <ArrowLeft className="size-4 me-1" />
            {LABELS.backToOverview[lang]}
          </Link>
        </Button>
        <h2 className="text-sm font-semibold text-foreground mb-0.5">
          {LABELS.projectStages[lang]}
        </h2>
        <p className="text-xs text-muted-foreground mb-3">
          {LABELS.stagesDesc[lang]}
        </p>
        <Separator className="mb-3" />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-5 text-primary animate-spin" />
        </div>
      )}

      {/* Stages List */}
      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="px-4 pb-4 space-y-1">
          {Object.values(STAGES).map((stage) => {
            const isActive = isStageActive(stage.slug);
            const isCompleted = isStageCompleted(stage.slug);
            const isInProgress = isStageInProgress(stage.slug);

            return (
              <Link
                key={stage.slug}
                href={`/projects/${projectId}/stages/${stage.slug}`}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border transition-all',
                  isActive && 'bg-primary/5 border-primary',
                  !isActive && isCompleted && 'bg-emerald-50 border-emerald-200/50',
                  !isActive && isInProgress && 'border-amber-200/50 bg-amber-50',
                  !isActive && !isCompleted && !isInProgress && 'border-transparent hover:border-border hover:bg-accent'
                )}
              >
                {/* Stage number/icon */}
                <div
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    isActive && 'bg-primary text-primary-foreground',
                    !isActive && isCompleted && 'bg-emerald-500 text-white',
                    !isActive && isInProgress && 'bg-amber-500 text-white',
                    !isActive && !isCompleted && !isInProgress && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="size-3.5" />
                  ) : isActive ? (
                    <Circle className="size-2.5 fill-current" />
                  ) : (
                    stage.order
                  )}
                </div>

                {/* Stage info */}
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      'text-sm font-medium leading-tight',
                      isActive && 'text-primary',
                      !isActive && isCompleted && 'text-emerald-600',
                      !isActive && isInProgress && 'text-amber-600',
                      !isActive && !isCompleted && !isInProgress && 'text-foreground'
                    )}
                  >
                    {stage.name[lang]}
                  </div>
                  <div className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {stage.description[lang]}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </ScrollArea>
    </aside>
  );
}
