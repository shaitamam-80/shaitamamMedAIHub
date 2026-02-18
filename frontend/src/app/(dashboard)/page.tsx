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
  Sparkles,
  Zap,
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
import { type Language } from '@/components/layout/LanguageToggle';

// ── Labels ──────────────────────────────────────────────────────────

const LABELS = {
  dashboard: { en: 'Dashboard', he: 'לוח בקרה' },
  welcome: {
    en: 'Your AI-powered systematic review workspace',
    he: 'מרחב העבודה שלך לסקירות שיטתיות מונעות AI',
  },
  activeProjects: { en: 'Active Projects', he: 'פרויקטים פעילים' },
  totalProjects: { en: 'Total Projects', he: 'סה"כ פרויקטים' },
  status: { en: 'Status', he: 'סטטוס' },
  statusActive: { en: 'Active', he: 'פעיל' },
  statusNew: { en: 'New', he: 'חדש' },
  avgProgress: { en: 'Avg. Progress', he: 'התקדמות ממוצעת' },
  pipelineTools: { en: 'Review Pipeline', he: 'צנרת הסקירה' },
  pipelineDesc: {
    en: '10 stages from research idea to publication-ready manuscript',
    he: '10 שלבים מרעיון מחקרי עד מאמר מוכן לפרסום',
  },
  standaloneTools: { en: 'Standalone Tools', he: 'כלים עצמאיים' },
  standaloneDesc: {
    en: 'Independent tools for article appraisal, journal matching, and more',
    he: 'כלים עצמאיים להערכת מאמרים, התאמת כתבי-עת ועוד',
  },
  myProjects: { en: 'Recent Projects', he: 'פרויקטים אחרונים' },
  projectCount: { en: 'projects', he: 'פרויקטים' },
  createFirst: {
    en: 'Create your first project to get started',
    he: 'צור את הפרויקט הראשון שלך כדי להתחיל',
  },
  allProjects: { en: 'View all', he: 'הצג הכל' },
  newProject: { en: 'New Project', he: 'פרויקט חדש' },
  loadingProjects: { en: 'Loading projects...', he: 'טוען פרויקטים...' },
  loadError: {
    en: 'Error loading projects',
    he: 'שגיאה בטעינת הפרויקטים',
  },
  retry: { en: 'Try again', he: 'נסה שוב' },
  noProjectsTitle: { en: 'No projects yet', he: 'אין פרויקטים עדיין' },
  noProjectsDesc: {
    en: 'Start your first systematic review project',
    he: 'התחל את פרויקט הסקירה השיטתית הראשון שלך',
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
      gradient: 'from-blue-500/10 to-indigo-500/10',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200/60',
    },
    {
      label: LABELS.totalProjects[lang],
      value: String(projects.length),
      icon: CheckCircle,
      gradient: 'from-emerald-500/10 to-teal-500/10',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-200/60',
    },
    {
      label: LABELS.status[lang],
      value: loading
        ? '...'
        : hasProjects
          ? LABELS.statusActive[lang]
          : LABELS.statusNew[lang],
      icon: Clock,
      gradient: 'from-amber-500/10 to-orange-500/10',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200/60',
    },
    {
      label: LABELS.avgProgress[lang],
      value: `${avgProgress}%`,
      icon: TrendingUp,
      gradient: 'from-cyan-500/10 to-blue-500/10',
      iconColor: 'text-cyan-600',
      borderColor: 'border-cyan-200/60',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* ── Hero ── */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {LABELS.dashboard[lang]}
          </h1>
          <Sparkles className="size-5 text-primary/40" />
        </div>
        <p className="text-muted-foreground text-sm">
          {LABELS.welcome[lang]}
        </p>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-in">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={index}
              className={`card-glow border ${stat.borderColor} overflow-hidden`}
            >
              <CardContent className={`p-5 bg-gradient-to-br ${stat.gradient}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                    <Icon className={`size-5 ${stat.iconColor}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground tracking-tight">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1 font-medium">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Pipeline Tools ── */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-primary" />
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {LABELS.pipelineTools[lang]}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {LABELS.pipelineDesc[lang]}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 stagger-in">
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
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">
              {LABELS.standaloneTools[lang]}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {LABELS.standaloneDesc[lang]}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-in">
          {STANDALONE_ORDER.map((toolName) => {
            const tool = STANDALONE_TOOLS[toolName];
            return <ToolCard key={tool.slug} tool={tool} lang={lang} />;
          })}
        </div>
      </section>

      {/* ── Divider ── */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-xs text-muted-foreground/60 uppercase tracking-widest font-medium">
            {LABELS.myProjects[lang]}
          </span>
        </div>
      </div>

      {/* ── Recent Projects ── */}
      <section className="pb-8">
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            {hasProjects
              ? `${projects.length} ${LABELS.projectCount[lang]}`
              : LABELS.createFirst[lang]}
          </p>
          <div className="flex items-center gap-2">
            {hasProjects && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projects">
                  <span>{LABELS.allProjects[lang]}</span>
                  <ArrowRight className="size-3.5 ms-1" />
                </Link>
              </Button>
            )}
            <Button size="sm" asChild className="shadow-sm">
              <Link href="/projects/new">
                <Plus className="size-4 me-1" />
                <span>{LABELS.newProject[lang]}</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="size-8 text-primary animate-spin" />
              <span className="text-muted-foreground text-sm">
                {LABELS.loadingProjects[lang]}
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="border-destructive/30">
            <CardContent className="p-8 text-center">
              <p className="text-destructive text-sm mb-3">{LABELS.loadError[lang]}</p>
              <Button
                variant="outline"
                size="sm"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in">
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
