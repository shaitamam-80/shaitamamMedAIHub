'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import { STAGES, STAGE_ORDER, type StageName } from '@/lib/utils/stage-config';
import {
  getStageMessages,
  updateStageStatus,
  getProjectStages,
} from '@/lib/api/backend-client';
import { Loader2 } from 'lucide-react';

export default function StagePage() {
  const params = useParams();
  const router = useRouter();
  const stageSlug = params.stageSlug as string;
  const projectId = params.projectId as string;

  const [initialMessages, setInitialMessages] = useState<
    Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }> | null
  >(null);
  const [stageStatus, setStageStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);

  const stage = Object.values(STAGES).find(s => s.slug === stageSlug);

  // Load conversation history and mark stage in_progress on mount
  useEffect(() => {
    if (!stage) return;

    const initialize = async () => {
      setLoading(true);
      try {
        // 1. Load existing conversation messages
        const { messages } = await getStageMessages(projectId, stageSlug);

        if (messages.length > 0) {
          setInitialMessages(
            messages.map(m => ({
              id: m.id,
              role: m.role as 'user' | 'assistant',
              content: m.content,
              timestamp: new Date(m.created_at),
            }))
          );
        } else {
          setInitialMessages([]); // triggers greeting in ChatInterface
        }

        // 2. Get current stage status
        const stages = await getProjectStages(projectId);
        const currentStage = stages.find(s => s.stage_name === stageSlug);
        const currentStatus = currentStage?.status || 'pending';
        setStageStatus(currentStatus);

        // 3. Auto-mark in_progress if currently pending
        if (currentStatus === 'pending') {
          const updated = await updateStageStatus(projectId, stageSlug, 'in_progress');
          setStageStatus(updated.status);
        }
      } catch (err) {
        console.error('Failed to initialize stage:', err);
        setInitialMessages([]); // fall through to greeting
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [projectId, stageSlug, stage]);

  // Handle stage completion
  const handleStageComplete = useCallback(async () => {
    try {
      await updateStageStatus(projectId, stageSlug, 'completed');
      setStageStatus('completed');

      // Navigate to next stage after a brief delay
      const currentIndex = STAGE_ORDER.indexOf(stageSlug as StageName);
      if (currentIndex >= 0 && currentIndex < STAGE_ORDER.length - 1) {
        const nextStage = STAGE_ORDER[currentIndex + 1];
        setTimeout(() => {
          router.push(`/projects/${projectId}/stages/${nextStage}`);
        }, 1500);
      }
    } catch (err) {
      console.error('Failed to complete stage:', err);
    }
  }, [projectId, stageSlug, router]);

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
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-[#94a3b8] text-sm">טוען שיחה...</p>
            </div>
          </div>
        ) : (
          <ChatInterface
            skillName={stage.skillName}
            projectContext={{
              projectId,
              stage: stageSlug,
              stageName: stage.name.he,
            }}
            initialMessages={initialMessages || undefined}
            onStageComplete={handleStageComplete}
            stageStatus={stageStatus}
            acceptedFileTypes={stage.acceptsUploads}
          />
        )}
      </div>
    </div>
  );
}
