"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Target, Microscope, Zap, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReviewTypeInfo } from "@/types/screening";

interface Step2ReviewTypeProps {
  selectedType?: 'systematic' | 'scoping' | 'quick';
  onSelect: (type: 'systematic' | 'scoping' | 'quick') => void;
}

const REVIEW_TYPES: ReviewTypeInfo[] = [
  {
    id: 'systematic',
    name: 'Systematic Review',
    description: 'Comprehensive evidence synthesis with strict quality criteria',
    icon: 'target',
    characteristics: [
      'High precision, low false positives',
      'Strict inclusion/exclusion criteria',
      'Multiple independent reviewers recommended',
      'Best for clinical guidelines and meta-analyses'
    ],
    recommended_for: 'Clinical decision-making, policy recommendations'
  },
  {
    id: 'scoping',
    name: 'Scoping Review',
    description: 'Broad exploration to map the research landscape',
    icon: 'microscope',
    characteristics: [
      'High sensitivity, captures diverse evidence',
      'Inclusive criteria',
      'Explores emerging topics',
      'Best for identifying knowledge gaps'
    ],
    recommended_for: 'Research planning, topic exploration'
  },
  {
    id: 'quick',
    name: 'Quick Answer',
    description: 'Focused search for immediate clinical questions',
    icon: 'zap',
    characteristics: [
      'Fast turnaround',
      'Targets highest-quality evidence (RCTs, SRs)',
      'Prioritizes recent publications',
      'Best for urgent clinical questions'
    ],
    recommended_for: 'Point-of-care decisions, rapid consultations'
  }
];

const IconMap = {
  target: Target,
  microscope: Microscope,
  zap: Zap
};

export function Step2ReviewType({ selectedType, onSelect }: Step2ReviewTypeProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Select Review Type
        </h2>
        <p className="text-muted-foreground">
          Choose the review approach that matches your research goals and timeline
        </p>
      </div>

      {/* Review Type Selection */}
      <RadioGroup
        value={selectedType}
        onValueChange={(value: string) => onSelect(value as 'systematic' | 'scoping' | 'quick')}
        className="grid gap-4"
      >
        {REVIEW_TYPES.map((reviewType) => {
          const Icon = IconMap[reviewType.icon as keyof typeof IconMap];
          const isSelected = selectedType === reviewType.id;

          return (
            <Label
              key={reviewType.id}
              htmlFor={reviewType.id}
              className="cursor-pointer"
            >
              <Card
                className={cn(
                  "border-2 transition-all hover:shadow-md cursor-pointer",
                  isSelected
                    ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/20"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    {/* Radio Button */}
                    <RadioGroupItem
                      value={reviewType.id}
                      id={reviewType.id}
                      className="mt-1"
                    />

                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-lg",
                        isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">
                          {reviewType.name}
                        </CardTitle>
                        {isSelected && (
                          <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        )}
                      </div>
                      <CardDescription>
                        {reviewType.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Characteristics */}
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-2">
                      Characteristics:
                    </h4>
                    <ul className="space-y-1.5">
                      {reviewType.characteristics.map((char, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{char}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Recommended For */}
                  <div>
                    <Badge
                      variant="outline"
                      className={cn(
                        isSelected
                          ? "border-blue-600 text-blue-700"
                          : "border-gray-300"
                      )}
                    >
                      <strong className="mr-1">Best for:</strong>
                      {reviewType.recommended_for}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
