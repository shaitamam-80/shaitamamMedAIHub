'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LayoutDashboard, Languages } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Lang = 'he' | 'en';

interface LandingNavProps {
  lang: Lang;
  onToggleLang: () => void;
  fromPath?: string | null;
}

const NAV_T = {
  login:     { en: 'Sign In',     he: 'התחברות' },
  dashboard: { en: 'Dashboard',   he: 'לוח בקרה' },
};

export default function LandingNav({ lang, onToggleLang, fromPath }: LandingNavProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  const t = (obj: { en: string; he: string }) => obj[lang];

  /** Append ?next= to auth links so login/register can redirect back */
  const authHref = (base: string) =>
    fromPath ? `${base}?next=${encodeURIComponent(fromPath)}` : base;

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-background/80 backdrop-blur-md px-6 py-4 border-b border-border">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-500 text-white font-bold text-sm shadow-md shadow-sky-500/20">
          M
        </div>
        <span className="text-xl font-bold tracking-tight gradient-text">
          MedAI Hub
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Language toggle */}
        <button
          onClick={onToggleLang}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
          aria-label="Toggle language"
        >
          <Languages className="size-3.5" />
          {lang === 'en' ? 'עב' : 'EN'}
        </button>

        {isLoggedIn === null ? (
          /* Loading — show nothing to avoid flash */
          <div className="w-24" />
        ) : isLoggedIn ? (
          /* Logged in — show Dashboard button */
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
          >
            <LayoutDashboard className="size-4" />
            {t(NAV_T.dashboard)}
          </Link>
        ) : (
          /* Not logged in — show Sign In */
          <Link
            href={authHref('/login')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
          >
            {t(NAV_T.login)}
            <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
    </nav>
  );
}
