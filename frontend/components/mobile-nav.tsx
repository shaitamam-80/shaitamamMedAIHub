"use client";

import {
  ClipboardCheck,
  FolderOpen,
  Home,
  Lightbulb,
  Search,
} from "lucide-react";
import Link from "next/link";

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 border-t border-border bg-background/80 backdrop-blur-lg md:hidden z-50">
      <div className="flex h-full items-center justify-around px-2">
        <Link
          href="/"
          className="flex flex-col items-center justify-center gap-1 text-primary"
        >
          <Home className="h-6 w-6" style={{ fill: "currentColor" }} />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link
          href="/projects"
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <FolderOpen className="h-6 w-6" />
          <span className="text-[10px] font-medium">Projects</span>
        </Link>
        <Link
          href="/define"
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Lightbulb className="h-6 w-6" />
          <span className="text-[10px] font-medium">Define</span>
        </Link>
        <Link
          href="/query"
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="h-6 w-6" />
          <span className="text-[10px] font-medium">Query</span>
        </Link>
        <Link
          href="/review"
          className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ClipboardCheck className="h-6 w-6" />
          <span className="text-[10px] font-medium">Review</span>
        </Link>
      </div>
    </nav>
  );
}
