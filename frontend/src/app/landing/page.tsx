'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Sparkles,
  Search,
  FileText,
  BarChart3,
  Shield,
  ArrowRight,
  ChevronRight,
  Globe,
  Stethoscope,
  MessageSquareText,
  FileSearch,
  Lock,
  Zap,
} from 'lucide-react';
import LandingNav from './LandingNav';

/* ══════════════════════════════════════════════════════════
   Language System
   ══════════════════════════════════════════════════════════ */

type Lang = 'he' | 'en';

function detectLanguage(paramLang: string | null): Lang {
  // 1. URL param
  if (paramLang === 'he' || paramLang === 'en') return paramLang;
  // 2. localStorage
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('medai-lang');
    if (stored === 'he' || stored === 'en') return stored;
    // 3. Browser language
    if (navigator.language.startsWith('he')) return 'he';
  }
  // 4. Default
  return 'en';
}

/* ══════════════════════════════════════════════════════════
   Bilingual Content
   ══════════════════════════════════════════════════════════ */

const T = {
  badge: {
    en: 'Now supporting all academic disciplines',
    he: 'כעת תומך בכל הדיסציפלינות האקדמיות',
  },
  headline1: { en: 'AI-Powered', he: 'סקירות שיטתיות' },
  headline2: { en: 'Systematic Reviews', he: 'מונעות בינה מלאכותית' },
  sub: {
    en: 'From research idea to publication-ready manuscript. Search PubMed and OpenAlex with 13 specialized AI tools.',
    he: 'מרעיון מחקרי עד כתב יד מוכן לפרסום. חיפוש ב-PubMed ו-OpenAlex עם 13 כלי AI מתמחים.',
  },
  getStarted: { en: 'Start Free', he: 'התחילו בחינם' },
  learnMore: { en: 'Learn More', he: 'למידע נוסף' },
  signIn: { en: 'Sign In', he: 'התחברות' },

  // Tool cards
  tools: [
    {
      key: 'define',
      icon: MessageSquareText,
      title: { en: 'Research Question', he: 'שאלת מחקר' },
      desc: {
        en: 'AI chat that helps you formulate a structured research question with 20+ frameworks (PICO, CoCoPop, SPIDER, and more).',
        he: 'צ\'אט AI שמסייע לנסח שאלת מחקר מובנית עם 20+ מסגרות (PICO, CoCoPop, SPIDER ועוד).',
      },
    },
    {
      key: 'search',
      icon: Search,
      title: { en: 'Literature Search', he: 'חיפוש ספרות' },
      desc: {
        en: 'Build precise Boolean queries for PubMed (MeSH terms) or OpenAlex (all disciplines). 3 sensitivity strategies.',
        he: 'בניית שאילתות בוליאניות מדויקות ל-PubMed (מונחי MeSH) או OpenAlex (כל הדיסציפלינות).',
      },
    },
    {
      key: 'screen',
      icon: FileSearch,
      title: { en: 'Abstract Screening', he: 'סינון תקצירים' },
      desc: {
        en: 'Automated abstract screening with AI reasoning, Include/Exclude decisions, and manual override support.',
        he: 'סינון תקצירים אוטומטי עם נימוקי AI, החלטות Include/Exclude ואפשרות ביקורת ידנית.',
      },
    },
  ],
  moreTools: {
    en: '+ 10 more tools in the full pipeline',
    he: '+ 10 כלים נוספים ב-pipeline המלא',
  },
  startTool: { en: 'Start', he: 'התחל' },

  // Tool banner
  toolBanner: {
    looking: { en: 'Looking for:', he: 'מחפשים:' },
    cta: { en: 'Sign in free to start', he: 'התחברו בחינם כדי להתחיל' },
  },

  // Stats
  stats: [
    { value: '260M+', label: { en: 'Academic Works', he: 'עבודות אקדמיות' } },
    { value: '13', label: { en: 'AI Tools', he: 'כלי AI' } },
    { value: '10', label: { en: 'Pipeline Stages', he: 'שלבי Pipeline' } },
    { value: 'PRISMA', label: { en: '2020 Compliant', he: 'תואם 2020' } },
  ],

  // How it works
  howTitle: { en: 'How It Works', he: 'איך זה עובד' },
  howSub: {
    en: 'A complete pipeline from initial idea to publication.',
    he: 'Pipeline שלם מרעיון ראשוני ועד פרסום.',
  },
  howSteps: [
    { num: '01', title: { en: 'Define', he: 'הגדרה' }, desc: { en: 'Structure your research question', he: 'מבנה שאלת המחקר' }, icon: Sparkles },
    { num: '02', title: { en: 'Search', he: 'חיפוש' }, desc: { en: 'PubMed or OpenAlex queries', he: 'שאילתות PubMed או OpenAlex' }, icon: Search },
    { num: '03', title: { en: 'Screen', he: 'סינון' }, desc: { en: 'AI-powered abstract screening', he: 'סינון תקצירים עם AI' }, icon: FileText },
    { num: '04', title: { en: 'Synthesize', he: 'סינתזה' }, desc: { en: 'RoB, meta-analysis, GRADE, manuscript', he: 'RoB, מטה-אנליזה, GRADE, כתב יד' }, icon: BarChart3 },
  ],

  // CTA
  ctaTitle: { en: 'Ready to Accelerate Your Research?', he: 'מוכנים להאיץ את המחקר?' },
  ctaSub: {
    en: 'Join researchers producing higher-quality systematic reviews in less time.',
    he: 'הצטרפו לחוקרים שמפיקים סקירות שיטתיות איכותיות יותר בפחות זמן.',
  },
  startReview: { en: 'Start Your Review', he: 'התחילו סקירה' },

  // Footer
  footerDesc: {
    en: 'AI-powered systematic review platform for evidence-based research.',
    he: 'פלטפורמת סקירות שיטתיות מונעת AI למחקר מבוסס עדויות.',
  },
  footerSecure: { en: 'End-to-End Encrypted & Secure', he: 'מוצפן ומאובטח' },
};

