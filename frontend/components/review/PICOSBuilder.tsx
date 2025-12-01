"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import {
  Users,
  Syringe,
  GitCompare,
  Target,
  FileSearch,
  Shield,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
interface PICOSCriteria {
  population: {
    ageGroups: string[];
    sex: "all" | "female" | "male";
    specialConditions: string[];
    exclusions: string[];
  };
  intervention: {
    entity: string;
    mustAppearInAbstract: boolean;
    excludeSurgical: boolean;
  };
  comparator: {
    required: boolean;
    type: "any" | "placebo" | "active" | "standard_care";
    entity: string;
  };
  outcome: {
    entity: string;
    requiresQuantitative: boolean;
    acceptsQualitative: boolean;
    minimumFollowUp: string;
    excludeDiagnostics: boolean;
  };
  studyDesign: {
    humanOnly: boolean;
    allowedTypes: string[];
    qualityPack: boolean;
  };
}

interface PICOSBuilderProps {
  reviewMode: "systematic" | "scoping" | "quick";
  initialCriteria?: Partial<PICOSCriteria>;
  frameworkData?: Record<string, string>;
  onCriteriaChange: (criteria: PICOSCriteria) => void;
  onStartScreening: () => void;
}

const STUDY_TYPES = [
  { value: "rct", label: "Randomized Controlled Trials" },
  { value: "cohort", label: "Cohort Studies" },
  { value: "case_control", label: "Case-Control Studies" },
  { value: "systematic_review", label: "Systematic Reviews" },
  { value: "meta_analysis", label: "Meta-Analyses" },
  { value: "case_report", label: "Case Reports/Series" },
];

const AGE_GROUPS = [
  { value: "adults", label: "Adults (18+)" },
  { value: "children", label: "Children (0-18)" },
  { value: "elderly", label: "Elderly (65+)" },
  { value: "all", label: "All ages" },
];

const BASIC_QUALITY_PACK = [
  "Letters/Correspondence",
  "Editorials/Opinions",
  "Non-peer reviewed (Preprints)",
  "Retracted articles",
  "Conference abstracts only",
];

const sectionIcons = {
  P: <Users className="h-4 w-4" />,
  I: <Syringe className="h-4 w-4" />,
  C: <GitCompare className="h-4 w-4" />,
  O: <Target className="h-4 w-4" />,
  S: <FileSearch className="h-4 w-4" />,
};

const sectionColors = {
  P: "border-l-blue-500 bg-blue-50/50",
  I: "border-l-green-500 bg-green-50/50",
  C: "border-l-purple-500 bg-purple-50/50",
  O: "border-l-orange-500 bg-orange-50/50",
  S: "border-l-cyan-500 bg-cyan-50/50",
};

const getDefaultCriteria = (mode: string): PICOSCriteria => {
  const base: PICOSCriteria = {
    population: {
      ageGroups: ["adults"],
      sex: "all",
      specialConditions: [],
      exclusions: [],
    },
    intervention: {
      entity: "",
      mustAppearInAbstract: true,
      excludeSurgical: false,
    },
    comparator: {
      required: mode === "systematic",
      type: "any",
      entity: "",
    },
    outcome: {
      entity: "",
      requiresQuantitative: mode !== "scoping",
      acceptsQualitative: mode === "scoping",
      minimumFollowUp: "",
      excludeDiagnostics: false,
    },
    studyDesign: {
      humanOnly: mode !== "scoping",
      allowedTypes: mode === "quick"
        ? ["systematic_review", "meta_analysis", "rct"]
        : mode === "systematic"
        ? ["rct", "cohort", "case_control"]
        : ["rct", "cohort", "case_control", "systematic_review", "case_report"],
      qualityPack: mode !== "scoping",
    },
  };
  return base;
};

