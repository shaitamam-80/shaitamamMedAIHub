'use client';

interface GradeBadgeProps {
  certainty: string;
  size?: 'sm' | 'md';
}

const GRADE_STYLES: Record<string, { bg: string; text: string; symbol: string }> = {
  high: { bg: 'bg-green-500/20 border-green-500/40', text: 'text-green-600', symbol: '\u2295\u2295\u2295\u2295' },
  moderate: { bg: 'bg-yellow-500/20 border-yellow-500/40', text: 'text-yellow-600', symbol: '\u2295\u2295\u2295\u2296' },
  low: { bg: 'bg-orange-500/20 border-orange-500/40', text: 'text-orange-600', symbol: '\u2295\u2295\u2296\u2296' },
  'very low': { bg: 'bg-red-500/20 border-red-500/40', text: 'text-red-600', symbol: '\u2295\u2296\u2296\u2296' },
};

export default function GradeBadge({ certainty, size = 'md' }: GradeBadgeProps) {
  const normalized = certainty.toLowerCase().trim();
  const style = GRADE_STYLES[normalized] || GRADE_STYLES['very low'];

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border ${style.bg} ${style.text} ${padding} font-medium`}>
      <span className="tracking-tight">{style.symbol}</span>
      <span className="capitalize">{certainty}</span>
    </span>
  );
}
