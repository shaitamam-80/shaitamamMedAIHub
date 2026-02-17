'use client';

import ChatInterface from '@/components/chat/ChatInterface';
import { CheckSquare } from 'lucide-react';

export default function ArticleAppraisalPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Tool Header */}
      <div className="border-b border-[#e2e8f0] bg-white px-8 py-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-green-500/10">
            <CheckSquare className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#0f172a]">Article Appraisal</h1>
            <p className="text-sm text-[#475569]">
              הערכת איכות מאמרים באמצעות כלי הערכה סטנדרטיים
            </p>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface skillName="article-appraisal" />
      </div>
    </div>
  );
}
