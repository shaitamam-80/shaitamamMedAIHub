"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Award,
  BookOpen,
  Brain,
  Briefcase,
  Calendar,
  Code2,
  ExternalLink,
  FileText,
  Github,
  GraduationCap,
  Heart,
  Linkedin,
  Mail,
  MapPin,
  Microscope,
  Rocket,
  Stethoscope,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/90 via-primary to-primary/80 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative px-4 py-20 md:py-28">
          <div className="mx-auto max-w-4xl text-center">
            {/* Avatar */}
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <div className="h-32 w-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-5xl font-bold border-4 border-white/30 shadow-2xl">
                  ST
                </div>
                <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-green-500 border-4 border-white flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
              </div>
            </div>

            {/* Name & Title */}
            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl font-display">
              Shai Tamam
            </h1>
            <p className="mb-6 text-xl text-primary-foreground/90 md:text-2xl font-medium">
              Medical Information Specialist | AI Analyst | Researcher
            </p>

            {/* Contact Links */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="https://www.linkedin.com/in/shai-tamam"
                target="_blank"
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Link>
              <Link
                href="https://github.com/shaitamam"
                target="_blank"
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <Github className="h-4 w-4" />
                GitHub
              </Link>
              <Link
                href="mailto:shai@shaitamam.com"
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all hover:bg-white/20"
              >
                <Mail className="h-4 w-4" />
                Contact
              </Link>
              <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm backdrop-blur-sm">
                <MapPin className="h-4 w-4" />
                Israel
              </div>
            </div>
          </div>
        </div>
        {/* Wave Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </section>

      {/* About Me Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold font-display mb-4">About Me</h2>
            <Separator className="mx-auto w-24" />
          </div>
          <div className="prose prose-lg dark:prose-invert mx-auto">
            <p className="text-lg text-muted-foreground leading-relaxed text-center">
              I am a Medical Information Specialist and AI Analyst with over 15 years of experience
              bridging the gap between healthcare and technology. My unique combination of clinical
              background as a Paramedic, academic training in Health Administration and Information
              Science, and hands-on experience with AI systems positions me at the forefront of
              medical informatics innovation.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed text-center mt-4">
              Passionate about leveraging artificial intelligence to improve healthcare outcomes,
              streamline medical research, and enhance evidence-based decision making. Currently
              focused on developing AI-powered tools for systematic literature reviews and
              medical information retrieval.
            </p>
          </div>
        </div>
      </section>

      {/* Education Section */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4 flex items-center justify-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              Education
            </h2>
            <Separator className="mx-auto w-24" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* MHA */}
            <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">M.H.A - Health Administration</CardTitle>
                    <CardDescription className="mt-1">Ben-Gurion University of the Negev</CardDescription>
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    2019-2021
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Focus on healthcare management, policy analysis, and organizational leadership
                  in medical institutions.
                </p>
              </CardContent>
            </Card>

            {/* MA Information Science */}
            <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">M.A - Information Science</CardTitle>
                    <CardDescription className="mt-1">Bar-Ilan University</CardDescription>
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    2016-2018
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Specialized in medical informatics, information retrieval systems, and
                  database management for healthcare applications.
                </p>
              </CardContent>
            </Card>

            {/* BA Political Science */}
            <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">B.A - Political Science</CardTitle>
                    <CardDescription className="mt-1">Bar-Ilan University</CardDescription>
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    2012-2015
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Studies in public policy, governance, and social systems that inform
                  healthcare policy understanding.
                </p>
              </CardContent>
            </Card>

            {/* Paramedic */}
            <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">Certified Paramedic</CardTitle>
                    <CardDescription className="mt-1">Magen David Adom</CardDescription>
                  </div>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    2007
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Emergency medical services certification providing hands-on clinical
                  experience and patient care expertise.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Key Achievements Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4 flex items-center justify-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              Key Achievements
            </h2>
            <Separator className="mx-auto w-24" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-3xl font-bold text-primary mb-2">4+</h3>
              <p className="text-sm text-muted-foreground">PubMed Publications</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                <Rocket className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-3xl font-bold text-primary mb-2">MedAI</h3>
              <p className="text-sm text-muted-foreground">Hub Platform Creator</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                <Briefcase className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-3xl font-bold text-primary mb-2">15+</h3>
              <p className="text-sm text-muted-foreground">Years Experience</p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 mb-4">
                <Stethoscope className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="text-3xl font-bold text-primary mb-2">SCOUT</h3>
              <p className="text-sm text-muted-foreground">GEMS Platform</p>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Journey Timeline */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4 flex items-center justify-center gap-3">
              <TrendingUp className="h-8 w-8 text-primary" />
              Professional Journey
            </h2>
            <Separator className="mx-auto w-24" />
          </div>

          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border md:-translate-x-1/2" />

            {/* Timeline Items */}
            <div className="space-y-12">
              {/* 2023-Present */}
              <div className="relative flex flex-col md:flex-row md:items-center">
                <div className="ml-12 md:ml-0 md:w-1/2 md:pr-12 md:text-right">
                  <Card className="inline-block text-left">
                    <CardHeader className="pb-2">
                      <span className="text-sm font-medium text-primary">2023 - Present</span>
                      <CardTitle className="text-lg">Medical Information Specialist & AI Analyst</CardTitle>
                      <CardDescription>Leading Healthcare Organization</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• AI-powered medical information retrieval systems</li>
                        <li>• Systematic review methodology development</li>
                        <li>• Cross-functional team leadership</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                <div className="absolute left-4 md:left-1/2 h-4 w-4 rounded-full bg-primary border-4 border-background md:-translate-x-1/2" />
              </div>

              {/* 2019-2023 */}
              <div className="relative flex flex-col md:flex-row md:items-center">
                <div className="hidden md:block md:w-1/2" />
                <div className="ml-12 md:ml-0 md:w-1/2 md:pl-12">
                  <Card className="inline-block text-left">
                    <CardHeader className="pb-2">
                      <span className="text-sm font-medium text-primary">2019 - 2023</span>
                      <CardTitle className="text-lg">Senior Medical Information Specialist</CardTitle>
                      <CardDescription>Healthcare Technology Company</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Medical database management</li>
                        <li>• Clinical decision support systems</li>
                        <li>• Evidence-based practice implementation</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                <div className="absolute left-4 md:left-1/2 h-4 w-4 rounded-full bg-primary border-4 border-background md:-translate-x-1/2" />
              </div>

              {/* 2015-2019 */}
              <div className="relative flex flex-col md:flex-row md:items-center">
                <div className="ml-12 md:ml-0 md:w-1/2 md:pr-12 md:text-right">
                  <Card className="inline-block text-left">
                    <CardHeader className="pb-2">
                      <span className="text-sm font-medium text-primary">2015 - 2019</span>
                      <CardTitle className="text-lg">Medical Information Analyst</CardTitle>
                      <CardDescription>Research Institution</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Literature search and analysis</li>
                        <li>• Research data management</li>
                        <li>• Publication support</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                <div className="absolute left-4 md:left-1/2 h-4 w-4 rounded-full bg-primary border-4 border-background md:-translate-x-1/2" />
              </div>

              {/* 2007-2015 */}
              <div className="relative flex flex-col md:flex-row md:items-center">
                <div className="hidden md:block md:w-1/2" />
                <div className="ml-12 md:ml-0 md:w-1/2 md:pl-12">
                  <Card className="inline-block text-left">
                    <CardHeader className="pb-2">
                      <span className="text-sm font-medium text-primary">2007 - 2015</span>
                      <CardTitle className="text-lg">Paramedic</CardTitle>
                      <CardDescription>Magen David Adom</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Emergency medical services</li>
                        <li>• Patient care and assessment</li>
                        <li>• Crisis management</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                <div className="absolute left-4 md:left-1/2 h-4 w-4 rounded-full bg-primary border-4 border-background md:-translate-x-1/2" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4 flex items-center justify-center gap-3">
              <Target className="h-8 w-8 text-primary" />
              Skills & Expertise
            </h2>
            <Separator className="mx-auto w-24" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Medical & Research */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Microscope className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <CardTitle className="text-lg">Medical & Research</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Systematic Reviews",
                    "PubMed/MEDLINE",
                    "Evidence Synthesis",
                    "Clinical Research",
                    "Medical Terminology",
                    "PICO Framework",
                    "Meta-Analysis",
                    "Health Policy",
                  ].map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Technology & AI */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-lg">Technology & AI</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    "AI/ML Applications",
                    "Python",
                    "LangChain",
                    "Next.js",
                    "FastAPI",
                    "Database Design",
                    "NLP",
                    "Prompt Engineering",
                  ].map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-purple-100 dark:bg-purple-900/30 px-3 py-1 text-xs font-medium text-purple-700 dark:text-purple-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Management & Strategy */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                    <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-lg">Management & Strategy</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Project Management",
                    "Team Leadership",
                    "Strategic Planning",
                    "Process Optimization",
                    "Stakeholder Management",
                    "Training & Mentoring",
                    "Quality Assurance",
                    "Change Management",
                  ].map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-green-100 dark:bg-green-900/30 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-300"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Current Projects Section */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4 flex items-center justify-center gap-3">
              <Rocket className="h-8 w-8 text-primary" />
              Current Projects
            </h2>
            <Separator className="mx-auto w-24" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* MedAI Hub */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-800 hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">MedAI Hub</CardTitle>
                    <CardDescription>AI-Powered Systematic Review Platform</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  A comprehensive platform that streamlines the systematic literature review process
                  using AI to help researchers formulate questions, build PubMed queries, and screen
                  abstracts efficiently.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-blue-200/50 dark:bg-blue-800/50 px-2 py-1 text-xs font-medium">Next.js</span>
                  <span className="rounded-full bg-blue-200/50 dark:bg-blue-800/50 px-2 py-1 text-xs font-medium">FastAPI</span>
                  <span className="rounded-full bg-blue-200/50 dark:bg-blue-800/50 px-2 py-1 text-xs font-medium">Gemini AI</span>
                  <span className="rounded-full bg-blue-200/50 dark:bg-blue-800/50 px-2 py-1 text-xs font-medium">Supabase</span>
                </div>
                <div className="flex gap-3">
                  <Link href="/">
                    <Button size="sm" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Visit Platform
                    </Button>
                  </Link>
                  <Link href="https://github.com/shaitamam/MedAIHub" target="_blank">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Github className="h-4 w-4" />
                      Source Code
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* SCOUT/GEMS */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/50 dark:to-purple-900/30 border-purple-200 dark:border-purple-800 hover:shadow-xl transition-all">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white">
                    <Code2 className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">SCOUT / GEMS</CardTitle>
                    <CardDescription>Medical Research Tools</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Specialized tools for medical research and evidence synthesis, designed to improve
                  efficiency and accuracy in clinical decision-making and research workflows.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-purple-200/50 dark:bg-purple-800/50 px-2 py-1 text-xs font-medium">Research Tools</span>
                  <span className="rounded-full bg-purple-200/50 dark:bg-purple-800/50 px-2 py-1 text-xs font-medium">Evidence Synthesis</span>
                  <span className="rounded-full bg-purple-200/50 dark:bg-purple-800/50 px-2 py-1 text-xs font-medium">Clinical Support</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Publications Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-display mb-4 flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              Publications
            </h2>
            <Separator className="mx-auto w-24" />
          </div>

          <Card className="text-center p-8">
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                View my peer-reviewed publications on PubMed, covering topics in medical informatics,
                healthcare technology, and clinical research methodology.
              </p>
              <Link
                href="https://pubmed.ncbi.nlm.nih.gov/?term=Tamam+S%5BAuthor%5D"
                target="_blank"
              >
                <Button className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  View on PubMed
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardContent className="text-center py-12 px-8">
              <h2 className="text-3xl font-bold font-display mb-4">Let&apos;s Collaborate</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Interested in medical informatics, AI in healthcare, or systematic review methodology?
                I&apos;m always open to discussing new projects, research collaborations, or consulting opportunities.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link href="mailto:shai@shaitamam.com">
                  <Button size="lg" className="gap-2">
                    <Mail className="h-5 w-5" />
                    Get in Touch
                  </Button>
                </Link>
                <Link href="https://www.linkedin.com/in/shai-tamam" target="_blank">
                  <Button variant="outline" size="lg" className="gap-2">
                    <Linkedin className="h-5 w-5" />
                    Connect on LinkedIn
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
