'use client';

import Link from 'next/link';
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
  ArrowLeft,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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

// ── Component ──────────────────────────────────────────────────────

interface ToolCardProps {
  tool: ToolConfig;
  /** Optional step number for pipeline tools (1-based) */
  stepNumber?: number;
}

export default function ToolCard({ tool, stepNumber }: ToolCardProps) {
  const Icon = getIcon(tool.icon);

  return (
    <Link href={`/tools/${tool.slug}`}>
      <Card className="group h-full transition-all duration-200 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 cursor-pointer">
        <CardContent className="p-5">
          {/* Top row: icon + badge */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <Icon className="size-5 text-primary" />
            </div>
            {stepNumber && (
              <Badge variant="secondary" className="text-[10px] font-mono">
                {stepNumber}/10
              </Badge>
            )}
          </div>

          {/* Name */}
          <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
            {tool.name.he}
          </h3>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
            {tool.description.he}
          </p>

          {/* Open link indicator */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
            <span>פתח כלי</span>
            <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
