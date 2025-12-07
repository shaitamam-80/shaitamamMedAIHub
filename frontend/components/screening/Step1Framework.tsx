"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step1FrameworkProps {
  projectName: string;
  frameworkType: string;
  frameworkData: Record<string, string>;
  onConfirm: () => void;
}

// Framework component labels mapping
const FRAMEWORK_LABELS: Record<string, Record<string, string>> = {
  PICO: {
    P: "Population",
    I: "Intervention",
    C: "Comparison",
    O: "Outcome"
  },
  PEO: {
    P: "Population",
    E: "Exposure",
    O: "Outcome"
  },
  SPIDER: {
    S: "Sample",
    PI: "Phenomenon of Interest",
    D: "Design",
    E: "Evaluation",
    R: "Research type"
  },
  PICOT: {
    P: "Population",
    I: "Intervention",
    C: "Comparison",
    O: "Outcome",
    T: "Timeframe"
  },
  CoCoPop: {
    Co: "Condition",
    Co2: "Context",
    Pop: "Population"
  }
};

export function Step1Framework({
  projectName,
  frameworkType,
  frameworkData,
  onConfirm,
}: Step1FrameworkProps) {
  const labels = FRAMEWORK_LABELS[frameworkType] || {};
  const components = Object.entries(frameworkData);
  const hasData = components.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {hasData ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          ) : (
            <AlertCircle className="h-6 w-6 text-amber-600" />
          )}
          <h2 className="text-2xl font-bold text-foreground">
            Review Research Question
          </h2>
        </div>
        <p className="text-muted-foreground">
          Confirm your research framework before configuring screening criteria
        </p>
      </div>

      {/* Project Info */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {projectName}
            <Badge variant="outline" className="ml-auto">
              {frameworkType}
            </Badge>
          </CardTitle>
          <CardDescription>
            Your structured research question will guide the screening process
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Framework Components */}
      {hasData ? (
        <div className="grid gap-4 md:grid-cols-2">
          {components.map(([key, value]) => (
            <Card
              key={key}
              className={cn(
                "border-2 transition-all hover:shadow-md",
                "bg-gradient-to-br from-white to-gray-50/50",
                "dark:from-gray-900 dark:to-gray-800/50"
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">
                    {key}
                  </div>
                  <CardTitle className="text-base">
                    {labels[key] || key}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {value || "Not specified"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-amber-200 bg-amber-50/50">
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-amber-600 mb-4" />
            <h3 className="text-lg font-semibold text-amber-900 mb-2">
              No Framework Data Found
            </h3>
            <p className="text-sm text-amber-700 max-w-md mx-auto">
              Please return to the Define Tool to formulate your research question
              before proceeding with screening.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status Message */}
      {hasData && (
        <Card className="border-2 border-emerald-200 bg-emerald-50/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-emerald-900">
                  Framework Confirmed
                </p>
                <p className="text-sm text-emerald-700 mt-1">
                  Your {frameworkType} framework is complete and ready for screening configuration.
                  Click Next to proceed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
