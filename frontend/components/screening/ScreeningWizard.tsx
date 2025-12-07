"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import apiClient from "@/lib/api";

// Step Components
import { Step1Framework } from "./Step1Framework";
import { Step2ReviewType } from "./Step2ReviewType";
import { Step3Criteria } from "./Step3Criteria";
import { Step4Execution, type LogEntry } from "./Step4Execution";

// Types
import type {
  CriteriaLibrary,
  CriteriaConfig,
  ScreeningResult,
} from "@/types/screening";

interface ScreeningWizardProps {
  projectId: string;
  projectName: string;
  frameworkType: string;
  frameworkData: Record<string, string>;
  pmids?: string[];
  onComplete?: (result: ScreeningResult) => void;
  onCancel?: () => void;
}

export function ScreeningWizard({
  projectId,
  projectName,
  frameworkType,
  frameworkData,
  pmids = [],
  onComplete,
  onCancel,
}: ScreeningWizardProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [criteriaLibrary, setCriteriaLibrary] = useState<CriteriaLibrary | null>(null);
  const [reviewType, setReviewType] = useState<'systematic' | 'scoping' | 'quick'>();
  const [criteriaConfig, setCriteriaConfig] = useState<Partial<CriteriaConfig>>({
    languages: ["eng"],
    population: { codes: [] },
    study_design: { inclusion_codes: [], exclusion_codes: [] },
  });

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<ScreeningResult>();

  // Load criteria library on mount
  useEffect(() => {
    loadCriteriaLibrary();
  }, []);

  const loadCriteriaLibrary = async () => {
    try {
      const data = await apiClient.getCriteriaLibrary();
      setCriteriaLibrary(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load criteria library",
        variant: "destructive",
      });
    }
  };

  const addLog = (level: LogEntry["level"], message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, { timestamp, level, message }]);
  };

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1 && Object.keys(frameworkData).length === 0) {
      toast({
        title: "Incomplete Framework",
        description: "Please complete your research framework in the Define Tool",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 2 && !reviewType) {
      toast({
        title: "Select Review Type",
        description: "Please select a review type to continue",
        variant: "destructive",
      });
      return;
    }

    if (currentStep === 3) {
      // Save criteria before moving to execution
      handleSaveCriteria();
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSaveCriteria = async () => {
    if (!reviewType) return;

    try {
      const fullConfig: CriteriaConfig = {
        review_type: reviewType,
        languages: criteriaConfig.languages || ["eng"],
        population: criteriaConfig.population || { codes: [] },
        study_design: criteriaConfig.study_design || {
          inclusion_codes: [],
          exclusion_codes: [],
        },
        date_range_start: criteriaConfig.date_range_start,
        date_range_end: criteriaConfig.date_range_end,
        custom_inclusion: criteriaConfig.custom_inclusion,
        custom_exclusion: criteriaConfig.custom_exclusion,
      };

      await apiClient.initCriteria({
        project_id: projectId,
        review_type: reviewType,
        filters: fullConfig as unknown as Record<string, unknown>,
      });

      addLog("success", "Criteria configuration saved");
    } catch (error) {
      addLog("error", `Failed to save criteria: ${error}`);
      toast({
        title: "Error",
        description: "Failed to save criteria configuration",
        variant: "destructive",
      });
    }
  };

  const handleStartScreening = async () => {
    if (pmids.length === 0) {
      toast({
        title: "No Articles",
        description: "No PMIDs available for screening",
        variant: "destructive",
      });
      return;
    }

    setIsRunning(true);
    setProgress(0);
    addLog("info", `Starting screening of ${pmids.length} articles...`);

    try {
      // Simulate batch processing
      const batchSize = 10;
      const batches = Math.ceil(pmids.length / batchSize);

      for (let i = 0; i < batches; i++) {
        const start = i * batchSize;
        const end = Math.min(start + batchSize, pmids.length);
        const batchPmids = pmids.slice(start, end);

        addLog("info", `Processing batch ${i + 1}/${batches} (${batchPmids.length} articles)...`);

        // Build full criteria config
        const fullCriteriaConfig = {
          review_type: reviewType || "systematic",
          languages: criteriaConfig.languages || ["eng"],
          population: criteriaConfig.population || { codes: [] },
          study_design: criteriaConfig.study_design || { inclusion_codes: [], exclusion_codes: [] },
          date_range_start: criteriaConfig.date_range_start,
          date_range_end: criteriaConfig.date_range_end,
          custom_inclusion: criteriaConfig.custom_inclusion,
          custom_exclusion: criteriaConfig.custom_exclusion,
        };

        // Call API
        const response = await apiClient.processPmids({
          project_id: projectId,
          pmids: batchPmids,
          criteria_config: fullCriteriaConfig,
        });

        setProgress(end);
        addLog("success", `Batch ${i + 1} complete`);

        // Update result with final batch response
        if (i === batches - 1) {
          setResult(response);

          // Call onComplete with the response directly (not stale state)
          if (onComplete) {
            onComplete(response);
          }
        }
      }

      addLog("success", "Screening complete!");
      setIsRunning(false);

      toast({
        title: "Screening Complete",
        description: `Processed ${pmids.length} articles`,
      });
    } catch (error) {
      addLog("error", `Screening failed: ${error}`);
      setIsRunning(false);
      toast({
        title: "Screening Failed",
        description: "An error occurred during screening",
        variant: "destructive",
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return Object.keys(frameworkData).length > 0;
      case 2:
        return reviewType !== undefined;
      case 3:
        return true;
      case 4:
        return false;
      default:
        return false;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Wizard Header */}
      <div className="border-b bg-white dark:bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Smart Screener</h1>
            <p className="text-sm text-muted-foreground">
              {projectName}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((step) => (
              <React.Fragment key={step}>
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all",
                    currentStep === step &&
                      "bg-blue-600 text-white shadow-md scale-110",
                    currentStep > step && "bg-emerald-500 text-white",
                    currentStep < step && "bg-gray-200 text-gray-500 dark:bg-gray-700"
                  )}
                >
                  {currentStep > step ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 4 && (
                  <div
                    className={cn(
                      "h-0.5 w-12 transition-all",
                      currentStep > step ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700"
                    )}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-5xl">
          {currentStep === 1 && (
            <Step1Framework
              projectName={projectName}
              frameworkType={frameworkType}
              frameworkData={frameworkData}
              onConfirm={handleNext}
            />
          )}

          {currentStep === 2 && (
            <Step2ReviewType
              selectedType={reviewType}
              onSelect={setReviewType}
            />
          )}

          {currentStep === 3 && criteriaLibrary && (
            <Step3Criteria
              criteriaLibrary={criteriaLibrary}
              config={criteriaConfig}
              onChange={setCriteriaConfig}
            />
          )}

          {currentStep === 4 && (
            <Step4Execution
              isRunning={isRunning}
              progress={progress}
              total={pmids.length}
              logs={logs}
              result={result}
              onStart={handleStartScreening}
            />
          )}
        </div>
      </div>

      {/* Navigation Footer */}
      <Card className="border-t rounded-none shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Cancel/Back */}
          <div>
            {currentStep === 1 ? (
              <Button variant="ghost" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={handleBack}
                disabled={isRunning}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          {/* Step Label */}
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of 4
          </div>

          {/* Next */}
          <div>
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => onComplete?.(result!)}
                disabled={!result}
                variant="default"
              >
                <Check className="mr-2 h-4 w-4" />
                Finish
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
