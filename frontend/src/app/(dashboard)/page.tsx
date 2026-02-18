'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Clock,
  CheckCircle,
  FileText,
  TrendingUp,
  Loader2,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import ProjectCard from '@/components/dashboard/ProjectCard';
import ToolCard from '@/components/tools/ToolCard';
import EmptyState from '@/components/shared/EmptyState';
import { getProjects, type Project } from '@/lib/api/backend-client';
import {
  STAGES,
  STANDALONE_TOOLS,
  STAGE_ORDER,
  STANDALONE_ORDER,
} from '@/lib/utils/stage-config';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { type Language } from '@/components/layout/LanguageToggle';

// ── Labels ──────────────────────────────────────────────────────────

const LABELS = {
  dashboard: { en: 'Dashboard', he: 'לוח בקרה' },
  welcome: {
    en: 'Welcome to MedAI Hub — AI platform for systematic reviews',
    he: 'ברוך הבא ל-MedAI Hub — פלטפורמת AI לסקירות שיטתיות',
  },
  activeProjects: { en: 'Active Projects', he: 'פרויקטים פעילים' },
  totalProjects: { en: 'Total Projects', he: 'סה"כ פרויקטים' },
  status: { en: 'Status', he: 'סטטוס' },
  statusActive: { en: 'Active', he: 'פעיל' },
  statusNew: { en: 'New', he: 'חדש' },
  avgProgress: { en: 'Average Progress', he: 'התקדמות ממוצעת' },
  pipelineTools: { en: 'Pipeline Tools', he: 'כלי Pipeline' },
  pipelineDesc: {
    en: '10 stages from Idea to Manuscript — the full systematic review pipeline',
    he: '10 שלבים מ-Idea עד Manuscript — הצנרת המלאה של סקירה שיטתית',
  },
  standaloneTools: { en: 'Standalone Tools', he: 'כלים עצמאיים' },
  standaloneDesc: {
    en: 'Tools that can be used independently, outside of any project',
    he: 'כלים שניתן להשתמש בהם באופן עצמאי, ללא קשר לפרויקט',
  },
  myProjects: { en: 'My Projects', he: 'הפרויקטים שלי' },
  projectCount: { en: 'projects', he: 'פרויקטים' },
  createFirst: {
    en: 'Create your first project',
    he: 'צור את הפרויקט הראשון שלך',
  },
  allProjects: { en: 'All Projects', he: 'כל הפרויקטים' },
  newProject: { en: 'New Project', he: 'פרויקט חדש' },
  loadingProjects: { en: 'Loading projects...', he: 'טוען פרויקטים...' },
  loadError: {
    en: 'Error loading projects',
    he: 'שגיאה בטעינת הפרויקטים',
  },
  retry: { en: 'Try again', he: 'נסה שוב' },
  noProjectsTitle: { en: 'No projects yet', he: 'אין פרויקטים עדיין' },
  noProjectsDesc: {
    en: 'Create your first project to start a systematic review',
    he: 'צור את הפרויקט הראשון שלך כדי להתחיל סקירה שיטתית',
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

// ── Page Component ─────────────────────────────────────────────────

export default function DashboardPage() {
  const lang = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err) => {
        console.error('Failed to load projects:', err);
        setError(LABELS.loadError.en);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasProjects = projects.length > 0;
  const recentProjects = projects.slice(0, 3);

  // Stats
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const avgProgress =
    projects.length > 0
      ? Math.round(
          projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) /
            projects.length
        )
      : 0;

  const stats = [
    {
      label: LABELS.activeProjects[lang],
      value: String(activeProjects),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10',
    },
    {
      label: LABELS.totalProjects[lang],
      value: String(projects.length),
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-600/10',
    },
    {
      label: LABELS.status[lang],
      value: loading
        ? '...'
        : hasProjects
          ? LABELS.statusActive[lang]
          : LABELS.statusNew[lang],
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-600/10',
    },
    {
      label: LABELS.avgProgress[lang],
      value: `${avgProgress}%`,
      icon: TrendingUp,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-600/10',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* ── Hero ── */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {LABELS.dashboard[lang]}
        </h1>
        <p className="text-muted-foreground">{LABELS.welcome[lang]}</p>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`flex size-9 items-center justify-center rounded-lg ${stat.bgColor}`}
                  >
                    <Icon className={`size-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Pipeline Tools ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {LABELS.pipelineTools[lang]}
            </h2>
            <p className="text-sm text-muted-foreground">
              {LABELS.pipelineDesc[lang]}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {STAGE_ORDER.map((stageName, index) => {
            const stage = STAGES[stageName];
            return (
              <ToolCard
                key={stage.slug}
                tool={stage}
                stepNumber={index + 1}
                lang={lang}
              />
            );
          })}
        </div>
      </section>

      {/* ── Standalone Tools ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {LABELS.standaloneTools[lang]}
            </h2>
            <p className="text-sm text-muted-foreground">
              {LABELS.standaloneDesc[lang]}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STANDALONE_ORDER.map((toolName) => {
            const tool = STANDALONE_TOOLS[toolName];
            return <ToolCard key={tool.slug} tool={tool} lang={lang} />;
          })}
        </div>
      </section>

      <Separator />

      {/* ── Recent Projects ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {LABELS.myProjects[lang]}
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasProjects
                ? `${projects.length} ${LABELS.projectCount[lang]}`
                : LABELS.createFirst[lang]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasProjects && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projects">
                  <span>{LABELS.allProjects[lang]}</span>
                  <ArrowRight className="size-4 ms-1" />
                </Link>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href="/projects/new">
                <Plus className="size-4 me-1" />
                <span>{LABELS.newProject[lang]}</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 text-primary animate-spin" />
            <span className="ml-3 text-muted-foreground text-sm">
              {LABELS.loadingProjects[lang]}
            </span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="border-destructive/50">
            <CardContent className="p-6 text-center">
              <p className="text-destructive text-sm">{LABELS.loadError[lang]}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  getProjects()
                    .then(setProjects)
                    .catch(() => setError(LABELS.loadError[lang]))
                    .finally(() => setLoading(false));
                }}
              >
                {LABELS.retry[lang]}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Project Cards or Empty State */}
        {!loading &&
          !error &&
          (hasProjects ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={{
                    id: project.id,
                    title: project.title,
                    reviewType: project.review_type,
                    framework: project.framework,
                    progress: project.progress_percentage || 0,
                    currentStage: project.current_stage,
                    lastUpdated: project.updated_at,
                  }}
                  lang={lang}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderOpen}
              title={LABELS.noProjectsTitle[lang]}
              description={LABELS.noProjectsDesc[lang]}
              actionLabel={LABELS.newProject[lang]}
              actionHref="/projects/new"
            />
          ))}
      </section>
    </div>
  );
}
