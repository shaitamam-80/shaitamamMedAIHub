'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

export default function LanguageToggle() {
  const [language, setLanguage] = useState<'he' | 'en'>('he');

  const toggleLanguage = () => {
    const newLang = language === 'he' ? 'en' : 'he';
    setLanguage(newLang);
    // In production, update user preferences and reload with new locale
    console.log('Language changed to:', newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-1 px-3 py-1.5 bg-[#0a0e1a] border border-[#1e293b] rounded-lg hover:border-blue-500/50 transition-all"
      title="החלף שפה"
    >
      <span
        className={cn(
          'text-xs font-medium transition-colors',
          language === 'he' ? 'text-blue-500' : 'text-[#64748b]'
        )}
      >
        עב
      </span>
      <span className="text-[#64748b]">/</span>
      <span
        className={cn(
          'text-xs font-medium transition-colors',
          language === 'en' ? 'text-blue-500' : 'text-[#64748b]'
        )}
      >
        EN
      </span>
    </button>
  );
}
