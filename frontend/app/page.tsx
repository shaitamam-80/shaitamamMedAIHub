"use client";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { apiClient as api } from "@/lib/api";
import {
  ClipboardCheck,
  FileSearch,
  FolderOpen,
  Home,
  LayoutGrid,
  Lightbulb,
  PlayCircle,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);

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
    } catch (error) {
      console.error("Failed to create demo project:", error);
      toast({
        variant: "destructive",
        title: "Quick Start Failed",
        description:
          "Could not create a demo project. Please try logging in first.",
      });
      // If auth error, redirect to login
      if (error instanceof Error && error.message.includes("401")) {
        router.push("/auth/login");
      }
    } finally {
      setIsCreatingDemo(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background">
      {/* Hero Section */}
      <main className="flex-grow px-4 pt-16 pb-12 text-center md:pt-24">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 max-w-4xl font-display text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">
            Welcome to <span className="text-primary">MedAI Hub</span>
          </h1>

          <p className="mb-10 max-w-2xl text-lg font-medium text-muted-foreground sm:text-xl">
            Streamlining medical research from question to conclusion. Leverage
            AI to formulate questions, build search queries, and screen
            abstracts efficiently.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/projects">
              <Button size="lg" className="h-12 px-8 text-base font-bold">
                <FolderOpen className="mr-2 h-5 w-5" />
                Go to Projects
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base font-bold"
              onClick={() =>
                toast({
                  title: "Demo Mode",
                  description: "Quick start demo coming soon!",
                })
              }
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Quick Start Demo
            </Button>
          </div>
        </div>
      </main>

      {/* Pipeline Visualization Section (v2.0) */}
      <section className="px-4 py-12 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold font-display">
              Research Pipeline
            </h2>
            <p className="text-muted-foreground">
              A seamless flow from question to evidence
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Connecting Lines (Desktop) */}
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0"></div>

            {/* Define Tool */}
            <Link href="/define" className="group relative z-10">
              <div className="flex h-full flex-col items-center text-center rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Lightbulb className="h-8 w-8 text-primary group-hover:text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-bold font-display">
                  1. Define
                </h3>
                <p className="text-sm text-muted-foreground">
                  Formulate clear research questions using PICO, SPIDER, and
                  other frameworks with AI guidance.
                </p>
              </div>
            </Link>

            {/* Query Tool */}
            <Link href="/query" className="group relative z-10">
              <div className="flex h-full flex-col items-center text-center rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Search className="h-8 w-8 text-primary group-hover:text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-bold font-display">
                  2. Query
                </h3>
                <p className="text-sm text-muted-foreground">
                  Automatically generate optimized PubMed search strings with
                  methodological hedges.
                </p>
              </div>
            </Link>

            {/* Review Tool */}
            <Link href="/review" className="group relative z-10">
              <div className="flex h-full flex-col items-center text-center rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <ClipboardCheck className="h-8 w-8 text-primary group-hover:text-primary-foreground" />
                </div>
                <h3 className="mb-2 text-xl font-bold font-display">
                  3. Review
                </h3>
                <p className="text-sm text-muted-foreground">
                  Screen abstracts efficiently with AI-powered relevance scoring
                  and reasoning.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-center mb-12 font-display">
            Why MedAI Hub?
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <LayoutGrid className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2 font-display">
                  Dynamic Frameworks
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Adapt your research methodology with flexible options like
                  PICO, CoCoPop, PEO, SPIDER, and more.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2 font-display">
                  AI Analysis
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Leverage Google Gemini AI to identify key themes, extract
                  data, and provide insights from articles.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Workflow className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2 font-display">
                  Project Workflow
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Organize your research into distinct projects for better
                  management and seamless collaboration.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-100 dark:bg-orange-900/30">
                <FileSearch className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-2 font-display">
                  MEDLINE Parser
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Seamlessly import and parse citations and abstracts directly
                  from PubMed MEDLINE format files.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Navigation Bar - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 border-t border-border bg-background/80 backdrop-blur-lg md:hidden z-50">
        <div className="flex h-full items-center justify-around px-2">
          <Link
            href="/"
            className="flex flex-col items-center justify-center gap-1 text-primary"
          >
            <Home className="h-6 w-6" style={{ fill: "currentColor" }} />
            <span className="text-[10px] font-medium">Home</span>
          </Link>
          <Link
            href="/projects"
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <FolderOpen className="h-6 w-6" />
            <span className="text-[10px] font-medium">Projects</span>
          </Link>
          <Link
            href="/define"
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lightbulb className="h-6 w-6" />
            <span className="text-[10px] font-medium">Define</span>
          </Link>
          <Link
            href="/query"
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="h-6 w-6" />
            <span className="text-[10px] font-medium">Query</span>
          </Link>
          <Link
            href="/review"
            className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ClipboardCheck className="h-6 w-6" />
            <span className="text-[10px] font-medium">Review</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
