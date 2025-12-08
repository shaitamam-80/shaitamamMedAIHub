"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, X, FileText, Settings, Sliders, Play } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ProcessStepper } from "@/components/ui/process-stepper";
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

// Stepper Configuration
const WIZARD_STEPS = [
  { id: 1, label: "Framework", icon: FileText },
  { id: 2, label: "Method", icon: Settings },
  { id: 3, label: "Criteria", icon: Sliders },
  { id: 4, label: "Execute", icon: Play },
];

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
    <div className="flex h-full flex-col bg-slate-50 dark:bg-slate-950/30">
      {/* Wizard Header with ProcessStepper */}
      <div className="border-b bg-white dark:bg-gray-900 px-6 py-4 shadow-sm">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                Smart Screener
                <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {projectName}
                </span>
              </h1>
            </div>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" /> Close
            </Button>
          </div>

          {/* Process Stepper */}
          <ProcessStepper
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            onStepClick={(stepId) => stepId < currentStep && setCurrentStep(stepId)}
            restrictNavigation={true}
            size="sm"
          />
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
      <div className="border-t bg-white dark:bg-gray-900 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          {/* Back Button */}
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isRunning}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          {/* Next/Finish Button */}
          <div>
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="min-w-[120px]"
              >
                Next Step
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={() => onComplete?.(result!)}
                disabled={!result}
                variant={result ? "default" : "secondary"}
                className="min-w-[120px]"
              >
                <Check className="mr-2 h-4 w-4" />
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
