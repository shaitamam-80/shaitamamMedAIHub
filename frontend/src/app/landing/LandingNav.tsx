'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, LayoutDashboard } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LandingNav() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between bg-background/80 backdrop-blur-md px-6 py-4 border-b border-border">
      <div className="flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 via-blue-500 to-cyan-500 text-white font-bold text-sm shadow-md shadow-sky-500/20">
          M
        </div>
        <span className="text-xl font-bold tracking-tight gradient-text">
          MedAI Hub
        </span>
      </div>

      <div className="flex items-center gap-3">
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
            Dashboard
          </Link>
        ) : (
          /* Not logged in — show Login + Get Started */
          <>
            <Link
              href="/login"
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg shadow-md shadow-primary/20 hover:opacity-90 transition-opacity"
            >
              Get Started
              <ArrowRight className="size-4" />
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
