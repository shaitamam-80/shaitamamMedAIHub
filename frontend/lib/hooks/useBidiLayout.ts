import { useMemo } from 'react';

export function useBidiLayout(language: 'en' | 'he' | null) {
  return useMemo(() => ({
    dir: language === 'he' ? 'rtl' : 'ltr',
    isRTL: language === 'he',
    textAlign: language === 'he' ? 'right' : 'left',
    flexDirection: language === 'he' ? 'row-reverse' : 'row',
  }), [language]);
}
