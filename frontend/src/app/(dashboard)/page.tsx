'use client';

import Link from 'next/link';
import { Plus, Clock, CheckCircle, FileText, TrendingUp } from 'lucide-react';
import ProjectCard from '@/components/dashboard/ProjectCard';
import EmptyState from '@/components/shared/EmptyState';

// Mock data
const mockProjects = [
  {
    id: '1',
    title: 'השפעת הבינה המלאכותית על החינוך הגבוה',
    reviewType: 'Systematic Review',
    framework: 'PRISMA',
    progress: 35,
    currentStage: 'Data Extraction',
    lastUpdated: '2024-02-05T10:30:00Z',
  },
  {
    id: '2',
    title: 'Interventions for Climate Change Adaptation in Urban Areas',
    reviewType: 'Scoping Review',
    framework: 'JBI',
    progress: 68,
    currentStage: 'Quality Assessment',
    lastUpdated: '2024-02-04T14:15:00Z',
  },
];

const stats = [
  {
    label: 'פרויקטים פעילים',
    value: '2',
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    label: 'שלבים הושלמו',
    value: '8',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    label: 'שעות נחסכו',
    value: '47',
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    label: 'אחוז התקדמות ממוצע',
    value: '52%',
    icon: TrendingUp,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-500/10',
  },
];

export default function DashboardPage() {
  const hasProjects = mockProjects.length > 0;

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

      {/* Projects Grid or Empty State */}
      {hasProjects ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
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
      )}
    </div>
  );
}
