'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import LanguageToggle, { type Language } from './LanguageToggle';
import { STAGES, STANDALONE_TOOLS, type ToolSlug } from '@/lib/utils/stage-config';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// ── Labels ──────────────────────────────────────────────────────────

const LABELS = {
  dashboard: { en: 'Dashboard', he: 'לוח בקרה' },
  projects: { en: 'Projects', he: 'פרויקטים' },
  newProject: { en: 'New Project', he: 'פרויקט חדש' },
  project: { en: 'Project', he: 'פרויקט' },
  tools: { en: 'Tools', he: 'כלים' },
  settings: { en: 'Settings', he: 'הגדרות' },
} as const;

// ── Hook: listen to language changes ──────────────────────────────

function useLanguage(): Language {
  const [lang, setLang] = React.useState<Language>('en');

  React.useEffect(() => {
    const htmlLang = document.documentElement.lang as Language;
    if (htmlLang === 'he' || htmlLang === 'en') setLang(htmlLang);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Language;
      setLang(detail);
    };
    window.addEventListener('languagechange', handler);
    return () => window.removeEventListener('languagechange', handler);
  }, []);

  return lang;
}

// ── Breadcrumb Generator ───────────────────────────────────────────

interface Crumb {
  label: string;
  href: string;
}

function useBreadcrumbs(lang: Language): Crumb[] {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [{ label: LABELS.dashboard[lang], href: '/' }];

  if (segments.length === 0) return crumbs;

  if (segments[0] === 'projects') {
    crumbs.push({ label: LABELS.projects[lang], href: '/projects' });

    if (segments[1] === 'new') {
      crumbs.push({ label: LABELS.newProject[lang], href: '/projects/new' });
    } else if (segments[1]) {
      crumbs.push({ label: LABELS.project[lang], href: `/projects/${segments[1]}` });

      if (segments[2] === 'stages' && segments[3]) {
        const stage = Object.values(STAGES).find((s) => s.slug === segments[3]);
        crumbs.push({
          label: stage?.name[lang] || segments[3],
          href: `/projects/${segments[1]}/stages/${segments[3]}`,
        });
      }
    }
  } else if (segments[0] === 'tools') {
    crumbs.push({ label: LABELS.tools[lang], href: '/' });

    if (segments[1]) {
      const slug = segments[1] as ToolSlug;
      const tool =
        Object.values(STAGES).find((s) => s.slug === slug) ||
        Object.values(STANDALONE_TOOLS).find((s) => s.slug === slug);
      if (tool) {
        crumbs.push({
          label: tool.name[lang],
          href: `/tools/${segments[1]}`,
        });
      }
    }
  } else if (segments[0] === 'settings') {
    crumbs.push({ label: LABELS.settings[lang], href: '/settings' });
  }

  return crumbs;
}

// ── TopBar Component ───────────────────────────────────────────────

export default function TopBar() {
  const lang = useLanguage();
  const crumbs = useBreadcrumbs(lang);

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      {/* Sidebar toggle (mobile & collapsed) */}
      <SidebarTrigger className="-ms-1" />
      <Separator orientation="vertical" className="mx-2 !h-4" />

      {/* Breadcrumbs */}
      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <BreadcrumbItem key={crumb.href}>
                {index > 0 && (
                  <BreadcrumbSeparator>
                    <ChevronRight className="size-3.5" />
                  </BreadcrumbSeparator>
                )}
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      {/* Right section */}
      <div className="flex items-center gap-2">
        <LanguageToggle />
      </div>
    </header>
  );
}
