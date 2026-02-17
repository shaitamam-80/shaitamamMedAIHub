'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="p-4 bg-[#f1f5f9] rounded-full mb-4">
        <Icon className="w-12 h-12 text-[#94a3b8]" />
      </div>

      <h3 className="text-xl font-semibold text-[#0f172a] mb-2">{title}</h3>
      <p className="text-[#475569] text-center max-w-md mb-6">{description}</p>

      {actionLabel && (actionHref || onAction) && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
