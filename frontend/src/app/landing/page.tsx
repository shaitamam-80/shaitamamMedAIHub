import Link from 'next/link';
import {
  Sparkles,
  Brain,
  Search,
  FileText,
  BarChart3,
  Shield,
  ArrowRight,
  CheckCircle2,
  Star,
  Zap,
  ChevronRight,
  GraduationCap,
  Award,
  BookOpen,
  Briefcase,
  ExternalLink,
  Linkedin,
} from 'lucide-react';
import LandingNav from './LandingNav';

export const metadata = {
  title: 'MedAI Hub — AI-Powered Systematic Reviews',
  description:
    'Accelerate your systematic reviews with AI. From research question to publication-ready manuscript, MedAI Hub guides every step.',
};

/* ── Pipeline steps shown in "How It Works" ── */
const PIPELINE_STEPS = [
  { icon: Sparkles, label: 'Research Idea', step: 1 },
  { icon: Search, label: 'PubMed Search', step: 2 },
  { icon: FileText, label: 'Screening', step: 3 },
  { icon: BarChart3, label: 'Synthesis', step: 4 },
  { icon: Star, label: 'GRADE', step: 5 },
  { icon: FileText, label: 'Manuscript', step: 6 },
];

/* ── Feature cards ── */
const FEATURES = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    description:
      'Extract insights automatically from thousands of papers using advanced language models trained on scientific literature.',
  },
  {
    icon: Search,
    title: 'Smart PubMed Search',
    description:
      'Build precise search queries with MeSH terms, field tags, and sensitivity/specificity strategies — validated in real time.',
  },
  {
    icon: Shield,
    title: 'Risk of Bias Assessment',
    description:
      'Automated RoB assessment with RoB 2.0, ROBINS-I, NOS, JBI, QUADAS-2. Includes traffic light plots and summary tables.',
  },
  {
    icon: BarChart3,
    title: 'Meta-Analysis & Synthesis',
    description:
      'Quantitative meta-analysis with Forest plots, heterogeneity testing, subgroup analysis, and publication bias detection.',
  },
  {
    icon: Star,
    title: 'GRADE Certainty',
    description:
      'Full GRADE assessment across all 5 downgrade and 3 upgrade domains. Summary of Findings tables and plain-language statements.',
  },
  {
    icon: FileText,
    title: 'Manuscript Writer',
    description:
      'Generate PRISMA 2020 compliant manuscripts with all sections, checklists, cover letters, and PRISMA Flow diagrams.',
  },
];

/* ── Stats ── */
const STATS = [
  { value: '13', label: 'Specialized Tools' },
  { value: '10', label: 'Pipeline Stages' },
  { value: '6+', label: 'RoB Instruments' },
  { value: 'PRISMA', label: '2020 Compliant' },
];

/* ── Creator publications ── */
const PUBLICATIONS = [
  {
    doi: '10.3389/fendo.2023.1135768',
    title:
      'GH treatment in pediatric Down syndrome: a systematic review and mini meta-analysis',
    journal: 'Front Endocrinol',
    year: '2023',
  },
  {
    doi: '10.3389/fped.2023.1132296',
    title:
      'GHRH-GH-IGF1 axis in pediatric Down syndrome: a systematic review and mini meta-analysis',
    journal: 'Front Pediatr',
    year: '2023',
  },
  {
    doi: '10.1002/ijgo.14290',
    title:
      'The association between overactive bladder and fibromyalgia: a systematic review and meta-analysis',
    journal: 'Int J Gynaecol Obstet',
    year: '2022',
  },
  {
    doi: '10.1002/ijgo.13769',
    title:
      'A systematic review of stem cell therapy treatment for women suffering from stress urinary incontinence',
    journal: 'Int J Gynaecol Obstet',
    year: '2021',
  },
];

