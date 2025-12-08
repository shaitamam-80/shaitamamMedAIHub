"use client";

import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiClient as api, type Project } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Database,
  FileText,
  Loader2,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

// Step configuration
const STEP_CONFIG = {
  DEFINE: {
    step: 1,
    label: "Define Question",
    icon: MessageSquare,
    color: "primary",
    href: "/define",
  },
  QUERY: {
    step: 2,
    label: "Build Query",
    icon: Search,
    color: "secondary",
    href: "/query",
  },
  REVIEW: {
    step: 3,
    label: "Screen Abstracts",
    icon: ClipboardCheck,
    color: "emerald",
    href: "/review",
  },
  COMPLETED: {
    step: 4,
    label: "Completed",
    icon: Sparkles,
    color: "amber",
    href: "/projects",
  },
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
};

// Demo Card Component
function DemoCard({
  label,
  value,
  variant
}: {
  label: string;
  value: string;
  variant: "blue" | "violet" | "amber" | "emerald";
}) {
  const variantClasses = {
    blue: "demo-card-blue",
    violet: "demo-card-violet",
    amber: "demo-card-amber",
    emerald: "demo-card-emerald",
  };

  return (
    <div className={cn("demo-card", variantClasses[variant])}>
      <span className="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">
        {label}
      </span>
      <span className="text-sm font-medium leading-relaxed">{value}</span>
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreatingDemo, setIsCreatingDemo] = useState(false);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // AI Demo State
  const [demoInput, setDemoInput] = useState("");
  const [demoResult, setDemoResult] = useState<{
    p: string;
    i: string;
    c: string;
    o: string;
  } | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  useEffect(() => {
    async function fetchRecentProjects() {
      if (!user) return;
      setIsLoadingProjects(true);
      try {
        const projects = await api.getProjects();
        const sorted = projects
          .sort(
            (a, b) =>
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
          )
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

  // AI Demo Handler - calls backend API
  const runDemo = async () => {
    if (!demoInput.trim()) return;
    setIsDemoLoading(true);
    setDemoResult(null);

    try {
      // Call backend to structure the research question
      const response = await api.chat(
        "demo", // Special demo mode - project_id
        `Structure this research topic into PICO format: "${demoInput}"`,
        "PICO",
        "en"
      );

      // Extract PICO from extracted_fields if available
      if (response.extracted_fields) {
        setDemoResult({
          p: response.extracted_fields.P || response.extracted_fields.population || "N/A",
          i: response.extracted_fields.I || response.extracted_fields.intervention || "N/A",
          c: response.extracted_fields.C || response.extracted_fields.comparison || "Standard Care",
          o: response.extracted_fields.O || response.extracted_fields.outcome || "N/A",
        });
      } else {
        // Fallback: show example result
        setDemoResult({
          p: "Adults with the condition",
          i: "The proposed intervention",
          c: "Standard care or placebo",
          o: "Primary health outcomes",
        });
      }
    } catch (error) {
      console.error("Demo failed:", error);
      // Show a mock result on error
      setDemoResult({
        p: "College students experiencing anxiety",
        i: "Mindfulness meditation program",
        c: "No intervention / waitlist control",
        o: "Reduction in anxiety symptoms (GAD-7 scores)",
      });
      toast({
        title: "Demo Mode",
        description: "Showing example PICO structure. Sign in to use full AI features.",
      });
    } finally {
      setIsDemoLoading(false);
    }
  };

  const getProgress = (currentStep: string) => {
    switch (currentStep) {
      case "DEFINE": return 25;
      case "QUERY": return 50;
      case "REVIEW": return 75;
      case "COMPLETED": return 100;
      default: return 25;
    }
  };

  const getStepStyles = (color: string) => {
    const styles = {
      primary: {
        bg: "bg-primary/10",
        bgHover: "group-hover:bg-primary/20",
        icon: "text-primary",
        progress: "bg-primary",
      },
      secondary: {
        bg: "bg-secondary/10",
        bgHover: "group-hover:bg-secondary/20",
        icon: "text-secondary",
        progress: "bg-secondary",
      },
      emerald: {
        bg: "bg-emerald-500/10",
        bgHover: "group-hover:bg-emerald-500/20",
        icon: "text-emerald-600",
        progress: "bg-emerald-500",
      },
      amber: {
        bg: "bg-amber-500/10",
        bgHover: "group-hover:bg-amber-500/20",
        icon: "text-amber-600",
        progress: "bg-amber-500",
      },
    };
    return styles[color as keyof typeof styles] || styles.primary;
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-slate-50">
      {/* Background Effects */}
      <div className="absolute inset-0 gradient-mesh pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] gradient-radial-top pointer-events-none opacity-60" />

      {/* Hero Section */}
      <motion.section
        className="relative px-6 pt-20 pb-16 md:pt-28 md:pb-20"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="mx-auto max-w-5xl text-center">
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Systematic Reviews, Accelerated.
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight mb-6 leading-tight"
          >
            Evidence Synthesis for{" "}
            <br className="hidden sm:block" />
            <span className="text-gradient-hero">Modern Medicine</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
          >
            Formulate precise research questions, generate validated PubMed
            queries, and screen abstracts with AI-powered precision.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button
              size="lg"
              onClick={handleQuickStart}
              disabled={isCreatingDemo}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-900/10 rounded-xl min-w-[180px]"
            >
              {isCreatingDemo ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Start New Project
                  <ArrowRight className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400 bg-white shadow-sm rounded-xl"
            >
              <Link href="/about">View Methodology</Link>
            </Button>
          </motion.div>
        </div>
      </motion.section>

      {/* Live AI Demo Section */}
      <section className="relative py-16 bg-gradient-to-b from-indigo-50/80 to-white overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
        <div className="container mx-auto px-6 max-w-4xl relative z-10">
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-2">
              <Sparkles className="w-5 h-5" />
              <span>Try it Live</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
              Experience the Power of AI
            </h2>
            <p className="text-slate-600 mt-2">
              Type a rough research idea below, and watch AI structure it
              instantly.
            </p>
          </motion.div>

          <motion.div
            className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-4 md:p-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                type="text"
                placeholder="e.g., Does mindfulness meditation reduce anxiety in college students?"
                className="flex-1 h-12 px-4 rounded-xl border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runDemo()}
              />
              <Button
                size="lg"
                className="shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md rounded-xl"
                onClick={runDemo}
                disabled={isDemoLoading || !demoInput.trim()}
              >
                {isDemoLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Structure with AI
                  </>
                )}
              </Button>
            </div>

            {/* Results Area */}
            {(demoResult || isDemoLoading) && (
              <motion.div
                className="mt-8"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {isDemoLoading ? (
                    [...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="h-24 bg-slate-100 rounded-xl animate-pulse"
                      />
                    ))
                  ) : demoResult ? (
                    <>
                      <DemoCard
                        label="Population"
                        value={demoResult.p}
                        variant="blue"
                      />
                      <DemoCard
                        label="Intervention"
                        value={demoResult.i}
                        variant="violet"
                      />
                      <DemoCard
                        label="Comparison"
                        value={demoResult.c}
                        variant="amber"
                      />
                      <DemoCard
                        label="Outcome"
                        value={demoResult.o}
                        variant="emerald"
                      />
                    </>
                  ) : null}
                </div>
                {!isDemoLoading && demoResult && (
                  <div className="mt-4 text-center">
                    <p className="text-xs text-slate-400 flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Powered by Gemini AI
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Continue Research Section (Logged In Users) */}
      {user && (
        <section className="relative px-6 py-12 bg-white/50 border-y border-slate-200/50">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Continue Your Research
                </h2>
                <p className="text-sm text-slate-500">
                  Pick up where you left off
                </p>
              </div>
              <Link
                href="/projects"
                className="text-sm font-medium text-primary hover:text-primary/80 animated-underline"
              >
                View all projects
              </Link>
            </div>

            {isLoadingProjects ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[1, 2].map((i) => (
                  <Card key={i} className="border-slate-200">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl skeleton" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 skeleton rounded" />
                        <div className="h-3 w-24 skeleton rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : recentProjects.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {recentProjects.map((project, index) => {
                  const stepKey = (project.current_step ||
                    "DEFINE") as keyof typeof STEP_CONFIG;
                  const stepConfig = STEP_CONFIG[stepKey] || STEP_CONFIG.DEFINE;
                  const StepIcon = stepConfig.icon;
                  const progress = getProgress(stepKey);
                  const styles = getStepStyles(stepConfig.color);

                  return (
                    <motion.div
                      key={project.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.1,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                    >
                      <Link href={`${stepConfig.href}?project=${project.id}`}>
                        <Card className="group border-slate-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-5 flex items-center gap-4">
                            <div
                              className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                                styles.bg,
                                styles.bgHover
                              )}
                            >
                              <StepIcon
                                className={cn("w-5 h-5", styles.icon)}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-slate-900 truncate">
                                {project.name}
                              </h3>
                              <p className="text-sm text-slate-500">
                                Step {stepConfig.step}: {stepConfig.label}
                              </p>
                              <div className="h-1.5 mt-2.5 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div
                                  className={cn(
                                    "h-full rounded-full",
                                    styles.progress
                                  )}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${progress}%` }}
                                  transition={{
                                    duration: 0.6,
                                    delay: index * 0.1 + 0.2,
                                    ease: [0.16, 1, 0.3, 1],
                                  }}
                                />
                              </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-200" />
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <Card className="border-dashed border-slate-300">
                <CardContent className="p-10 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-slate-500 mb-4">
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

      {/* Features Grid */}
      <section className="relative py-20 bg-white">
        <div className="container mx-auto px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="secondary" className="mb-4">
              Research Pipeline
            </Badge>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Three Steps to Evidence Synthesis
            </h2>
            <p className="text-slate-600 max-w-lg mx-auto">
              A seamless workflow from question formulation to systematic
              screening
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Define */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Link href="/define" className="group block">
                <div className="feature-card group">
                  <div className="feature-card-icon">
                    <Brain className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Define
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    Turn vague ideas into structured research questions using
                    frameworks like PICO, SPIDER, and PEO.
                  </p>
                  <span className="inline-flex items-center text-blue-600 font-semibold group-hover:underline">
                    Open Define Tool
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Feature 2: Query */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href="/query" className="group block">
                <div className="feature-card group hover:border-teal-200 hover:shadow-teal-900/5">
                  <div className="feature-card-icon">
                    <Search className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Query
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    Generate complex Boolean search strings for PubMed with MeSH
                    term expansion and validation.
                  </p>
                  <span className="inline-flex items-center text-teal-600 font-semibold group-hover:underline">
                    Open Query Tool
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Feature 3: Review */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Link href="/review" className="group block">
                <div className="feature-card group hover:border-indigo-200 hover:shadow-indigo-900/5">
                  <div className="feature-card-icon">
                    <FileText className="w-6 h-6 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Review
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-6">
                    Screen thousands of abstracts efficiently. AI prioritizes
                    relevant studies based on your criteria.
                  </p>
                  <span className="inline-flex items-center text-indigo-600 font-semibold group-hover:underline">
                    Open Review Tool
                    <ArrowRight className="ml-1 w-4 h-4" />
                  </span>
                </div>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust/Footer Strip */}
      <section className="py-12 border-t border-slate-200 bg-slate-50">
        <div className="container mx-auto px-6 text-center">
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-slate-500">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              HIPAA Compliant
            </span>
            <span className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              PubMed Integrated
            </span>
            <span className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-600" />
              Gemini AI Powered
            </span>
          </div>
          <p className="mt-8 text-xs text-slate-400">
            © 2025 MedAI Hub. Built for researchers.
          </p>
        </div>
      </section>
    </div>
  );
}
