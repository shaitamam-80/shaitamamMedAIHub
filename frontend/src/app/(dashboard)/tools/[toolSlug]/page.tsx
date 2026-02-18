'use client';

import { useParams, notFound } from 'next/navigation';
import ChatInterface from '@/components/chat/ChatInterface';
import ToolPageHeader from '@/components/tools/ToolPageHeader';
import { getToolBySlug, STAGE_ORDER, type StageName } from '@/lib/utils/stage-config';

export default function ToolPage() {
  const params = useParams();
  const toolSlug = params.toolSlug as string;

  const tool = getToolBySlug(toolSlug);

  if (!tool) {
    notFound();
  }

  // Calculate step number for pipeline tools (1-based)
  const stepNumber =
    tool.category === 'pipeline'
      ? STAGE_ORDER.indexOf(toolSlug as StageName) + 1
      : undefined;

  return (
    <div className="h-full flex flex-col -m-6">
      {/* Tool Header with description */}
      <ToolPageHeader tool={tool} stepNumber={stepNumber} />

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface skillName={tool.skillName} />
      </div>
    </div>
  );
}
