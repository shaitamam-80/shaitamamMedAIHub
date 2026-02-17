'use client';

import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

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
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'לפני פחות משעה';
    if (diffInHours < 24) return `לפני ${diffInHours} שעות`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'אתמול';
    if (diffInDays < 7) return `לפני ${diffInDays} ימים`;
    return date.toLocaleDateString('he-IL');
  };

  return (
    <Link href={`/projects/${project.id}`}>
      <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 hover:border-blue-500/50 transition-all group cursor-pointer shadow-sm">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-[#0f172a] mb-2 group-hover:text-blue-500 transition-colors line-clamp-2">
            {project.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 text-xs font-medium rounded-full border border-blue-500/20">
              {project.reviewType}
            </span>
            <span className="px-2.5 py-1 bg-purple-500/10 text-purple-500 text-xs font-medium rounded-full border border-purple-500/20">
              {project.framework}
            </span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[#475569]">התקדמות</span>
            <span className="text-[#0f172a] font-medium">{project.progress}%</span>
          </div>
          <div className="w-full bg-[#e2e8f0] rounded-full h-2 overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                project.progress < 30 ? "bg-gradient-to-r from-red-500 to-orange-500" :
                project.progress < 70 ? "bg-gradient-to-r from-amber-500 to-yellow-500" :
                "bg-gradient-to-r from-green-500 to-emerald-500"
              )}
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>

        {/* Current Stage */}
        <div className="mb-3">
          <div className="text-xs text-[#94a3b8] mb-1">שלב נוכחי</div>
          <div className="text-sm text-[#0f172a] font-medium">{project.currentStage}</div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-[#e2e8f0]">
          <div className="flex items-center gap-1.5 text-xs text-[#94a3b8]">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatDate(project.lastUpdated)}</span>
          </div>
          <div className="flex items-center gap-1 text-blue-500 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            <span>פתח</span>
            <ArrowLeft className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
