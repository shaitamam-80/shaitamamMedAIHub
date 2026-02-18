'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
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

// ── Breadcrumb Generator ───────────────────────────────────────────

interface Crumb {
  label: string;
  href: string;
}

function useBreadcrumbs(): Crumb[] {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [{ label: 'לוח בקרה', href: '/' }];

  if (segments.length === 0) return crumbs;

  if (segments[0] === 'projects') {
    crumbs.push({ label: 'פרויקטים', href: '/projects' });

    if (segments[1] === 'new') {
      crumbs.push({ label: 'פרויקט חדש', href: '/projects/new' });
    } else if (segments[1]) {
      crumbs.push({ label: 'פרויקט', href: `/projects/${segments[1]}` });

      if (segments[2] === 'stages' && segments[3]) {
        const stage = Object.values(STAGES).find((s) => s.slug === segments[3]);
        crumbs.push({
          label: stage?.name.he || segments[3],
          href: `/projects/${segments[1]}/stages/${segments[3]}`,
        });
      }
    }
  } else if (segments[0] === 'tools') {
    crumbs.push({ label: 'כלים', href: '/' });

    if (segments[1]) {
      const slug = segments[1] as ToolSlug;
      const tool =
        Object.values(STAGES).find((s) => s.slug === slug) ||
        Object.values(STANDALONE_TOOLS).find((s) => s.slug === slug);
      if (tool) {
        crumbs.push({
          label: tool.name.he,
          href: `/tools/${segments[1]}`,
        });
      }
    }
  } else if (segments[0] === 'settings') {
    crumbs.push({ label: 'הגדרות', href: '/settings' });
  }

  return crumbs;
}

// ── TopBar Component ───────────────────────────────────────────────

export default function TopBar() {
  const crumbs = useBreadcrumbs();

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
                    <ChevronLeft className="size-3.5" />
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
