'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, User, Settings as SettingsIcon } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import { STAGES } from '@/lib/utils/stage-config';

export default function TopBar() {
  const pathname = usePathname();

  // Generate breadcrumbs based on pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'לוח בקרה', href: '/' }];

    if (segments.length === 0) return breadcrumbs;

    if (segments[0] === 'projects') {
      if (segments[1] === 'new') {
        breadcrumbs.push({ label: 'פרויקט חדש', href: '/projects/new' });
      } else if (segments[1]) {
        breadcrumbs.push({ label: 'פרויקט', href: `/projects/${segments[1]}` });

        if (segments[2] === 'stages' && segments[3]) {
          const stage = Object.values(STAGES).find(s => s.slug === segments[3]);
          breadcrumbs.push({
            label: stage?.name.he || segments[3],
            href: `/projects/${segments[1]}/stages/${segments[3]}`,
          });
        }
      }
    } else if (segments[0] === 'tools') {
      breadcrumbs.push({ label: 'כלים', href: '/tools' });
      if (segments[1] === 'article-appraisal') {
        breadcrumbs.push({ label: 'Article Appraisal', href: '/tools/article-appraisal' });
      } else if (segments[1] === 'find-journal') {
        breadcrumbs.push({ label: 'Find Journal', href: '/tools/find-journal' });
      }
    } else if (segments[0] === 'settings') {
      breadcrumbs.push({ label: 'הגדרות', href: '/settings' });
    }

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <header className="h-14 bg-[#111827] border-b border-[#1e293b] flex items-center justify-between px-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.href} className="flex items-center gap-2">
            {index > 0 && <ChevronLeft className="w-4 h-4 text-[#64748b]" />}
            {index === breadcrumbs.length - 1 ? (
              <span className="text-[#f1f5f9] font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-[#94a3b8] hover:text-blue-500 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Language Toggle */}
        <LanguageToggle />

        {/* User Menu */}
        <div className="flex items-center gap-2">
          <Link
            href="/settings"
            className="p-2 hover:bg-[#1e293b] rounded-lg transition-colors"
            title="הגדרות"
          >
            <SettingsIcon className="w-5 h-5 text-[#94a3b8]" />
          </Link>

          <button
            className="flex items-center gap-2 px-3 py-2 hover:bg-[#1e293b] rounded-lg transition-colors"
            title="פרופיל"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
              <User className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
