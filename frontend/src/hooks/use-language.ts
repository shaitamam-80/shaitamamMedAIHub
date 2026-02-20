'use client';

import { useState, useEffect } from 'react';

export type Language = 'en' | 'he';

/**
 * Reactive language hook that listens to the `languagechange` CustomEvent
 * dispatched by LanguageToggle. Initializes from <html lang="...">.
 */
export function useLanguage(): Language {
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    const htmlLang = document.documentElement.lang as Language;
    if (htmlLang === 'he' || htmlLang === 'en') setLang(htmlLang);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<Language>).detail;
      if (detail === 'he' || detail === 'en') setLang(detail);
    };
    window.addEventListener('languagechange', handler);
    return () => window.removeEventListener('languagechange', handler);
  }, []);

  return lang;
}
