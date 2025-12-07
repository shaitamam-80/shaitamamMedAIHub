import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary hover:bg-primary/20",
        primary:
          "border-transparent bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary/10 text-secondary hover:bg-secondary/20",
        success:
          "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
        warning:
          "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20",
        destructive:
          "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20",
        info:
          "border-sky-500/30 bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20",
        outline:
          "border-border text-foreground hover:bg-accent",
        muted:
          "border-transparent bg-muted text-muted-foreground hover:bg-muted/80",
        // Status badges for screening
        include:
          "border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-semibold",
        exclude:
          "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-300 font-semibold",
        maybe:
          "border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300 font-semibold",
        pending:
          "border-slate-500/30 bg-slate-500/15 text-slate-700 dark:text-slate-300 font-semibold",
      },
      size: {
        default: "px-2.5 py-1 text-xs",
        sm: "px-2 py-0.5 text-2xs",
        lg: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
