'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Keyboard } from 'lucide-react';

interface Shortcut {
  key: string;
  action: string;
}

const shortcuts: Shortcut[] = [
  { key: 'Ctrl/Cmd + Enter', action: 'Send message in chat' },
  { key: 'Escape', action: 'Close dialog' },
  { key: '?', action: 'Show keyboard shortcuts' },
];

export function KeyboardShortcutsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Keyboard shortcuts">
          <Keyboard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          {shortcuts.map(({ key, action }) => (
            <div key={key} className="flex justify-between items-center gap-4">
              <kbd className="px-2 py-1 bg-muted rounded text-sm font-mono">
                {key}
              </kbd>
              <span className="text-muted-foreground text-sm flex-1">
                {action}
              </span>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
