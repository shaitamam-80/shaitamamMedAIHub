'use client';

import { useParams } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';
import { STAGES } from '@/lib/utils/stage-config';

export default function StagePage() {
  const params = useParams();
  const stageSlug = params.stageSlug as string;
  const projectId = params.projectId as string;

  // Find the stage configuration
  const stage = Object.values(STAGES).find(s => s.slug === stageSlug);

  if (!stage) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#f1f5f9] mb-2">שלב לא נמצא</h1>
          <p className="text-[#94a3b8]">השלב המבוקש אינו קיים במערכת</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Stage Header */}
      <div className="border-b border-[#1e293b] bg-[#111827] px-8 py-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
            {stage.order}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#f1f5f9]">{stage.name.he}</h1>
            <p className="text-sm text-[#94a3b8]">{stage.description.he}</p>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          skillName={stage.skillName}
          projectContext={{
            projectId,
            stage: stageSlug,
            stageName: stage.name.he,
          }}
        />
      </div>
    </div>
  );
}
