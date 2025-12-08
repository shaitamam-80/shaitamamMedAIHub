import { Check, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ProcessStepper - A reusable step indicator component
 *
 * Design System: Clinical Modern
 * Used in: Query Builder, Screening Wizard, Project Creation
 *
 * Features:
 * - Animated progress line
 * - Completed/current/upcoming states
 * - Optional icons per step
 * - Clickable navigation (optional)
 */

export interface Step {
  /** Unique step identifier (1-based) */
  id: number;
  /** Step label text */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional icon (shown when step is current) */
  icon?: LucideIcon;
}

interface ProcessStepperProps {
  /** Array of steps to display */
  steps: Step[];
  /** Current active step (1-based) */
  currentStep: number;
  /** Additional CSS classes */
  className?: string;
  /** Callback when a step is clicked (enables navigation) */
  onStepClick?: (stepId: number) => void;
  /** Only allow clicking completed or current steps */
  restrictNavigation?: boolean;
  /** Size variant */
  size?: "sm" | "md";
}

const sizeConfig = {
  sm: {
    circle: "h-6 w-6",
    icon: "h-3 w-3",
    text: "text-[10px]",
    spacing: "mt-1.5",
  },
  md: {
    circle: "h-8 w-8",
    icon: "h-4 w-4",
    text: "text-xs",
    spacing: "mt-2",
  },
};

export function ProcessStepper({
  steps,
  currentStep,
  className,
  onStepClick,
  restrictNavigation = true,
  size = "md",
}: ProcessStepperProps) {
  const config = sizeConfig[size];

  // Calculate progress percentage for the connecting line
  const progressWidth =
    steps.length > 1
      ? ((currentStep - 1) / (steps.length - 1)) * 100
      : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex justify-between">
        {/* Background Line */}
        <div
          className="absolute top-4 left-0 w-full h-0.5 bg-muted -z-10"
          aria-hidden="true"
        />

        {/* Progress Line (animated) */}
        <div
          className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500 ease-out -z-10"
          style={{ width: `${progressWidth}%` }}
          aria-hidden="true"
        />

        {/* Steps */}
        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isUpcoming = currentStep < step.id;

          const isClickable =
            onStepClick &&
            (!restrictNavigation || isCompleted || isCurrent);

          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className={cn(
                "flex flex-col items-center bg-background px-2",
                isClickable && "cursor-pointer"
              )}
              onClick={() => isClickable && onStepClick(step.id)}
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              onKeyDown={(e) => {
                if (isClickable && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onStepClick(step.id);
                }
              }}
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Step Circle */}
              <div
                className={cn(
                  "flex items-center justify-center rounded-full border-2",
                  "transition-all duration-300",
                  config.circle,
                  // Completed state
                  isCompleted && "bg-primary border-primary text-primary-foreground",
                  // Current state - with glow effect
                  isCurrent &&
                    "border-primary text-primary bg-background shadow-[0_0_0_4px_rgba(37,99,235,0.1)]",
                  // Upcoming state
                  isUpcoming &&
                    "border-muted-foreground/30 text-muted-foreground bg-background",
                  // Hover state for clickable
                  isClickable &&
                    !isCompleted &&
                    !isCurrent &&
                    "hover:border-primary/50 hover:text-primary"
                )}
              >
                {isCompleted ? (
                  <Check className={config.icon} />
                ) : isCurrent && StepIcon ? (
                  <StepIcon className={config.icon} />
                ) : (
                  <span className="text-sm font-bold">{step.id}</span>
                )}
              </div>

              {/* Step Label */}
              <span
                className={cn(
                  "font-medium uppercase tracking-wider transition-colors duration-300",
                  config.text,
                  config.spacing,
                  isCurrent && "text-primary",
                  isCompleted && "text-foreground",
                  isUpcoming && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>

              {/* Optional Description */}
              {step.description && (
                <span
                  className={cn(
                    "text-[10px] text-muted-foreground mt-0.5 max-w-[80px] text-center",
                    isCurrent && "text-primary/70"
                  )}
                >
                  {step.description}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact horizontal stepper for tight spaces
 * Shows only circles with tooltips
 */
interface CompactStepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
  onStepClick?: (stepId: number) => void;
}

export function CompactStepper({
  steps,
  currentStep,
  className,
  onStepClick,
}: CompactStepperProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.id;
        const isCurrent = currentStep === step.id;

        return (
          <div key={step.id} className="flex items-center">
            <button
              onClick={() => onStepClick?.(step.id)}
              disabled={!onStepClick}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                isCompleted && "bg-primary",
                isCurrent && "bg-primary w-6",
                !isCompleted && !isCurrent && "bg-muted-foreground/30"
              )}
              title={step.label}
              aria-label={`Step ${step.id}: ${step.label}`}
            />
            {index < steps.length - 1 && (
              <div className="w-4 h-px bg-muted mx-0.5" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}