export function PICOSBuilder({
  reviewMode,
  initialCriteria,
  frameworkData,
  onCriteriaChange,
  onStartScreening,
}: PICOSBuilderProps) {
  const [criteria, setCriteria] = useState<PICOSCriteria>(() => ({
    ...getDefaultCriteria(reviewMode),
    ...initialCriteria,
  }));

  const updateCriteria = (section: keyof PICOSCriteria, updates: any) => {
    const newCriteria = {
      ...criteria,
      [section]: { ...criteria[section], ...updates },
    };
    setCriteria(newCriteria);
    onCriteriaChange(newCriteria);
  };

  const toggleStudyType = (type: string) => {
    const current = criteria.studyDesign.allowedTypes;
    const newTypes = current.includes(type)
      ? current.filter((t) => t !== type)
      : [...current, type];
    updateCriteria("studyDesign", { allowedTypes: newTypes });
  };

  const toggleAgeGroup = (group: string) => {
    const current = criteria.population.ageGroups;
    const newGroups = current.includes(group)
      ? current.filter((g) => g !== group)
      : [...current, group];
    updateCriteria("population", { ageGroups: newGroups });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">PICOS Eligibility Criteria Builder</CardTitle>
            <CardDescription>
              Configure your screening criteria for {reviewMode} review
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {reviewMode === "systematic" ? "📊 Systematic" :
             reviewMode === "scoping" ? "🔍 Scoping" : "⚡ Quick Answer"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <Accordion type="multiple" defaultValue={["P", "I", "O", "S"]} className="space-y-2">
          {/* Population Section */}
          <AccordionItem value="P" className={cn("border-l-4 rounded-lg", sectionColors.P)}>
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                {sectionIcons.P}
                <span className="font-semibold">P - Population</span>
                {frameworkData?.P && (
                  <Badge variant="secondary" className="ml-2 text-xs truncate max-w-[200px]">
                    {frameworkData.P}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <div className="space-y-2">
                <Label>Age Groups</Label>
                <div className="flex flex-wrap gap-2">
                  {AGE_GROUPS.map((age) => (
                    <Button
                      key={age.value}
                      variant={criteria.population.ageGroups.includes(age.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleAgeGroup(age.value)}
                    >
                      {age.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Sex</Label>
                <Select
                  value={criteria.population.sex}
                  onValueChange={(v) => updateCriteria("population", { sex: v })}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="female">Female only</SelectItem>
                    <SelectItem value="male">Male only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Intervention Section */}
          <AccordionItem value="I" className={cn("border-l-4 rounded-lg", sectionColors.I)}>
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                {sectionIcons.I}
                <span className="font-semibold">I - Intervention</span>
                {frameworkData?.I && (
                  <Badge variant="secondary" className="ml-2 text-xs truncate max-w-[200px]">
                    {frameworkData.I}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="intervention">Main Intervention</Label>
                <Input
                  id="intervention"
                  value={criteria.intervention.entity}
                  onChange={(e) => updateCriteria("intervention", { entity: e.target.value })}
                  placeholder={frameworkData?.I || "e.g., Metformin"}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mustAppear"
                  checked={criteria.intervention.mustAppearInAbstract}
                  onCheckedChange={(v) => updateCriteria("intervention", { mustAppearInAbstract: v })}
                />
                <Label htmlFor="mustAppear">Must appear in title/abstract</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="excludeSurgical"
                  checked={criteria.intervention.excludeSurgical}
                  onCheckedChange={(v) => updateCriteria("intervention", { excludeSurgical: v })}
                />
                <Label htmlFor="excludeSurgical">Exclude surgical interventions</Label>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Comparator Section */}
          <AccordionItem value="C" className={cn("border-l-4 rounded-lg", sectionColors.C)}>
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                {sectionIcons.C}
                <span className="font-semibold">C - Comparator</span>
                {frameworkData?.C && (
                  <Badge variant="secondary" className="ml-2 text-xs truncate max-w-[200px]">
                    {frameworkData.C}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="requireComparator"
                  checked={criteria.comparator.required}
                  onCheckedChange={(v) => updateCriteria("comparator", { required: v })}
                />
                <Label htmlFor="requireComparator">Requires comparison group</Label>
              </div>

              {criteria.comparator.required && (
                <>
                  <div className="space-y-2">
                    <Label>Comparison Type</Label>
                    <Select
                      value={criteria.comparator.type}
                      onValueChange={(v) => updateCriteria("comparator", { type: v })}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any comparator</SelectItem>
                        <SelectItem value="placebo">Placebo only</SelectItem>
                        <SelectItem value="active">Active comparator</SelectItem>
                        <SelectItem value="standard_care">Standard of care</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="comparatorEntity">Comparator Entity</Label>
                    <Input
                      id="comparatorEntity"
                      value={criteria.comparator.entity}
                      onChange={(e) => updateCriteria("comparator", { entity: e.target.value })}
                      placeholder={frameworkData?.C || "e.g., Placebo, Standard care"}
                    />
                  </div>
                </>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* Outcome Section */}
          <AccordionItem value="O" className={cn("border-l-4 rounded-lg", sectionColors.O)}>
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                {sectionIcons.O}
                <span className="font-semibold">O - Outcome</span>
                {frameworkData?.O && (
                  <Badge variant="secondary" className="ml-2 text-xs truncate max-w-[200px]">
                    {frameworkData.O}
                  </Badge>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="outcome">Primary Outcome</Label>
                <Input
                  id="outcome"
                  value={criteria.outcome.entity}
                  onChange={(e) => updateCriteria("outcome", { entity: e.target.value })}
                  placeholder={frameworkData?.O || "e.g., HbA1c reduction"}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="quantitative"
                  checked={criteria.outcome.requiresQuantitative}
                  onCheckedChange={(v) => updateCriteria("outcome", { requiresQuantitative: v })}
                />
                <Label htmlFor="quantitative">Requires quantitative reporting (p-values, effect sizes)</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="qualitative"
                  checked={criteria.outcome.acceptsQualitative}
                  onCheckedChange={(v) => updateCriteria("outcome", { acceptsQualitative: v })}
                />
                <Label htmlFor="qualitative">Accepts qualitative results</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="excludeDiag"
                  checked={criteria.outcome.excludeDiagnostics}
                  onCheckedChange={(v) => updateCriteria("outcome", { excludeDiagnostics: v })}
                />
                <Label htmlFor="excludeDiag">Exclude diagnostic accuracy studies</Label>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Study Design Section */}
          <AccordionItem value="S" className={cn("border-l-4 rounded-lg", sectionColors.S)}>
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                {sectionIcons.S}
                <span className="font-semibold">S - Study Design</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="humanOnly"
                  checked={criteria.studyDesign.humanOnly}
                  onCheckedChange={(v) => updateCriteria("studyDesign", { humanOnly: v })}
                />
                <Label htmlFor="humanOnly">Human studies only (exclude animal/in-vitro)</Label>
              </div>

              <div className="space-y-2">
                <Label>Include Study Types</Label>
                <div className="flex flex-wrap gap-2">
                  {STUDY_TYPES.map((type) => (
                    <Button
                      key={type.value}
                      variant={criteria.studyDesign.allowedTypes.includes(type.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleStudyType(type.value)}
                    >
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="qualityPack"
                    checked={criteria.studyDesign.qualityPack}
                    onCheckedChange={(v) => updateCriteria("studyDesign", { qualityPack: v })}
                  />
                  <Label htmlFor="qualityPack" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Basic Quality Pack (Auto-Exclusions)
                  </Label>
                </div>
                {criteria.studyDesign.qualityPack && (
                  <div className="ml-6 space-y-1">
                    {BASIC_QUALITY_PACK.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Checkbox checked disabled className="h-3 w-3" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Start Screening Button */}
        <div className="mt-6 flex justify-end">
          <Button size="lg" onClick={onStartScreening} className="gap-2">
            Start Screening with GEMS
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default PICOSBuilder;
