'use client';

import { use, useState, useEffect } from 'react';
import { ArrowLeft, FileText, CheckCircle2, Clock, AlertCircle, Loader2, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import StageProgress from '@/components/dashboard/StageProgress';
import { getProject, getProjectStages, type Project, type ProjectStage } from '@/lib/api/backend-client';
import { REVIEW_TYPES, STAGES, type ReviewType, type StageName } from '@/lib/utils/stage-config';

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      getProject(projectId),
      getProjectStages(projectId),
    ])
      .then(([proj, stgs]) => {
        setProject(proj);
        setStages(stgs);
      })
      .catch((err) => {
        console.error('Failed to load project:', err);
        setError('שגיאה בטעינת הפרויקט');
      })
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-[#475569] text-sm">טוען פרויקט...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-400 mb-4">{error || 'הפרויקט לא נמצא'}</p>
          <Link
            href="/"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            חזרה ללוח בקרה
          </Link>
        </div>
      </div>
    );
  }

  // Derive metrics from real data
  const completedCount = stages.filter((s) => s.status === 'completed').length;
  const inProgressStage = stages.find((s) => s.status === 'in_progress');
  const currentStageName = inProgressStage?.stage_name || project.current_stage;

  // Get Hebrew display name for current stage
  const currentStageConfig = STAGES[currentStageName as StageName];
  const currentStageDisplayName = currentStageConfig?.name?.he || currentStageName;

  // Get review type display name
  const reviewTypeDisplay = REVIEW_TYPES[project.review_type as ReviewType]?.he || project.review_type;

  const metrics = [
    {
      label: 'שלבים הושלמו',
      value: `${completedCount}/10`,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      label: 'מאמרים שנמצאו',
      value: String(project.total_records_found || 0),
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      label: 'נכללו',
      value: String(project.total_included || 0),
      icon: BarChart3,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
    },
    {
      label: 'הודרו',
      value: String(project.total_excluded || 0),
      icon: AlertCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[#475569] text-sm mb-3">
          <Link href="/" className="hover:text-blue-500 transition-colors">
            לוח בקרה
          </Link>
          <span>/</span>
          <span className="text-[#0f172a]">סקירה כללית</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#0f172a] mb-3">
              {project.title}
            </h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-sm font-medium rounded-full border border-blue-500/20">
                {reviewTypeDisplay}
              </span>
              <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-sm font-medium rounded-full border border-purple-500/20">
                {project.framework}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="mb-8 bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#0f172a] mb-4">התקדמות השלבים</h2>
        <StageProgress currentStage={currentStageName} completedStages={completedCount} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-6 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#0f172a] mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-[#475569]">
                {metric.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Next Action */}
      <div className="mb-8 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#0f172a] mb-1">
              הפעולה הבאה
            </h3>
            <p className="text-[#475569]">
              המשך עם שלב {currentStageDisplayName}
            </p>
          </div>
          <Link
            href={`/projects/${projectId}/stages/${currentStageName}`}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <span>המשך</span>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Project Info */}
      <div className="bg-white border border-[#e2e8f0] shadow-sm rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#0f172a] mb-4">פרטי הפרויקט</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
            <span className="text-[#475569]">תאריך יצירה</span>
            <span className="text-[#0f172a]">
              {new Date(project.created_at).toLocaleDateString('he-IL')}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
            <span className="text-[#475569]">עדכון אחרון</span>
            <span className="text-[#0f172a]">
              {new Date(project.updated_at).toLocaleDateString('he-IL')}
            </span>
          </div>
          <div className="flex items-center justify-between p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
            <span className="text-[#475569]">סטטוס</span>
            <span className="text-green-400">{project.status === 'active' ? 'פעיל' : project.status}</span>
          </div>
          {project.prospero_id && (
            <div className="flex items-center justify-between p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-lg">
              <span className="text-[#475569]">PROSPERO ID</span>
              <span className="text-[#0f172a]">{project.prospero_id}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
