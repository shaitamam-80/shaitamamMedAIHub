"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { apiClient as api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
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
import { useState } from "react";

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

  const handleSignOut = async () => {
    await signOut();
    router.push("/auth/login");
  };

  const handleQuickStart = async () => {
    setIsCreatingDemo(true);
    try {
      // Create a demo project
      const demoProject = {
        name: `Demo Project ${new Date().toLocaleTimeString()}`,
        description: "Auto-generated demo project for quick start",
        framework_type: "PICO",
      };

      const project = await api.createProject(demoProject);

      toast({
        title: "Demo Project Created! 🚀",
        description: "Redirecting you to the Define tool...",
      });

      // Redirect to Define tool with the new project
      router.push(`/define?project=${project.id}`);
    } catch (error: any) {
      console.error("Failed to create demo project:", error);
      toast({
        variant: "destructive",
        title: "Quick Start Failed",
        description:
          "Could not create a demo project. Please try logging in first.",
      });
      // If auth error, redirect to login
      if (error?.message?.includes("401")) {
        router.push("/auth/login");
      }
    } finally {
      setIsCreatingDemo(false);
    }
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      {/* Logo/Header */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <span className="text-lg font-bold">M</span>
          </div>
          <span className="text-xl font-bold">MedAI Hub</span>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-accent-foreground"
                  )}
                  aria-hidden="true"
                />
                <div className="flex flex-col">
                  <span>{item.name}</span>
                  {item.description && (
                    <span
                      className={cn(
                        "text-xs",
                        isActive
                          ? "text-primary-foreground/80"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.description}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <Separator className="my-4" />

        {/* Quick Start Demo */}
        <div className="px-3 py-2">
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
        </div>

        {/* Additional Info */}
        <div className="px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Systematic Literature Review Platform
          </p>
        </div>
      </ScrollArea>

      {/* User Section */}
      <div className="border-t p-4">
        {loading ? (
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              <div className="h-2 w-16 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ) : user ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <span className="text-sm font-medium">{getUserInitials()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground">Researcher</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        ) : (
          <Link href="/auth/login">
            <Button variant="outline" size="sm" className="w-full">
              <User className="mr-2 h-4 w-4" />
              Sign in
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
