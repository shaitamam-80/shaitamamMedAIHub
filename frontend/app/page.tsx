"use client";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient as api, type Project } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";
import {
  ChevronRight,
  ClipboardCheck,
  FileSearch,
  LayoutGrid,
  Lightbulb,
  MessageSquare,
  Search,
  Sparkles,
  Workflow,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Step configuration
const STEP_CONFIG = {
  DEFINE: { step: 1, label: "Define Question", icon: MessageSquare, color: "indigo", href: "/define" },
  QUERY: { step: 2, label: "Build Query", icon: Search, color: "teal", href: "/query" },
  REVIEW: { step: 3, label: "Screen Abstracts", icon: ClipboardCheck, color: "emerald", href: "/review" },
  COMPLETED: { step: 4, label: "Completed", icon: Sparkles, color: "amber", href: "/projects" },
};

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // Fetch recent projects when user is logged in
  useEffect(() => {
    async function fetchRecentProjects() {
      if (!user) return;

      setIsLoadingProjects(true);
      try {
        const projects = await api.getProjects();
        // Sort by updated_at and take the 4 most recent
        const sorted = projects
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 4);
        setRecentProjects(sorted);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoadingProjects(false);
      }
    }

    fetchRecentProjects();
  }, [user]);

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
    } catch (error) {
      console.error("Failed to create demo project:", error);
      toast({
        variant: "destructive",
        title: "Quick Start Failed",
        description:
          "Could not create a demo project. Please try logging in first.",
      });
      if (error instanceof Error && error.message.includes("401")) {
        router.push("/auth/login");
      }
    } finally {
      setIsCreatingDemo(false);
    }
  };

  // Get progress percentage based on step
  const getProgress = (currentStep: string) => {
    switch (currentStep) {
      case "DEFINE": return 25;
      case "QUERY": return 50;
      case "REVIEW": return 75;
      case "COMPLETED": return 100;
      default: return 25;
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background">
      {/* Hero Section */}
      <main className="flex-grow px-4 pt-16 pb-12 text-center md:pt-24">
        <motion.div
          className="mx-auto max-w-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="mb-6 max-w-4xl font-display text-3xl font-bold tracking-tight sm:text-5xl md:text-6xl text-balance">
            Welcome to <span className="text-primary">MedAI Hub</span>
          </h1>

          <p className="mb-10 max-w-2xl mx-auto text-lg font-medium text-muted-foreground sm:text-xl">
            Streamlining medical research from question to conclusion. Leverage
            AI to formulate questions, build search queries, and screen
            abstracts efficiently.
          </p>
        </motion.div>
      </main>

      {/* Continue Your Research Section (for logged-in users) */}
      {user && (
        <section className="px-4 py-8 bg-accent/30">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold font-display">Continue Your Research</h2>
              <Link href="/projects" className="text-sm text-primary hover:underline">
                View all projects
              </Link>
            </div>

            {isLoadingProjects ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-muted rounded" />
                        <div className="h-3 w-24 bg-muted rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {recentProjects.map((project, index) => {
                  const stepKey = (project.current_step || "DEFINE") as keyof typeof STEP_CONFIG;
                  const stepConfig = STEP_CONFIG[stepKey] || STEP_CONFIG.DEFINE;
                  const StepIcon = stepConfig.icon;
                  const progress = getProgress(stepKey);

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <Link href={`${stepConfig.href}?project=${project.id}`}>
                        <Card className="hover-lift cursor-pointer group">
                          <CardContent className="p-4 flex items-center gap-4">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                                stepConfig.color === "indigo" && "bg-indigo-100 dark:bg-indigo-950 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900",
                                stepConfig.color === "teal" && "bg-teal-100 dark:bg-teal-950 group-hover:bg-teal-200 dark:group-hover:bg-teal-900",
                                stepConfig.color === "emerald" && "bg-emerald-100 dark:bg-emerald-950 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900",
                                stepConfig.color === "amber" && "bg-amber-100 dark:bg-amber-950 group-hover:bg-amber-200 dark:group-hover:bg-amber-900"
                              )}
                            >
                              <StepIcon
                                className={cn(
                                  "w-6 h-6",
                                  stepConfig.color === "indigo" && "text-indigo-600 dark:text-indigo-400",
                                  stepConfig.color === "teal" && "text-teal-600 dark:text-teal-400",
                                  stepConfig.color === "emerald" && "text-emerald-600 dark:text-emerald-400",
                                  stepConfig.color === "amber" && "text-amber-600 dark:text-amber-400"
                                )}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-foreground truncate">{project.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Step {stepConfig.step}: {stepConfig.label}
                              </p>
                              {/* Progress bar */}
                              <div className="h-1.5 mt-2 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className={cn(
                                    "h-full rounded-full",
                                    stepConfig.color === "indigo" && "bg-indigo-500",
                                    stepConfig.color === "teal" && "bg-teal-500",
                                    stepConfig.color === "emerald" && "bg-emerald-500",
                                    stepConfig.color === "amber" && "bg-amber-500"
                                  )}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                                />
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    No recent projects. Start your first research!
                  </p>
                  <Button onClick={handleQuickStart} disabled={isCreatingDemo}>
                    {isCreatingDemo ? "Creating..." : "Quick Start Demo"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Pipeline Visualization Section */}
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
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 z-0" />

            {/* Define Tool */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Link href="/define" className="group relative z-10 block">
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
            </motion.div>

            {/* Query Tool */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Link href="/query" className="group relative z-10 block">
                <div className="flex h-full flex-col items-center text-center rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 transition-colors group-hover:bg-secondary group-hover:text-secondary-foreground">
                    <Search className="h-8 w-8 text-secondary group-hover:text-secondary-foreground" />
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
            </motion.div>

            {/* Review Tool */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Link href="/review" className="group relative z-10 block">
                <div className="flex h-full flex-col items-center text-center rounded-xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 transition-colors group-hover:bg-emerald-500 group-hover:text-white">
                    <ClipboardCheck className="h-8 w-8 text-emerald-500 group-hover:text-white" />
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
            </motion.div>
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                <LayoutGrid className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="flex flex-col gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-col gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-teal-100 dark:bg-teal-900/30">
                <Workflow className="h-6 w-6 text-teal-600 dark:text-teal-400" />
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="flex flex-col gap-4 p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors"
            >
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
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
