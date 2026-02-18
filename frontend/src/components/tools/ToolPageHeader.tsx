'use client';

import {
  Lightbulb,
  HelpCircle,
  FileText,
  Search,
  Filter,
  Database,
  Scale,
  BarChart3,
  Star,
  PenTool,
  FileSearch,
  BookOpen,
  ClipboardCheck,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { type ToolConfig } from '@/lib/utils/stage-config';

// ── Icon Map ───────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Lightbulb,
  HelpCircle,
  FileText,
  Search,
  Filter,
  Database,
  Scale,
  BarChart3,
  Star,
  PenTool,
  FileSearch,
  BookOpen,
  ClipboardCheck,
  Workflow,
};

function getIcon(name: string): LucideIcon {
  return ICON_MAP[name] || FileText;
}

// ── Category Colors ────────────────────────────────────────────────

const CATEGORY_CONFIG = {
  pipeline: {
    label: { he: 'Pipeline', en: 'Pipeline' },
    variant: 'secondary' as const,
  },
  standalone: {
    label: { he: 'כלי עצמאי', en: 'Standalone' },
    variant: 'outline' as const,
  },
};

// ── Component ──────────────────────────────────────────────────────

interface ToolPageHeaderProps {
  tool: ToolConfig;
  /** Optional step number for pipeline tools (1-based) */
  stepNumber?: number;
}

export default function ToolPageHeader({ tool, stepNumber }: ToolPageHeaderProps) {
  const Icon = getIcon(tool.icon);
  const categoryConfig = CATEGORY_CONFIG[tool.category];

  return (
    <div className="border-b bg-background px-6 py-5">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="size-6 text-primary" />
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-foreground">{tool.name.he}</h1>
            <Badge variant={categoryConfig.variant} className="text-[10px]">
              {stepNumber ? `שלב ${stepNumber}` : categoryConfig.label.he}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {tool.longDescription.he}
          </p>
        </div>
      </div>
    </div>
  );
}