/* ── Creator achievement stats ── */
const CREATOR_STATS = [
  { icon: Award, value: '10+', label: 'Years in Evidence-Based Medicine' },
  { icon: BookOpen, value: '4', label: 'Peer-Reviewed Publications' },
  { icon: GraduationCap, value: '3', label: 'Academic Degrees' },
  { icon: Briefcase, value: 'Founder', label: 'SR Service at BGU' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ═══ Navbar ═══ */}
      <LandingNav />

      {/* ═══ Hero Section ═══ */}
      <section className="relative px-6 py-20 md:py-28 flex flex-col items-center text-center gap-8 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.03] blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-6 max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase">
            <Sparkles className="size-3.5" />
            The Future of Research
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.12] tracking-tight">
            Systematic Reviews,{' '}
            <br className="hidden sm:block" />
            <span className="gradient-text italic">Powered by AI</span>
          </h1>

          {/* Sub-headline */}
          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-lg">
            From research idea to publication-ready manuscript. 13 specialized
            tools guide every stage of your systematic review.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 mt-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform"
            >
              Get Started Free
              <ArrowRight className="size-5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-primary/20 text-primary text-lg font-bold rounded-xl hover:bg-primary/5 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Browser Mockup */}
        <div className="relative z-10 w-full max-w-4xl mt-12">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-border bg-card">
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-400/60" />
                <div className="size-3 rounded-full bg-yellow-400/60" />
                <div className="size-3 rounded-full bg-green-400/60" />
              </div>
              <div className="flex-1 flex justify-center">
                <div className="px-4 py-1 bg-background rounded-md text-xs text-muted-foreground border border-border">
                  app.medaihub.com
                </div>
              </div>
            </div>
            {/* Content preview */}
            <div className="p-8 md:p-12 bg-gradient-to-br from-primary/[0.03] to-cyan-500/[0.02]">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {PIPELINE_STEPS.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div
                      key={step.step}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className="flex size-12 md:size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-6" />
                      </div>
                      <span className="text-[10px] md:text-xs text-muted-foreground font-medium text-center leading-tight">
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-8 flex items-center justify-center">
                <div className="h-2 w-full max-w-md rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-cyan-500"
                    style={{ width: '65%' }}
                  />
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-2">
                Pipeline Progress
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Stats Bar ═══ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-10 border-y border-border bg-card">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1">
            <span className="text-3xl md:text-4xl font-bold text-primary">
              {stat.value}
            </span>
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
              {stat.label}
            </span>
          </div>
        ))}
      </section>

      {/* ═══ Features ═══ */}
      <section id="features" className="px-6 py-20 max-w-6xl mx-auto">
        <div className="flex flex-col gap-3 mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Everything You Need
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            13 specialized tools designed for modern academic excellence and
            rigorous scientific standards.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex flex-col gap-4 p-6 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-300 card-glow"
              >
                <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="size-6" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="px-6 py-20 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-3 mb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              A complete pipeline from initial idea to publication-ready manuscript.
            </p>
          </div>

          <div className="flex flex-col gap-0">
            {[
              {
                step: '01',
                title: 'Define Your Research Question',
                desc: 'Start with your idea. Our AI helps you structure it using PICO, CoCoPop, PFO, or other frameworks.',
                icon: Sparkles,
              },
              {
                step: '02',
                title: 'Build & Run Your Search',
                desc: 'Generate precise PubMed queries with MeSH terms and boolean operators. Validate in real time.',
                icon: Search,
              },
              {
                step: '03',
                title: 'Screen & Extract Data',
                desc: 'AI-powered abstract screening against your criteria. Structured data extraction with missing statistics calculation.',
                icon: FileText,
              },
              {
                step: '04',
                title: 'Assess & Synthesize',
                desc: 'Risk of bias assessment, meta-analysis with Forest plots, GRADE certainty evaluation, and manuscript generation.',
                icon: BarChart3,
              },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={item.step} className="flex gap-6 relative">
                  {/* Timeline line */}
                  {index < 3 && (
                    <div className="absolute left-[23px] top-14 bottom-0 w-px bg-border" />
                  )}
                  {/* Step number circle */}
                  <div className="flex-shrink-0 flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm z-10">
                    {item.step}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-12">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="size-4 text-primary" />
                      <h3 className="text-lg font-bold">{item.title}</h3>
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ Social Proof / Trust ═══ */}
      <section className="px-6 py-20 max-w-4xl mx-auto text-center">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="size-5 text-yellow-500 fill-yellow-500"
              />
            ))}
          </div>
          <blockquote className="text-xl md:text-2xl font-medium leading-relaxed text-foreground max-w-2xl italic">
            &ldquo;MedAI Hub transformed our review process. What used to take
            months now takes weeks, with better methodological rigor.&rdquo;
          </blockquote>
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" />
              <span className="font-semibold text-sm">Research Team</span>
            </div>
            <span className="text-xs text-muted-foreground">
              Clinical Pharmacology Department
            </span>
          </div>
        </div>
      </section>

      {/* ═══ About the Creator ═══ */}
      <section id="creator" className="px-6 py-20 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="flex flex-col gap-3 mb-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mx-auto">
              <GraduationCap className="size-3.5" />
              Built by a Domain Expert
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Meet the Creator
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              MedAI Hub was designed by a systematic reviews expert with over a
              decade of experience guiding clinical research teams.
            </p>
          </div>

          {/* Profile area */}
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-center md:items-start">
            {/* Left column: Avatar + social links */}
            <div className="shrink-0 flex flex-col items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 rounded-full bg-linear-to-br from-sky-500 via-blue-500 to-cyan-500 opacity-20 blur-sm" />
                <div className="relative size-32 md:size-40 rounded-full overflow-hidden border-2 border-primary/20 bg-muted">
                  <div className="flex items-center justify-center size-full bg-linear-to-br from-primary/10 to-cyan-500/10 text-primary text-3xl md:text-4xl font-bold">
                    ST
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.linkedin.com/in/shai-tamam/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-primary/5 hover:border-primary/20 transition-colors"
                >
                  <Linkedin className="size-3.5" />
                  LinkedIn
                </a>
                <a
                  href="https://pubmed.ncbi.nlm.nih.gov/?term=Tamam+S%5BAuthor%5D"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-border hover:bg-primary/5 hover:border-primary/20 transition-colors"
                >
                  <BookOpen className="size-3.5" />
                  PubMed
                </a>
              </div>
            </div>

            {/* Right column: Bio + achievements */}
            <div className="flex-1 flex flex-col gap-6 text-center md:text-left">
              <div>
                <h3 className="text-2xl font-bold">Shai Tamam</h3>
                <p className="text-primary font-medium text-sm mt-1">
                  Senior Information Specialist &amp; Systematic Reviews Expert
                </p>
              </div>

              <p className="text-muted-foreground text-sm leading-relaxed">
                With over a decade in evidence-based medicine, Shai has served as
                the methodological backbone of systematic reviews across clinical
                disciplines. From establishing a dedicated SR service at
                Ben-Gurion University to leading information specialist training
                at Tel Aviv University, his career has been defined by one
                mission: making rigorous research methodology accessible. MedAI
                Hub is the culmination of that experience &mdash; every tool
                reflects real workflows refined across dozens of published
                reviews.
              </p>

              {/* Achievement stats */}
              <div className="grid grid-cols-2 gap-4">
                {CREATOR_STATS.map((stat) => {
                  const Icon = stat.icon;
                  return (
                    <div
                      key={stat.label}
                      className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border"
                    >
                      <div className="shrink-0 size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Icon className="size-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">
                          {stat.value}
                        </span>
                        <span className="text-xs text-muted-foreground leading-tight">
                          {stat.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Publications */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="flex items-center gap-2 mb-6">
              <FileText className="size-4 text-primary" />
              <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Selected Publications
              </h4>
            </div>
            <div className="grid gap-3">
              {PUBLICATIONS.map((pub) => (
                <a
                  key={pub.doi}
                  href={`https://doi.org/${pub.doi}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-4 rounded-xl border border-border bg-background hover:border-primary/20 hover:shadow-sm transition-all duration-300"
                >
                  <div className="shrink-0 mt-0.5">
                    <BookOpen className="size-4 text-primary/60 group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {pub.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pub.journal} ({pub.year})
                    </p>
                  </div>
                  <ExternalLink className="size-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0 mt-1 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section className="px-6 py-20 bg-gradient-to-br from-primary/5 to-cyan-500/5 border-y border-border">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <Zap className="size-8 text-primary" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Ready to Accelerate Your Research?
          </h2>
          <p className="text-muted-foreground">
            Join researchers who are using AI to produce higher quality
            systematic reviews in less time.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform"
            >
              Start Your Review
              <ChevronRight className="size-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-primary/20 text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="px-6 py-12 bg-foreground text-background">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            {/* Brand */}
            <div className="flex flex-col gap-3 max-w-xs">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
                  M
                </div>
                <span className="text-lg font-bold tracking-tight">
                  MedAI Hub
                </span>
              </div>
              <p className="text-sm opacity-60">
                AI-powered systematic review platform for evidence-based
                research.
              </p>
            </div>

            {/* Links */}
            <div className="grid grid-cols-2 gap-8 text-sm">
              <div className="flex flex-col gap-3">
                <h4 className="font-bold">Platform</h4>
                <Link href="#features" className="opacity-60 hover:opacity-100 transition-opacity">
                  Features
                </Link>
                <Link href="/register" className="opacity-60 hover:opacity-100 transition-opacity">
                  Get Started
                </Link>
                <Link href="/login" className="opacity-60 hover:opacity-100 transition-opacity">
                  Sign In
                </Link>
              </div>
              <div className="flex flex-col gap-3">
                <h4 className="font-bold">Tools</h4>
                <span className="opacity-60">Research Question</span>
                <span className="opacity-60">PubMed Search</span>
                <span className="opacity-60">Meta-Analysis</span>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t border-background/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs opacity-40">
              &copy; {new Date().getFullYear()} MedAI Hub. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-xs opacity-40">
              <Shield className="size-3" />
              <span>End-to-End Encrypted & Secure</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
