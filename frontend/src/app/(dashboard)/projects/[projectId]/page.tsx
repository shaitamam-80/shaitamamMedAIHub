'use client';

import { ArrowLeft, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import StageProgress from '@/components/dashboard/StageProgress';

// Mock project data
const mockProject = {
  id: '1',
  title: 'השפעת הבינה המלאכותית על החינוך הגבוה',
  reviewType: 'Systematic Review',
  framework: 'PRISMA',
  currentStage: 'data-extraction',
  completedStages: 3,
  totalStages: 10,
  createdAt: '2024-01-15',
  lastUpdated: '2024-02-05T10:30:00Z',
};

const metrics = [
  {
    label: 'שלבים הושלמו',
    value: '3/10',
    icon: CheckCircle2,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    label: 'מאמרים נסקרו',
    value: '47',
    icon: FileText,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    label: 'זמן פעיל',
    value: '12 שעות',
    icon: Clock,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
  },
  {
    label: 'בעיות לטיפול',
    value: '2',
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
  },
];

const recentArtifacts = [
  {
    id: '1',
    name: 'PRISMA_Checklist_v1.pdf',
    stage: 'Protocol Development',
    date: '2024-02-05',
  },
  {
    id: '2',
    name: 'Search_Strategy_PubMed.txt',
    stage: 'Literature Search',
    date: '2024-02-04',
  },
  {
    id: '3',
    name: 'Extraction_Template.xlsx',
    stage: 'Data Extraction',
    date: '2024-02-03',
  },
];

export default function ProjectOverviewPage({
  params,
}: {
  params: { projectId: string };
}) {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[#94a3b8] text-sm mb-3">
          <Link href="/" className="hover:text-blue-500 transition-colors">
            לוח בקרה
          </Link>
          <span>/</span>
          <span className="text-[#f1f5f9]">סקירה כללית</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#f1f5f9] mb-3">
              {mockProject.title}
            </h1>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-blue-500/10 text-blue-500 text-sm font-medium rounded-full border border-blue-500/20">
                {mockProject.reviewType}
              </span>
              <span className="px-3 py-1 bg-purple-500/10 text-purple-500 text-sm font-medium rounded-full border border-purple-500/20">
                {mockProject.framework}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="mb-8 bg-[#111827] border border-[#1e293b] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">התקדמות השלבים</h2>
        <StageProgress currentStage={mockProject.currentStage} completedStages={mockProject.completedStages} />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div
              key={index}
              className="bg-[#111827] border border-[#1e293b] rounded-xl p-6 hover:border-blue-500/50 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`w-6 h-6 ${metric.color}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-[#f1f5f9] mb-1">
                {metric.value}
              </div>
              <div className="text-sm text-[#94a3b8]">
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
            <h3 className="text-lg font-semibold text-[#f1f5f9] mb-1">
              הפעולה הבאה
            </h3>
            <p className="text-[#94a3b8]">
              המשך עם שלב Data Extraction - חלץ נתונים מ-47 מאמרים
            </p>
          </div>
          <Link
            href={`/projects/${params.projectId}/stages/data-extraction`}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <span>המשך</span>
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Recent Artifacts */}
      <div className="bg-[#111827] border border-[#1e293b] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[#f1f5f9] mb-4">קבצים אחרונים</h2>
        <div className="space-y-3">
          {recentArtifacts.map((artifact) => (
            <div
              key={artifact.id}
              className="flex items-center justify-between p-4 bg-[#0a0e1a] border border-[#1e293b] rounded-lg hover:border-blue-500/50 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-[#f1f5f9] font-medium">{artifact.name}</div>
                  <div className="text-sm text-[#64748b]">{artifact.stage}</div>
                </div>
              </div>
              <div className="text-sm text-[#64748b]">
                {new Date(artifact.date).toLocaleDateString('he-IL')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
