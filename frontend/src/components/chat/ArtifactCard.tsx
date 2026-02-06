'use client';

import { FileText, Download } from 'lucide-react';

interface Artifact {
  name: string;
  type: string;
  content: string;
}

interface ArtifactCardProps {
  artifact: Artifact;
}

export default function ArtifactCard({ artifact }: ArtifactCardProps) {
  const handleDownload = () => {
    // Mock download - in production, trigger actual file download
    console.log('Downloading artifact:', artifact.name);
  };

  return (
    <div className="bg-[#0a0e1a] border border-[#1e293b] rounded-lg p-4 flex items-center justify-between hover:border-blue-500/50 transition-all">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <FileText className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <div className="text-[#f1f5f9] font-medium text-sm">{artifact.name}</div>
          <div className="text-[#64748b] text-xs">{artifact.type.toUpperCase()} File</div>
        </div>
      </div>
      <button
        onClick={handleDownload}
        className="p-2 hover:bg-[#1e293b] rounded-lg transition-colors"
        title="Download"
      >
        <Download className="w-4 h-4 text-[#94a3b8]" />
      </button>
    </div>
  );
}
