"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  FolderOpen,
  Home,
  Info,
  LogOut,
  MessageSquare,
  PlayCircle,
  Search,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const navigation = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "Projects",
    href: "/projects",
    icon: FolderOpen,
  },
  {
    name: "Define",
    href: "/define",
    icon: MessageSquare,
    description: "Research Question Formulator",
  },
  {
    name: "Query",
    href: "/query",
    icon: Search,
    description: "PubMed Search Builder",
  },
  {
    name: "Review",
    href: "/review",
    icon: FileText,
    description: "Literature Screening",
  },
  {
    name: "About",
    href: "/about",
    icon: Info,
    description: "About the Creator",
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, loading } = useAuth();
  const { toast } = useToast();
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

  // Collapse state with localStorage persistence
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    // Load collapsed state from localStorage on mount
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") {
      setIsCollapsed(true);
    }
  }, []);

  useEffect(() => {
    // Save collapsed state to localStorage
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
      if (
        error instanceof Error &&
        error.message?.includes("401")
      ) {
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

  return (
    <TooltipProvider delayDuration={0}>
      <motion.div
        className="relative flex flex-col glass-floating rounded-2xl shadow-indigo"
        initial={false}
        animate={{
          width: isCollapsed ? 72 : 256,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        style={{ height: "calc(100vh - 2rem)" }}
      >
        {/* Collapse Toggle Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 z-50 h-6 w-6 rounded-full border bg-background shadow-md hover:bg-accent"
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
        </Button>

        {/* Logo/Header */}
        <div className="flex h-16 items-center border-b border-border/50 px-4">
          <Link href="/" className="flex items-center space-x-2 overflow-hidden">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <span className="text-lg font-bold">M</span>
            </div>
            <AnimatePresence>
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-xl font-bold whitespace-nowrap overflow-hidden"
                >
                  MedAI Hub
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="space-y-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"));

              const NavContent = (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {/* Glowing active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full glow-indigo"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}

                  <item.icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0 transition-colors",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-accent-foreground"
                    )}
                    aria-hidden="true"
                  />

                  <AnimatePresence>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col overflow-hidden"
                      >
                        <span className="whitespace-nowrap">{item.name}</span>
                        {item.description && (
                          <span
                            className={cn(
                              "text-xs whitespace-nowrap",
                              isActive
                                ? "text-primary/70"
                                : "text-muted-foreground"
                            )}
                          >
                            {item.description}
                          </span>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Link>
              );

              // Wrap in tooltip when collapsed
              if (isCollapsed) {
                return (
                  <Tooltip key={item.name}>
                    <TooltipTrigger asChild>{NavContent}</TooltipTrigger>
                    <TooltipContent side="right" className="flex flex-col">
                      <span className="font-medium">{item.name}</span>
                      {item.description && (
                        <span className="text-xs text-muted-foreground">
                          {item.description}
                        </span>
                      )}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return NavContent;
            })}
          </nav>

          <Separator className="my-4" />

          {/* Quick Start Demo */}
          <div className="px-1">
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="w-full border-primary/20 hover:bg-primary/5 hover:text-primary"
                    onClick={handleQuickStart}
                    disabled={isCreatingDemo}
                  >
                    {isCreatingDemo ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">Quick Start Demo</TooltipContent>
              </Tooltip>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 border-primary/20 hover:bg-primary/5 hover:text-primary"
                onClick={handleQuickStart}
                disabled={isCreatingDemo}
              >
                {isCreatingDemo ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <PlayCircle className="h-4 w-4" />
                )}
                Quick Start Demo
              </Button>
            )}
          </div>

          {/* Additional Info */}
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-3 py-2"
              >
                <p className="text-xs text-muted-foreground">
                  Systematic Literature Review Platform
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </ScrollArea>

        {/* User Section */}
        <div className="border-t border-border/50 p-3">
          {loading ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
              {!isCollapsed && (
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-2 w-16 animate-pulse rounded bg-muted" />
                </div>
              )}
            </div>
          ) : user ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                {isCollapsed ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground cursor-default">
                        <span className="text-sm font-medium">
                          {getUserInitials()}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Researcher</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <>
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <span className="text-sm font-medium">
                        {getUserInitials()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <p className="text-sm font-medium truncate">{user.email}</p>
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
                      className="w-full text-muted-foreground hover:text-destructive"
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Sign out</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              )}
            </div>
          ) : isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/auth/login">
                  <Button variant="outline" size="icon" className="w-full">
                    <User className="h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Sign in</TooltipContent>
            </Tooltip>
          ) : (
            <Link href="/auth/login">
              <Button variant="outline" size="sm" className="w-full">
                <User className="mr-2 h-4 w-4" />
                Sign in
              </Button>
            </Link>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
