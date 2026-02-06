'use client';

import { Check } from 'lucide-react';
import { STAGES } from '@/lib/utils/stage-config';
import { cn } from '@/lib/utils/cn';

interface StageProgressProps {
  currentStage: string;
  completedStages: number;
}

export default function StageProgress({ currentStage, completedStages }: StageProgressProps) {
  return (
    <div className="relative">
      {/* Progress line */}
      <div className="absolute top-5 right-0 left-0 h-0.5 bg-[#1e293b]" />

      {/* Stages */}
      <div className="relative grid grid-cols-10 gap-2">
        {Object.values(STAGES).map((stage, index) => {
          const isCompleted = index < completedStages;
          const isCurrent = stage.slug === currentStage;
          const isUpcoming = index >= completedStages && !isCurrent;

          return (
            <div key={stage.slug} className="flex flex-col items-center">
              {/* Stage circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm transition-all z-10',
                  isCompleted && 'bg-green-500 border-green-500 text-white',
                  isCurrent && 'bg-blue-500 border-blue-500 text-white animate-pulse',
                  isUpcoming && 'bg-[#0a0e1a] border-[#1e293b] text-[#64748b]'
                )}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{stage.order}</span>
                )}
              </div>

              {/* Stage name */}
              <div className="mt-2 text-center">
                <div
                  className={cn(
                    'text-xs font-medium transition-colors line-clamp-2',
                    isCurrent && 'text-blue-500',
                    isCompleted && 'text-green-500',
                    isUpcoming && 'text-[#64748b]'
                  )}
                >
                  {stage.name.he}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
