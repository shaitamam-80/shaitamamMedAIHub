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
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { type ToolConfig } from '@/lib/utils/stage-config';
import { type Language } from '@/components/layout/LanguageToggle';

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
  /** Current language (defaults to 'en') */
  lang?: Language;
}

export default function ToolCard({ tool, stepNumber, lang = 'en' }: ToolCardProps) {
  const Icon = getIcon(tool.icon);

  return (
    <Link href={`/tools/${tool.slug}`}>
      <Card className="group h-full card-glow gradient-border cursor-pointer relative overflow-hidden transition-all duration-300 hover:-translate-y-1">
        <CardContent className="p-5 relative">
          {/* Step indicator — top-left accent line */}
          {stepNumber && (
            <div
              className="absolute top-0 left-0 h-1 bg-gradient-to-r from-primary/60 to-primary/10 transition-all duration-300 group-hover:from-primary group-hover:to-primary/30"
              style={{ width: `${stepNumber * 10}%` }}
            />
          )}

          {/* Top row: icon + step */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/8 group-hover:bg-primary/12 transition-all duration-300 group-hover:scale-105">
              <Icon className="size-5 text-primary/80 group-hover:text-primary transition-colors duration-300" />
            </div>
            {stepNumber && (
              <span className="text-[10px] font-mono text-muted-foreground/60 font-medium tabular-nums">
                {String(stepNumber).padStart(2, '0')}
              </span>
            )}
          </div>

          {/* Name */}
          <h3 className="font-semibold text-sm text-foreground mb-1.5 group-hover:text-primary transition-colors duration-200 tracking-tight">
            {tool.name[lang]}
          </h3>

          {/* Description */}
          <p className="text-xs text-muted-foreground/80 leading-relaxed line-clamp-2 mb-3">
            {tool.description[lang]}
          </p>

          {/* Open link indicator */}
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/50 group-hover:text-primary/70 transition-all duration-200">
            <span>{lang === 'en' ? 'Open' : 'פתח'}</span>
            <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
