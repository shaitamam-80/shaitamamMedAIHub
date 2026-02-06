'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Clock, CheckCircle, FileText, TrendingUp, Loader2 } from 'lucide-react';
import ProjectCard from '@/components/dashboard/ProjectCard';
import EmptyState from '@/components/shared/EmptyState';
import { getProjects, type Project } from '@/lib/api/backend-client';

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

  // Stats calculated from real data
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const avgProgress =
    projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress_percentage || 0), 0) / projects.length)
      : 0;

  const stats = [
    {
      label: 'פרויקטים פעילים',
      value: String(activeProjects),
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'סה"כ פרויקטים',
      value: String(projects.length),
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'סטטוס',
      value: loading ? '...' : hasProjects ? 'פעיל' : 'חדש',
      icon: Clock,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'אחוז התקדמות ממוצע',
      value: `${avgProgress}%`,
      icon: TrendingUp,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f1f5f9] mb-2">
          לוח בקרה
        </h1>
        <p className="text-[#94a3b8]">
          ברוך הבא למערכת ניהול הסקירות השיטתיות
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-[#111827] border border-[#1e293b] rounded-xl p-6 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-[#f1f5f9] mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-[#94a3b8]">
                {stat.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Projects Section */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#f1f5f9]">הפרויקטים שלי</h2>
        <Link
          href="/projects/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>פרויקט חדש</span>
        </Link>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="mr-3 text-[#94a3b8]">טוען פרויקטים...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setLoading(true);
              getProjects()
                .then(setProjects)
                .catch(() => setError('שגיאה בטעינת הפרויקטים'))
                .finally(() => setLoading(false));
            }}
            className="mt-3 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            נסה שוב
          </button>
        </div>
      )}

      {/* Projects Grid or Empty State */}
      {!loading && !error && (
        hasProjects ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FileText}
            title="אין פרויקטים עדיין"
            description="צור את הפרויקט הראשון שלך כדי להתחיל"
            actionLabel="פרויקט חדש"
            actionHref="/projects/new"
          />
        )
      )}
    </div>
  );
}
