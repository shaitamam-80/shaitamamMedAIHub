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
  ChevronLeft,
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

// ── Sidebar Tool Item ──────────────────────────────────────────────

function ToolMenuItem({
  tool,
  href,
  isActive,
}: {
  tool: ToolConfig;
  href: string;
  isActive: boolean;
}) {
  const Icon = getIcon(tool.icon);

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={tool.name.en}>
        <Link href={href}>
          <Icon className="size-4" />
          <span>{tool.name.he}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// ── Main AppSidebar Component ──────────────────────────────────────

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useSidebar();
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
    <Sidebar side="right" variant="sidebar" collapsible="icon">
      {/* ── Header / Logo ── */}
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3 px-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 text-white font-bold text-sm">
            M
          </div>
          <div className="flex flex-col group-data-[collapsible=icon]:hidden">
            <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              MedAI Hub
            </span>
            <span className="text-[10px] text-muted-foreground leading-none">
              AI-Powered Research
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
                  <span>לוח בקרה</span>
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
                  <span>הפרויקטים שלי</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Pipeline Tools (9) */}
        <Collapsible open={pipelineOpen} onOpenChange={setPipelineOpen} className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger className="flex w-full items-center justify-between">
                <span>כלי Pipeline</span>
                <ChevronLeft className="size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-[-90deg]" />
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
                <span>כלים עצמאיים</span>
                <ChevronLeft className="size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-[-90deg]" />
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
                <span>הגדרות</span>
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
                      {user?.fullName || 'משתמש'}
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
                    <span>הגדרות</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                  <LogOut className="size-4" />
                  <span>התנתקות</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
