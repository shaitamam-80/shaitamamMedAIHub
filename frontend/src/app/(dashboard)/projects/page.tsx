'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Loader2, FolderOpen } from 'lucide-react';
import ProjectCard from '@/components/dashboard/ProjectCard';
import EmptyState from '@/components/shared/EmptyState';
import { getProjects, type Project } from '@/lib/api/backend-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { type Language } from '@/components/layout/LanguageToggle';

const LABELS = {
  title: { en: 'My Projects', he: 'הפרויקטים שלי' },
  subtitle: {
    en: 'All your systematic review projects',
    he: 'כל פרויקטי הסקירה השיטתית שלך',
  },
  newProject: { en: 'New Project', he: 'פרויקט חדש' },
  loading: { en: 'Loading projects...', he: 'טוען פרויקטים...' },
  loadError: { en: 'Error loading projects', he: 'שגיאה בטעינת הפרויקטים' },
  retry: { en: 'Try again', he: 'נסה שוב' },
  noProjectsTitle: { en: 'No projects yet', he: 'אין פרויקטים עדיין' },
  noProjectsDesc: {
    en: 'Start your first systematic review project',
    he: 'התחל את פרויקט הסקירה השיטתית הראשון שלך',
  },
} as const;

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

export default function ProjectsPage() {
  const lang = useLanguage();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = () => {
    setError(null);
    setLoading(true);
    getProjects()
      .then(setProjects)
      .catch(() => setError(LABELS.loadError[lang]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            {LABELS.title[lang]}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {LABELS.subtitle[lang]}
          </p>
        </div>
        <Button size="sm" asChild className="shadow-sm">
          <Link href="/projects/new">
            <Plus className="size-4 me-1" />
            <span>{LABELS.newProject[lang]}</span>
          </Link>
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 text-primary animate-spin" />
            <span className="text-muted-foreground text-sm">
              {LABELS.loading[lang]}
            </span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <Card className="border-destructive/30">
          <CardContent className="p-8 text-center">
            <p className="text-destructive text-sm mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={loadProjects}>
              {LABELS.retry[lang]}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Project Grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
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
      )}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <EmptyState
          icon={FolderOpen}
          title={LABELS.noProjectsTitle[lang]}
          description={LABELS.noProjectsDesc[lang]}
          actionLabel={LABELS.newProject[lang]}
          actionHref="/projects/new"
        />
      )}
    </div>
  );
}
