'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Plus,
  Clock,
  CheckCircle,
  FileText,
  TrendingUp,
  Loader2,
  ArrowLeft,
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

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getProjects()
      .then(setProjects)
      .catch((err) => {
        console.error('Failed to load projects:', err);
        setError('שגיאה בטעינת הפרויקטים');
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
      label: 'פרויקטים פעילים',
      value: String(activeProjects),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-600/10',
    },
    {
      label: 'סה"כ פרויקטים',
      value: String(projects.length),
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-600/10',
    },
    {
      label: 'סטטוס',
      value: loading ? '...' : hasProjects ? 'פעיל' : 'חדש',
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-600/10',
    },
    {
      label: 'התקדמות ממוצעת',
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
        <h1 className="text-2xl font-bold text-foreground mb-1">לוח בקרה</h1>
        <p className="text-muted-foreground">
          ברוך הבא ל-MedAI Hub — פלטפורמת AI לסקירות שיטתיות
        </p>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${stat.bgColor}`}>
                    <Icon className={`size-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Pipeline Tools ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">כלי Pipeline</h2>
            <p className="text-sm text-muted-foreground">
              10 שלבים מ-Idea עד Manuscript — הצנרת המלאה של סקירה שיטתית
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
              />
            );
          })}
        </div>
      </section>

      {/* ── Standalone Tools ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">כלים עצמאיים</h2>
            <p className="text-sm text-muted-foreground">
              כלים שניתן להשתמש בהם באופן עצמאי, ללא קשר לפרויקט
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STANDALONE_ORDER.map((toolName) => {
            const tool = STANDALONE_TOOLS[toolName];
            return <ToolCard key={tool.slug} tool={tool} />;
          })}
        </div>
      </section>

      <Separator />

      {/* ── Recent Projects ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">הפרויקטים שלי</h2>
            <p className="text-sm text-muted-foreground">
              {hasProjects
                ? `${projects.length} פרויקטים`
                : 'צור את הפרויקט הראשון שלך'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasProjects && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/projects">
                  <span>כל הפרויקטים</span>
                  <ArrowLeft className="size-4 ms-1" />
                </Link>
              </Button>
            )}
            <Button size="sm" asChild>
              <Link href="/projects/new">
                <Plus className="size-4 me-1" />
                <span>פרויקט חדש</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 text-primary animate-spin" />
            <span className="mr-3 text-muted-foreground text-sm">טוען פרויקטים...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <Card className="border-destructive/50">
            <CardContent className="p-6 text-center">
              <p className="text-destructive text-sm">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  getProjects()
                    .then(setProjects)
                    .catch(() => setError('שגיאה בטעינת הפרויקטים'))
                    .finally(() => setLoading(false));
                }}
              >
                נסה שוב
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Project Cards or Empty State */}
        {!loading && !error && (
          hasProjects ? (
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
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={FolderOpen}
              title="אין פרויקטים עדיין"
              description="צור את הפרויקט הראשון שלך כדי להתחיל סקירה שיטתית"
              actionLabel="פרויקט חדש"
              actionHref="/projects/new"
            />
          )
        )}
      </section>
    </div>
  );
}
