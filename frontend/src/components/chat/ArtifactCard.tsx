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
    try {
      // MIME type mapping for common artifact types
      const mimeMap: Record<string, string> = {
        md: 'text/markdown',
        csv: 'text/csv',
        html: 'text/html',
        txt: 'text/plain',
        json: 'application/json',
        r: 'text/plain',
        R: 'text/plain',
      };

      const ext = artifact.name.split('.').pop() || 'txt';
      const mimeType = mimeMap[ext] || 'text/plain';

      const blob = new Blob([artifact.content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = artifact.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <div className="bg-card border border-border shadow-sm rounded-lg p-4 flex items-center justify-between hover:border-primary/40 card-glow transition-all">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="text-foreground font-medium text-sm">{artifact.name}</div>
          <div className="text-muted-foreground text-xs">{artifact.type.toUpperCase()} File</div>
        </div>
      </div>
      <button
        onClick={handleDownload}
        className="p-2 hover:bg-muted rounded-lg transition-colors"
        title="Download"
      >
        <Download className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
