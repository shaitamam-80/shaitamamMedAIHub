"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Users, Microscope, Calendar, Languages, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { CriteriaLibrary, CriteriaConfig } from "@/types/screening";

interface Step3CriteriaProps {
  criteriaLibrary: CriteriaLibrary;
  config: Partial<CriteriaConfig>;
  onChange: (config: Partial<CriteriaConfig>) => void;
}

export function Step3Criteria({ criteriaLibrary, config, onChange }: Step3CriteriaProps) {
  const [selectedPopulation, setSelectedPopulation] = useState<string[]>(
    config.population?.codes || []
  );
  const [selectedStudyInclusion, setSelectedStudyInclusion] = useState<string[]>(
    config.study_design?.inclusion_codes || []
  );
  const [selectedStudyExclusion, setSelectedStudyExclusion] = useState<string[]>(
    config.study_design?.exclusion_codes || []
  );
  const [dateStart, setDateStart] = useState<string>(
    config.date_range_start?.toString() || ""
  );
  const [dateEnd, setDateEnd] = useState<string>(
    config.date_range_end?.toString() || ""
  );
  const [languages, setLanguages] = useState<string[]>(
    config.languages || ["eng"]
  );
  const [customInclusion, setCustomInclusion] = useState(config.custom_inclusion || "");
  const [customExclusion, setCustomExclusion] = useState(config.custom_exclusion || "");

  // Update parent config whenever local state changes
  useEffect(() => {
    onChange({
      population: {
        codes: selectedPopulation,
      },
      study_design: {
        inclusion_codes: selectedStudyInclusion,
        exclusion_codes: selectedStudyExclusion,
      },
      date_range_start: dateStart ? parseInt(dateStart) : undefined,
      date_range_end: dateEnd ? parseInt(dateEnd) : undefined,
      languages,
      custom_inclusion: customInclusion || undefined,
      custom_exclusion: customExclusion || undefined,
    });
  }, [
    selectedPopulation,
    selectedStudyInclusion,
    selectedStudyExclusion,
    dateStart,
    dateEnd,
    languages,
    customInclusion,
    customExclusion,
    onChange,
  ]);

  const handlePopulationToggle = (code: string) => {
    setSelectedPopulation((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleStudyInclusionToggle = (code: string) => {
    setSelectedStudyInclusion((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleStudyExclusionToggle = (code: string) => {
    setSelectedStudyExclusion((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleLanguageToggle = (lang: string) => {
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          Configure Screening Criteria
        </h2>
        <p className="text-muted-foreground">
          Select criteria codes to guide automated screening decisions
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="population" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="population" className="gap-2">
            <Users className="h-4 w-4" />
            Population
          </TabsTrigger>
          <TabsTrigger value="study_design" className="gap-2">
            <Microscope className="h-4 w-4" />
            Study Design
          </TabsTrigger>
          <TabsTrigger value="filters" className="gap-2">
            <Calendar className="h-4 w-4" />
            Other Filters
          </TabsTrigger>
        </TabsList>

        {/* Population Tab */}
        <TabsContent value="population" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Population Criteria</CardTitle>
              <CardDescription>
                Define age groups, gender, and population exclusions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(criteriaLibrary.population).map(([code, criteria]) => (
                <CriteriaCheckbox
                  key={code}
                  code={code}
                  label={criteria.label}
                  description={criteria.description}
                  isExclusion={criteria.exclude}
                  checked={selectedPopulation.includes(code)}
                  onToggle={handlePopulationToggle}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Study Design Tab */}
        <TabsContent value="study_design" className="space-y-4">
          {/* Inclusion Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>Study Types to Include</CardTitle>
              <CardDescription>
                Select study designs to include in your review
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(criteriaLibrary.study_design)
                .filter(([_, criteria]) => !criteria.exclude)
                .map(([code, criteria]) => (
                  <CriteriaCheckbox
                    key={code}
                    code={code}
                    label={criteria.label}
                    description={criteria.description}
                    isExclusion={false}
                    checked={selectedStudyInclusion.includes(code)}
                    onToggle={handleStudyInclusionToggle}
                  />
                ))}
            </CardContent>
          </Card>

          {/* Exclusion Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>Study Types to Exclude</CardTitle>
              <CardDescription>
                Select study types and publication formats to exclude
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(criteriaLibrary.study_design)
                .filter(([_, criteria]) => criteria.exclude)
                .map(([code, criteria]) => (
                  <CriteriaCheckbox
                    key={code}
                    code={code}
                    label={criteria.label}
                    description={criteria.description}
                    isExclusion={true}
                    checked={selectedStudyExclusion.includes(code)}
                    onToggle={handleStudyExclusionToggle}
                  />
                ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other Filters Tab */}
        <TabsContent value="filters" className="space-y-4">
          {/* Date Range */}
          <Card>
            <CardHeader>
              <CardTitle>Publication Date Range</CardTitle>
              <CardDescription>
                Limit results to a specific time period (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date-start">Start Year</Label>
                  <Input
                    id="date-start"
                    type="number"
                    placeholder="e.g., 2015"
                    value={dateStart}
                    onChange={(e) => setDateStart(e.target.value)}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date-end">End Year</Label>
                  <Input
                    id="date-end"
                    type="number"
                    placeholder="e.g., 2025"
                    value={dateEnd}
                    onChange={(e) => setDateEnd(e.target.value)}
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Languages className="h-5 w-5" />
                Languages
              </CardTitle>
              <CardDescription>
                Select which language publications to include
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { code: "eng", label: "English" },
                { code: "spa", label: "Spanish" },
                { code: "fre", label: "French" },
                { code: "ger", label: "German" },
                { code: "chi", label: "Chinese" },
              ].map((lang) => (
                <div key={lang.code} className="flex items-center gap-2">
                  <Checkbox
                    id={`lang-${lang.code}`}
                    checked={languages.includes(lang.code)}
                    onCheckedChange={() => handleLanguageToggle(lang.code)}
                  />
                  <Label htmlFor={`lang-${lang.code}`} className="cursor-pointer">
                    {lang.label}
                  </Label>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Custom Criteria */}
          <Card>
            <CardHeader>
              <CardTitle>Custom Criteria (Optional)</CardTitle>
              <CardDescription>
                Add free-text criteria for AI to consider during screening
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="custom-inclusion">Custom Inclusion Criteria</Label>
                <Textarea
                  id="custom-inclusion"
                  placeholder="e.g., Must measure quality of life using validated scales"
                  value={customInclusion}
                  onChange={(e) => setCustomInclusion(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-exclusion">Custom Exclusion Criteria</Label>
                <Textarea
                  id="custom-exclusion"
                  placeholder="e.g., Exclude studies with sample size < 30"
                  value={customExclusion}
                  onChange={(e) => setCustomExclusion(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// Criteria Checkbox Component
// ============================================================================

interface CriteriaCheckboxProps {
  code: string;
  label: string;
  description: string;
  isExclusion: boolean;
  checked: boolean;
  onToggle: (code: string) => void;
}

function CriteriaCheckbox({
  code,
  label,
  description,
  isExclusion,
  checked,
  onToggle,
}: CriteriaCheckboxProps) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50">
      <Checkbox
        id={code}
        checked={checked}
        onCheckedChange={() => onToggle(code)}
        className="mt-0.5"
      />
      <div className="flex-1 space-y-1">
        <Label htmlFor={code} className="flex items-center gap-2 cursor-pointer">
          <Badge
            variant={isExclusion ? "destructive" : "default"}
            className="font-mono text-xs"
          >
            {code}
          </Badge>
          <span className="font-medium">{label}</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">{description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