/* ══════════════════════════════════════════════════════════
   Tool Aliases — map ?from= path to tool name
   ══════════════════════════════════════════════════════════ */

const TOOL_FROM_ALIASES: Record<string, { en: string; he: string }> = {
  '/define': { en: 'Research Question Formulation', he: 'ניסוח שאלת מחקר' },
  '/query': { en: 'Literature Search & Query Builder', he: 'חיפוש ספרות ובניית שאילתות' },
  '/review': { en: 'AI Abstract Screening', he: 'סינון תקצירים עם AI' },
};

/* ══════════════════════════════════════════════════════════
   Inner component (needs Suspense for useSearchParams)
   ══════════════════════════════════════════════════════════ */

function LandingInner() {
  const searchParams = useSearchParams();
  const [lang, setLang] = useState<Lang>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const detected = detectLanguage(searchParams.get('lang'));
    setLang(detected);
    localStorage.setItem('medai-lang', detected);
    setMounted(true);
  }, [searchParams]);

  const toggleLang = () => {
    const newLang: Lang = lang === 'he' ? 'en' : 'he';
    setLang(newLang);
    localStorage.setItem('medai-lang', newLang);
  };

  const isRtl = lang === 'he';
  const fromPath = searchParams.get('from');
  const toolBannerInfo = fromPath ? TOOL_FROM_ALIASES[fromPath] : null;

  const t = (obj: { en: string; he: string }) => obj[lang];

  /** Append ?next= to auth links so login/register can redirect back */
  const authHref = (base: string) =>
    fromPath ? `${base}?next=${encodeURIComponent(fromPath)}` : base;

  if (!mounted) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div
      className={`min-h-screen bg-background text-foreground ${isRtl ? 'font-heebo' : 'font-inter'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ═══ Navbar ═══ */}
      <LandingNav lang={lang} onToggleLang={toggleLang} fromPath={fromPath} />

      {/* ═══ Tool Banner (conditional) ═══ */}
      {toolBannerInfo && (
        <div className="bg-primary/5 border-b border-primary/10 px-6 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="size-4 text-primary flex-shrink-0" />
              <span className="text-muted-foreground">
                {t(T.toolBanner.looking)}{' '}
                <strong className="text-foreground">{t(toolBannerInfo)}</strong>
              </span>
            </div>
            <Link
              href={authHref('/login')}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
            >
              {t(T.toolBanner.cta)}
              <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      )}

      {/* ═══ Hero Section ═══ */}
      <section className="relative px-6 py-16 md:py-24 flex flex-col items-center text-center gap-8 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-cyan-500/[0.03] blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col items-center gap-5 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase">
            <Sparkles className="size-3.5" />
            {t(T.badge)}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-[1.08] tracking-tight">
            <span className="gradient-text">{t(T.headline1)}</span>
            <br />
            {t(T.headline2)}
          </h1>

          <p className="text-muted-foreground text-lg md:text-xl leading-relaxed max-w-xl">
            {t(T.sub)}
          </p>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground">
              <Stethoscope className="size-3" />
              PubMed &middot; 37M+
            </div>
            <span className="text-muted-foreground/30 text-sm">+</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground">
              <Globe className="size-3" />
              OpenAlex &middot; 260M+
            </div>
          </div>

          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-3 mt-2">
            <Link
              href={authHref('/login')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform"
            >
              {t(T.getStarted)}
              <ArrowRight className="size-5" />
            </Link>
            <Link
              href="#tools"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent border-2 border-primary/20 text-primary text-lg font-bold rounded-xl hover:bg-primary/5 transition-colors"
            >
              {t(T.learnMore)}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Tool Cards ═══ */}
      <section id="tools" className="px-6 py-16 max-w-5xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {T.tools.map((tool) => {
            const Icon = tool.icon;
            const isHighlighted =
              (fromPath === '/define' && tool.key === 'define') ||
              (fromPath === '/query' && tool.key === 'search') ||
              (fromPath === '/review' && tool.key === 'screen');

            return (
              <div
                key={tool.key}
                className={`flex flex-col gap-4 p-6 rounded-2xl border bg-card shadow-sm hover:shadow-md transition-all duration-300 ${
                  isHighlighted
                    ? 'border-primary/40 ring-2 ring-primary/20 shadow-md'
                    : 'border-border hover:border-primary/20'
                }`}
              >
                <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon className="size-6" />
                </div>
                <div className="flex flex-col gap-2 flex-1">
                  <h3 className="text-lg font-bold">{t(tool.title)}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {t(tool.desc)}
                  </p>
                </div>
                <Link
                  href={authHref('/login')}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 text-primary text-sm font-bold rounded-lg hover:bg-primary/20 transition-colors"
                >
                  {t(T.startTool)}
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {t(T.moreTools)}
        </p>
      </section>

      {/* ═══ Stats Bar ═══ */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 py-10 border-y border-border bg-card">
        {T.stats.map((stat) => (
          <div key={stat.value} className="flex flex-col items-center gap-1">
            <span className="text-3xl md:text-4xl font-bold text-primary">
              {stat.value}
            </span>
            <span className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
              {t(stat.label)}
            </span>
          </div>
        ))}
      </section>

      {/* ═══ How It Works (compact) ═══ */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <div className="flex flex-col gap-3 mb-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t(T.howTitle)}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {t(T.howSub)}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {T.howSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-card text-center"
              >
                <div className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-xs">
                  {step.num}
                </div>
                <Icon className="size-5 text-primary" />
                <h3 className="font-bold text-sm">{t(step.title)}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {t(step.desc)}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section className="px-6 py-16 bg-gradient-to-br from-primary/5 to-cyan-500/5 border-y border-border">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-6">
          <Zap className="size-8 text-primary" />
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            {t(T.ctaTitle)}
          </h2>
          <p className="text-muted-foreground">
            {t(T.ctaSub)}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href={authHref('/login')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground text-lg font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[0.98] transition-transform"
            >
              {t(T.startReview)}
              <ChevronRight className="size-5" />
            </Link>
            <Link
              href={authHref('/login')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-primary/20 text-primary font-bold rounded-xl hover:bg-primary/5 transition-colors"
            >
              {t(T.signIn)}
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="px-6 py-10 bg-foreground text-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-white font-bold text-sm">
                M
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight">MedAI Hub</span>
                <span className="text-xs opacity-50">{t(T.footerDesc)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs opacity-40">
              <Shield className="size-3" />
              <span>{t(T.footerSecure)}</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-background/10 text-center">
            <p className="text-xs opacity-40">
              &copy; {new Date().getFullYear()} MedAI Hub
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Page export — Suspense wrapper for useSearchParams
   ══════════════════════════════════════════════════════════ */

export default function LandingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LandingInner />
    </Suspense>
  );
}
