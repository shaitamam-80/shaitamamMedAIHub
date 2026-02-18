'use client';

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type Language = 'he' | 'en';

/**
 * Applies language and direction to <html> and dispatches a custom event
 * so other components can react to the change.
 */
function applyLanguage(lang: Language) {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === 'he' ? 'rtl' : 'ltr';
  // Dispatch a custom event so sidebar / other components can react
  window.dispatchEvent(new CustomEvent('languagechange', { detail: lang }));
}

export default function LanguageToggle() {
  const [language, setLanguage] = useState<Language>('en');

  const toggleLanguage = useCallback(() => {
    const newLang: Language = language === 'he' ? 'en' : 'he';
    setLanguage(newLang);
    applyLanguage(newLang);
  }, [language]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="h-8 gap-1 px-3"
      title={language === 'en' ? 'Switch to Hebrew' : 'החלף לאנגלית'}
    >
      <span
        className={cn(
          'text-xs font-medium transition-colors',
          language === 'en' ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        EN
      </span>
      <span className="text-muted-foreground">/</span>
      <span
        className={cn(
          'text-xs font-medium transition-colors',
          language === 'he' ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        עב
      </span>
    </Button>
  );
}
