'use client';

import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { type Language } from '@/components/layout/LanguageToggle';

interface Project {
  id: string;
  title: string;
  reviewType: string;
  framework: string;
  progress: number;
  currentStage: string;
  lastUpdated: string;
}

interface ProjectCardProps {
  project: Project;
  lang?: Language;
}

export default function ProjectCard({ project, lang = 'en' }: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (lang === 'he') {
      if (diffInHours < 1) return 'לפני פחות משעה';
      if (diffInHours < 24) return `לפני ${diffInHours} שעות`;
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays === 1) return 'אתמול';
      if (diffInDays < 7) return `לפני ${diffInDays} ימים`;
      return date.toLocaleDateString('he-IL');
    }

    // English
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    return date.toLocaleDateString('en-US');
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="group h-full transition-all duration-200 hover:border-primary/50 hover:shadow-md cursor-pointer">
        <CardContent className="p-5">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
              {project.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">
                {project.reviewType}
              </Badge>
              <Badge variant="outline" className="text-[10px]">
                {project.framework}
              </Badge>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground text-xs">
                {lang === 'en' ? 'Progress' : 'התקדמות'}
              </span>
              <span className="text-foreground text-xs font-medium">
                {project.progress}%
              </span>
            </div>
            <Progress value={project.progress} className="h-1.5" />
          </div>

          {/* Current Stage */}
          <div className="mb-3">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">
              {lang === 'en' ? 'Current Stage' : 'שלב נוכחי'}
            </div>
            <div className="text-sm text-foreground font-medium">
              {project.currentStage}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              <span>{formatDate(project.lastUpdated)}</span>
            </div>
            <div className="flex items-center gap-1 text-primary text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              <span>{lang === 'en' ? 'Open' : 'פתח'}</span>
              <ArrowRight className="size-3" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
