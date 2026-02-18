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

// ── Color palette per tool position ─────────────────────────────────

const ACCENT_COLORS = [
  { bg: 'bg-sky-50 dark:bg-sky-900/20', text: 'text-sky-600 dark:text-sky-400' },
  { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-600 dark:text-blue-400' },
  { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400' },
  { bg: 'bg-indigo-50 dark:bg-indigo-900/20', text: 'text-indigo-600 dark:text-indigo-400' },
  { bg: 'bg-cyan-50 dark:bg-cyan-900/20', text: 'text-cyan-600 dark:text-cyan-400' },
  { bg: 'bg-teal-50 dark:bg-teal-900/20', text: 'text-teal-600 dark:text-teal-400' },
  { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
  { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-600 dark:text-amber-400' },
  { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-600 dark:text-orange-400' },
  { bg: 'bg-rose-50 dark:bg-rose-900/20', text: 'text-rose-600 dark:text-rose-400' },
  { bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-600 dark:text-purple-400' },
  { bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', text: 'text-fuchsia-600 dark:text-fuchsia-400' },
  { bg: 'bg-pink-50 dark:bg-pink-900/20', text: 'text-pink-600 dark:text-pink-400' },
  { bg: 'bg-lime-50 dark:bg-lime-900/20', text: 'text-lime-600 dark:text-lime-400' },
];

// ── Component ──────────────────────────────────────────────────────

interface ToolRowProps {
  tool: ToolConfig;
  /** Optional step number for pipeline tools (1-based) */
  stepNumber?: number;
  /** Color index (0-based) — cycles through ACCENT_COLORS */
  colorIndex?: number;
  /** Current language (defaults to 'en') */
  lang?: Language;
}

export default function ToolRow({
  tool,
  stepNumber,
  colorIndex = 0,
  lang = 'en',
}: ToolRowProps) {
  const Icon = getIcon(tool.icon);
  const accent = ACCENT_COLORS[colorIndex % ACCENT_COLORS.length];

  return (
    <Link href={`/tools/${tool.slug}`} className="block group">
      <div className="bg-card border border-border rounded-xl p-5 md:p-6 flex items-center gap-5 md:gap-6 hover:shadow-md hover:border-primary/20 transition-all duration-300">
        {/* Icon box */}
        <div
          className={`size-14 md:size-16 rounded-xl ${accent.bg} ${accent.text} flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105`}
        >
          <Icon className="size-7 md:size-8" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1">
            {stepNumber && (
              <span className="text-[10px] font-mono font-medium text-muted-foreground/50 tabular-nums bg-muted/50 px-1.5 py-0.5 rounded">
                {String(stepNumber).padStart(2, '0')}
              </span>
            )}
            <h3 className="text-base md:text-lg font-bold text-foreground group-hover:text-primary transition-colors duration-200 tracking-tight">
              {tool.name[lang]}
            </h3>
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 max-w-2xl">
            {tool.longDescription[lang]}
          </p>
        </div>

        {/* Action button */}
        <div className="shrink-0 hidden sm:flex items-center">
          <span className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground font-bold text-sm rounded-lg shadow-sm shadow-primary/10 group-hover:shadow-md group-hover:shadow-primary/20 transition-all duration-200 group-hover:scale-[0.98] active:scale-95">
            {lang === 'en' ? 'Open Tool' : 'פתח כלי'}
            <ArrowRight className="size-4 rtl:-scale-x-100" />
          </span>
        </div>

        {/* Mobile arrow */}
        <div className="shrink-0 sm:hidden">
          <ArrowRight className="size-5 text-muted-foreground/40 group-hover:text-primary transition-colors rtl:-scale-x-100" />
        </div>
      </div>
    </Link>
  );
}
