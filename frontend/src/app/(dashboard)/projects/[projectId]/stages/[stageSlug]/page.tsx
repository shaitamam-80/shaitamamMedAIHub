'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback, useMemo } from 'react';
import ChatInterface, { type ReviewStateUpdate } from '@/components/chat/ChatInterface';
import ArtifactPanel from '@/components/stages/ArtifactPanel';
import { STAGES, STAGE_ORDER, type StageName } from '@/lib/utils/stage-config';
import {
  getStageMessages,
  updateStageStatus,
  getProjectStages,
} from '@/lib/api/backend-client';
import { Loader2, PanelRightOpen, PanelRightClose } from 'lucide-react';

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

  // LangGraph artifacts received from state_update SSE events
  const [stageArtifacts, setStageArtifacts] = useState<Record<string, unknown>>({});
  // Side panel visibility (auto-opens when artifacts arrive)
  const [panelOpen, setPanelOpen] = useState(false);

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

  // Handle LangGraph state_update events from SSE stream
  const handleStateUpdate = useCallback((state: ReviewStateUpdate) => {
    if (state.artifacts && Object.keys(state.artifacts).length > 0) {
      setStageArtifacts(state.artifacts);
      // Auto-open the panel when artifacts arrive for the first time
      setPanelOpen(true);
    }
  }, []);

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

  // Compute whether stage completion criteria are met (for LangGraph stages only)
  const canComplete = useMemo(() => {
    if (!stage?.useLangGraph) return undefined; // don't gate legacy stages

    if (stageSlug === 'idea') {
      const idea = stageArtifacts?.idea as Record<string, unknown> | undefined;
      return !!(idea?.clinical_problem && idea?.review_type && idea?.population_sketch);
    }

    if (stageSlug === 'question') {
      const rq = stageArtifacts?.research_question as Record<string, unknown> | undefined;
      return !!(rq?.framework_type && rq?.framework_data && rq?.finer_assessment);
    }

    if (stageSlug === 'protocol') {
      const p = stageArtifacts?.protocol as Record<string, unknown> | undefined;
      return !!(p?.eligibility_criteria && p?.information_sources && p?.rob_tool && p?.synthesis_method);
    }

    return undefined; // future LangGraph stages — no gating yet
  }, [stage, stageSlug, stageArtifacts]);

  // Does the ArtifactPanel have anything to show?
  const hasArtifacts = useMemo(() => {
    if (stageSlug === 'idea') return !!(stageArtifacts?.idea);
    if (stageSlug === 'question') return !!(stageArtifacts?.research_question);
    if (stageSlug === 'protocol') return !!(stageArtifacts?.protocol);
    return false;
  }, [stageSlug, stageArtifacts]);

  if (!stage) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#0f172a] mb-2">שלב לא נמצא</h1>
          <p className="text-[#475569]">השלב המבוקש אינו קיים במערכת</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Stage Header */}
      <div className="border-b border-[#e2e8f0] bg-white px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
              {stage.order}
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#0f172a]">{stage.name.he}</h1>
              <p className="text-sm text-[#475569]">{stage.description.he}</p>
            </div>
          </div>
          {/* Panel toggle button — only for LangGraph stages with artifacts */}
          {stage.useLangGraph && hasArtifacts && (
            <button
              onClick={() => setPanelOpen(!panelOpen)}
              className="p-2 rounded-lg hover:bg-[#f1f5f9] text-[#475569] hover:text-[#0f172a] transition-colors"
              title={panelOpen ? 'Hide data panel' : 'Show data panel'}
            >
              {panelOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Chat + optional ArtifactPanel */}
      <div className="flex-1 overflow-hidden flex">
        {/* Chat area */}
        <div className={`flex-1 overflow-hidden transition-all duration-300 ${panelOpen && hasArtifacts ? 'lg:w-3/5' : 'w-full'}`}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-[#475569] text-sm">טוען שיחה...</p>
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
              useLangGraph={stage.useLangGraph}
              onStateUpdate={stage.useLangGraph ? handleStateUpdate : undefined}
              canCompleteStage={canComplete}
            />
          )}
        </div>

        {/* Artifact side panel — desktop: side panel, mobile: hidden (toggle via header button collapses) */}
        {panelOpen && hasArtifacts && (
          <div className="hidden lg:block lg:w-2/5 border-s border-[#e2e8f0] bg-[#f8fafc] overflow-y-auto">
            <ArtifactPanel stageSlug={stageSlug} artifacts={stageArtifacts} />
          </div>
        )}
      </div>

      {/* Mobile artifact drawer — shows below chat on small screens */}
      {panelOpen && hasArtifacts && (
        <div className="lg:hidden border-t border-[#e2e8f0] bg-[#f8fafc] max-h-[40vh] overflow-y-auto">
          <ArtifactPanel stageSlug={stageSlug} artifacts={stageArtifacts} />
        </div>
      )}
    </div>
  );
}
