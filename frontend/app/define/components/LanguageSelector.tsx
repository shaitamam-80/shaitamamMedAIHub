'use client';

import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

interface LanguageSelectorProps {
  onSelect: (language: 'en' | 'he') => void;
}

export function LanguageSelector({ onSelect }: LanguageSelectorProps) {
  return (
    <div className="w-full flex justify-center py-8 md:py-16">
      <div className="rounded-xl bg-card border border-border p-6 md:p-8 shadow-lg max-w-md w-full">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
        <h3 className="text-xl font-bold mb-2 text-center">
          Welcome to MedAI Hub
        </h3>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          I'll help you formulate your research question and extract
          the key components.
        </p>
        <p className="text-sm font-medium mb-4 text-center">
          Choose your preferred language:
        </p>
        <div className="grid grid-cols-2 gap-4">
          <Button
            variant="outline"
            onClick={() => onSelect('he')}
            className="h-auto py-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5"
          >
            <span className="text-2xl">🇮🇱</span>
            <span className="font-medium">עברית</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => onSelect('en')}
            className="h-auto py-4 flex flex-col gap-1 hover:border-primary hover:bg-primary/5"
          >
            <span className="text-2xl">🇺🇸</span>
            <span className="font-medium">English</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
