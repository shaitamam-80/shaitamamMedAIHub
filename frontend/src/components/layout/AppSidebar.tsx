'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  FolderOpen,
  Home,
  Settings,
  LogOut,
  ChevronRight,
  ChevronsUpDown,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  STAGES,
  STANDALONE_TOOLS,
  STAGE_ORDER,
  STANDALONE_ORDER,
  type ToolConfig,
} from '@/lib/utils/stage-config';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { type Language } from './LanguageToggle';

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

// ── Hook: listen to language changes ──────────────────────────────

function useLanguage(): Language {
  const [lang, setLang] = React.useState<Language>('en');

  React.useEffect(() => {
    // Sync with current <html> lang on mount
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

// ── Sidebar Tool Item ──────────────────────────────────────────────

function ToolMenuItem({
  tool,
  href,
  isActive,
  lang,
}: {
  tool: ToolConfig;
  href: string;
  isActive: boolean;
  lang: Language;
}) {
  const Icon = getIcon(tool.icon);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={tool.name.en}>
        <Link href={href}>
          <Icon className="size-4" />
          <span>{tool.name[lang]}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// ── Labels ──────────────────────────────────────────────────────────

const LABELS = {
  dashboard: { en: 'Dashboard', he: 'לוח בקרה' },
  myProjects: { en: 'My Projects', he: 'הפרויקטים שלי' },
  pipelineTools: { en: 'Pipeline Tools', he: 'כלי Pipeline' },
  standaloneTools: { en: 'Standalone Tools', he: 'כלים עצמאיים' },
  settings: { en: 'Settings', he: 'הגדרות' },
  logout: { en: 'Log out', he: 'התנתקות' },
  user: { en: 'User', he: 'משתמש' },
} as const;

// ── Main AppSidebar Component ──────────────────────────────────────

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
  const lang = useLanguage();
  const [user, setUser] = React.useState<{ email?: string; fullName?: string } | null>(null);
  const [pipelineOpen, setPipelineOpen] = React.useState(true);
  const [standaloneOpen, setStandaloneOpen] = React.useState(true);

  const supabase = createClient();

  React.useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUser({
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0],
        });
      }
    };
    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const getInitials = (): string => {
    if (user?.fullName) {
      const parts = user.fullName.split(' ');
      return parts
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    }
    return '??';
  };

  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      {/* ── Header / Logo ── */}
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3 px-2 group/logo">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-transform duration-200 group-hover/logo:scale-105">
            M
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-base font-bold tracking-tight gradient-text">
              MedAI Hub
            </span>
            <span className="text-[10px] text-muted-foreground/60 leading-none font-medium tracking-wide uppercase">
              Systematic Reviews
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator />

      {/* ── Main Navigation ── */}
      <SidebarContent>
        {/* Dashboard + Projects */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === '/'} tooltip="Dashboard">
                <Link href="/">
                  <Home className="size-4" />
                  <span>{LABELS.dashboard[lang]}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={isActive('/projects')}
                tooltip="My Projects"
              >
                <Link href="/projects">
                  <FolderOpen className="size-4" />
                  <span>{LABELS.myProjects[lang]}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Pipeline Tools (10) */}
        <Collapsible open={pipelineOpen} onOpenChange={setPipelineOpen} className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>{LABELS.pipelineTools[lang]}</span>
                <ChevronRight className="size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {STAGE_ORDER.map((stageName) => {
                    const stage = STAGES[stageName];
                    const href = `/tools/${stage.slug}`;
                    return (
                      <ToolMenuItem
                        key={stage.slug}
                        tool={stage}
                        href={href}
                        isActive={isActive(href)}
                        lang={lang}
                      />
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        <SidebarSeparator />

        {/* Standalone Tools (4) */}
        <Collapsible open={standaloneOpen} onOpenChange={setStandaloneOpen} className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>{LABELS.standaloneTools[lang]}</span>
                <ChevronRight className="size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>
                  {STANDALONE_ORDER.map((toolName) => {
                    const tool = STANDALONE_TOOLS[toolName];
                    const href = `/tools/${tool.slug}`;
                    return (
                      <ToolMenuItem
                        key={tool.slug}
                        tool={tool}
                        href={href}
                        isActive={isActive(href)}
                        lang={lang}
                      />
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>

      {/* ── Footer / User Section ── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActive('/settings')}
              tooltip="Settings"
            >
              <Link href="/settings">
                <Settings className="size-4" />
                <span>{LABELS.settings[lang]}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator />

        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white text-xs font-bold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-start text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user?.fullName || LABELS.user[lang]}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || ''}
                    </span>
                  </div>
                  <ChevronsUpDown className="ms-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="size-4" />
                    <span>{LABELS.settings[lang]}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="size-4" />
                  <span>{LABELS.logout[lang]}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
