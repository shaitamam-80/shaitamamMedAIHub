'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { STAGES } from '@/lib/utils/stage-config';
import { cn } from '@/lib/utils/cn';
import { Check, Circle, Loader2 } from 'lucide-react';
import { getProjectStages, type ProjectStage } from '@/lib/api/backend-client';

interface ProjectSidebarProps {
  projectId: string;
}

export default function ProjectSidebar({ projectId }: ProjectSidebarProps) {
  const pathname = usePathname();
  const [stageStatuses, setStageStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProjectStages(projectId)
      .then((stages) => {
        const statusMap: Record<string, string> = {};
        stages.forEach((s) => {
          statusMap[s.stage_name] = s.status;
        });
        setStageStatuses(statusMap);
      })
      .catch((err) => {
        console.error('Failed to load stages:', err);
      })
      .finally(() => setLoading(false));
  }, [projectId, pathname]);

  const isStageActive = (stageSlug: string) => {
    return pathname.includes(`/stages/${stageSlug}`);
  };

  const isStageCompleted = (stageSlug: string) => {
    return stageStatuses[stageSlug] === 'completed';
  };

  const isStageInProgress = (stageSlug: string) => {
    return stageStatuses[stageSlug] === 'in_progress';
  };

  return (
    <aside className="w-80 bg-[#111827] border-l border-[#1e293b] overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/projects/${projectId}`}
            className="text-sm text-blue-500 hover:text-blue-400 transition-colors"
          >
            ← חזרה לסקירה כללית
          </Link>
          <h2 className="text-lg font-bold text-[#f1f5f9] mt-4 mb-2">שלבי הפרויקט</h2>
          <p className="text-xs text-[#64748b]">10 שלבים לסקירה שיטתית מושלמת</p>
        </div>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Stages List */}
        <div className="space-y-2">
          {Object.values(STAGES).map((stage) => {
            const isActive = isStageActive(stage.slug);
            const isCompleted = isStageCompleted(stage.slug);
            const isInProgress = isStageInProgress(stage.slug);

            return (
              <Link
                key={stage.slug}
                href={`/projects/${projectId}/stages/${stage.slug}`}
                className={cn(
                  'block p-4 rounded-lg border transition-all',
                  isActive &&
                    'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500',
                  !isActive && isCompleted && 'bg-green-500/5 border-green-500/20',
                  !isActive && isInProgress && 'border-amber-500/30 bg-amber-500/5',
                  !isActive && !isCompleted && !isInProgress && 'border-[#1e293b] hover:border-blue-500/50'
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Stage Icon */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm',
                      isActive && 'bg-blue-500 text-white',
                      !isActive && isCompleted && 'bg-green-500 text-white',
                      !isActive && isInProgress && 'bg-amber-500 text-white',
                      !isActive && !isCompleted && !isInProgress && 'bg-[#1e293b] text-[#64748b]'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : isActive ? (
                      <Circle className="w-3 h-3 fill-current" />
                    ) : (
                      stage.order
                    )}
                  </div>

                  {/* Stage Info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className={cn(
                        'font-medium text-sm mb-1',
                        isActive && 'text-blue-500',
                        !isActive && isCompleted && 'text-green-500',
                        !isActive && isInProgress && 'text-amber-500',
                        !isActive && !isCompleted && !isInProgress && 'text-[#f1f5f9]'
                      )}
                    >
                      {stage.name.he}
                    </div>
                    <div className="text-xs text-[#64748b] line-clamp-2">
                      {stage.description.he}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
