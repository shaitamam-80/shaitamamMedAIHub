'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function LanguageToggle() {
  const [language, setLanguage] = useState<'he' | 'en'>('he');

  const toggleLanguage = () => {
    const newLang = language === 'he' ? 'en' : 'he';
    setLanguage(newLang);
    // In production, update user preferences and reload with new locale
    console.log('Language changed to:', newLang);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="h-8 gap-1 px-3"
      title="החלף שפה"
    >
      <span
        className={cn(
          'text-xs font-medium transition-colors',
          language === 'he' ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        עב
      </span>
      <span className="text-muted-foreground">/</span>
      <span
        className={cn(
          'text-xs font-medium transition-colors',
          language === 'en' ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        EN
      </span>
    </Button>
  );
}
