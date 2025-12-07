"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { apiClient as api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  FileText,
  Filter,
  FolderOpen,
  Home,
  Info,
  LogOut,
  MessageSquare,
  Sparkles,
  Search,
  User,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Navigation items with step numbers for workflow clarity
const navigation = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    description: "Dashboard",
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderOpen,
    description: "Manage Projects",
  },
  {
    name: "Define",
    href: "/define",
    icon: MessageSquare,
    description: "Step 1: Research Question",
    step: 1,
    color: "indigo",
  },
  {
    name: "Query",
    href: "/query",
    icon: Search,
    description: "Step 2: Search Builder",
    step: 2,
    color: "teal",
  },
  {
    name: "Screen",
    href: "/screening",
    icon: Filter,
    description: "Step 3: Smart Screener",
    step: 3,
    color: "emerald",
  },
  {
    name: "Review",
    href: "/review",
    icon: FileText,
    description: "Step 4: Full-Text Review",
    step: 4,
    color: "amber",
  },
  {
    name: "About",
    href: "/about",
    icon: Info,
    description: "About Creator",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const handleQuickStart = async () => {
    setIsCreatingDemo(true);
    try {
      const demoProject = {
        name: `Demo Project ${new Date().toLocaleTimeString()}`,
        description: "Auto-generated demo project for quick start",
        framework_type: "PICO",
      };

      const project = await api.createProject(demoProject);

      toast({
        title: "Demo Project Created!",
        description: "Redirecting you to the Define tool...",
      });

      router.push(`/define?project=${project.id}`);
    } catch (error: unknown) {
      console.error("Failed to create demo project:", error);
      toast({
        variant: "destructive",
        title: "Quick Start Failed",
        description:
          "Could not create a demo project. Please try logging in first.",
      });
      if (error instanceof Error && error.message?.includes("401")) {
        router.push("/auth/login");
      }
    } finally {
      setIsCreatingDemo(false);
    }
  };

  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  const getStepColor = (color?: string, isActive?: boolean) => {
    if (!color) return "";
    const colors = {
      indigo: isActive
        ? "bg-primary/15 text-primary border-primary/30"
        : "text-primary/70 group-hover:text-primary",
      teal: isActive
        ? "bg-secondary/15 text-secondary border-secondary/30"
        : "text-secondary/70 group-hover:text-secondary",
      emerald: isActive
        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
        : "text-emerald-600/70 dark:text-emerald-400/70 group-hover:text-emerald-600 dark:group-hover:text-emerald-400",
      amber: isActive
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        : "text-amber-600/70 dark:text-amber-400/70 group-hover:text-amber-600 dark:group-hover:text-amber-400",
    };
    return colors[color as keyof typeof colors] || "";
  };

  return (
    <TooltipProvider delayDuration={0}>
      <motion.aside
        className="relative flex flex-col glass-floating rounded-2xl overflow-hidden"
        initial={false}
        animate={{
          width: isCollapsed ? 72 : 280,
        }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{ height: "calc(100vh - 2rem)" }}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 gradient-radial-top pointer-events-none opacity-50" />

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-7 z-50 h-6 w-6 rounded-full border border-border/50 bg-card shadow-elevation-2 hover:bg-accent hover:shadow-elevation-3 transition-all duration-200"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </motion.div>
        </Button>

        {/* Logo/Header */}
        <div className="relative flex h-16 items-center px-4">
          <Link
            href="/"
            className="flex items-center gap-3 overflow-hidden group"
          >
            <div className="relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-elevation-2 group-hover:shadow-glow-primary transition-all duration-300">
              <Sparkles className="h-5 w-5" />
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className="flex flex-col overflow-hidden"
                >
                  <span className="text-lg font-bold whitespace-nowrap tracking-tight">
                    MedAI Hub
                  </span>
                  <span className="text-2xs text-muted-foreground whitespace-nowrap">
                    Systematic Review Platform
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-4 divider-gradient" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="space-y-1.5">
            {navigation.map((item, index) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"));

              const NavContent = (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-accent text-foreground shadow-elevation-1"
                      : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}

                  {/* Icon with step indicator */}
                  <div
                    className={cn(
                      "relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                      item.step
                        ? getStepColor(item.color, isActive)
                        : isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground group-hover:bg-accent group-hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" aria-hidden="true" />
                    {item.step && !isCollapsed && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-card border border-border text-2xs font-bold shadow-sm">
                        {item.step}
                      </span>
                    )}
                  </div>

                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className="flex flex-col min-w-0 overflow-hidden"
                      >
                        <span className="font-semibold whitespace-nowrap">
                          {item.name}
                        </span>
                        <span
                          className={cn(
                            "text-xs whitespace-nowrap truncate",
                            isActive
                              ? "text-muted-foreground"
                              : "text-muted-foreground/70"
                          )}
                        >
                          {item.description}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              );

              if (isCollapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>{NavContent}</TooltipTrigger>
                    <TooltipContent
                      side="right"
                      className="flex flex-col gap-0.5"
                      sideOffset={12}
                    >
                      <span className="font-semibold">{item.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {item.description}
                      </span>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return NavContent;
            })}
          </nav>

          {/* Quick Start Section */}
          <div className="mt-6 px-1">
            <AnimatePresence>
              {!isCollapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-2xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-2"
                >
                  Quick Actions
                </motion.p>
              )}
            </AnimatePresence>

            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-full h-10 border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all duration-200"
                    onClick={handleQuickStart}
                    disabled={isCreatingDemo}
                  >
                    {isCreatingDemo ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={12}>
                  Quick Start Demo
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2.5 h-10 border-primary/20 hover:bg-primary/10 hover:text-primary hover:border-primary/40 transition-all duration-200"
                onClick={handleQuickStart}
                disabled={isCreatingDemo}
              >
                {isCreatingDemo ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <Zap className="h-4 w-4" />
                )}
                <span>Quick Start Demo</span>
              </Button>
            )}
          </div>
        </ScrollArea>

        {/* User Section */}
        <div className="relative border-t border-border/30 p-3">
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-xl bg-muted" />
              {!isCollapsed && (
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-2 w-16 animate-pulse rounded bg-muted" />
                </div>
              )}
            </div>
          ) : user ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-primary text-primary-foreground cursor-default shadow-sm">
                        <span className="text-sm font-semibold">
                          {getUserInitials()}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" sideOffset={12}>
                      <p className="font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Researcher</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <>
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/80 to-primary text-primary-foreground shadow-sm">
                      <span className="text-sm font-semibold">
                        {getUserInitials()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-sm font-semibold truncate">
                        {user.email}
                      </p>
                      <p className="text-xs text-muted-foreground">Researcher</p>
                    </div>
                  </>
                )}
              </div>

              {isCollapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={12}>
                    Sign out
                  </TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              )}
            </div>
          ) : isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-full h-10"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={12}>
                Sign in
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="w-full gap-2">
                <User className="h-4 w-4" />
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </motion.aside>
    </TooltipProvider>
  );
}
