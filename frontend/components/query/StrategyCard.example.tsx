/**
 * Example usage of StrategyCard component
 * This file demonstrates how to use the StrategyCard in the Query Tool
 */

import { StrategyCard } from "./StrategyCard";

// Example 1: Comprehensive Query (High Sensitivity)
export function ComprehensiveStrategyExample() {
  return (
    <StrategyCard
      name="Strategy A: Comprehensive Query (High Sensitivity)"
      purpose="Maximizes retrieval of all potentially relevant studies. Ideal for systematic reviews where missing studies is unacceptable."
      formula="P AND I AND (C OR O)"
      query='("elderly"[MeSH Terms] OR "aged"[MeSH Terms] OR "older adults"[tiab]) AND ("exercise"[MeSH Terms] OR "physical activity"[tiab]) AND (("standard care"[tiab] OR "usual care"[tiab]) OR ("depression"[MeSH Terms] OR "depressive symptoms"[tiab]))'
      expectedYield="1000-5000+ results"
      useCases={[
        "Systematic reviews",
        "Meta-analyses",
        "Scoping reviews",
        "Initial exploration"
      ]}
      badge={{
        label: "HIGH RECALL",
        variant: "emerald"
      }}
      onCopy={(query) => console.log("Copied:", query)}
      onExecute={(query) => console.log("Execute:", query)}
      onOpenPubMed={(query) => console.log("Open PubMed:", query)}
    />
  );
}

// Example 2: Focused Query (High Precision)
export function FocusedStrategyExample() {
  return (
    <StrategyCard
      name="Strategy B: Focused Query (High Precision)"
      purpose="Targets most relevant studies with tighter search criteria. Reduces noise and irrelevant results."
      formula="P AND I AND C AND O"
      query='("elderly"[MeSH Terms] OR "aged"[MeSH Terms]) AND ("exercise"[MeSH Terms] OR "physical activity"[MeSH Terms]) AND ("standard care"[tiab] OR "usual care"[tiab]) AND ("depression"[MeSH Terms])'
      expectedYield="100-500 results"
      useCases={[
        "Rapid reviews",
        "Clinical guidelines",
        "Time-limited projects",
        "Focused research questions"
      ]}
      badge={{
        label: "HIGH PRECISION",
        variant: "blue"
      }}
      onCopy={(query) => console.log("Copied:", query)}
      onExecute={(query) => console.log("Execute:", query)}
      onOpenPubMed={(query) => console.log("Open PubMed:", query)}
    />
  );
}

// Example 3: Clinical Filtered (Therapy/RCT)
export function ClinicalFilteredExample() {
  return (
    <StrategyCard
      name="Strategy C: Clinical Filtered (Therapy/RCT)"
      purpose="Applies validated clinical hedge for therapy/RCT studies. Balances sensitivity and specificity for clinical questions."
      formula="(P AND I AND O) + Clinical Hedge"
      query='("elderly"[MeSH Terms] OR "aged"[MeSH Terms]) AND ("exercise"[MeSH Terms] OR "physical activity"[MeSH Terms]) AND ("depression"[MeSH Terms]) AND (randomized controlled trial[pt] OR controlled clinical trial[pt] OR randomized[tiab] OR placebo[tiab] OR clinical trials as topic[mesh:noexp] OR randomly[tiab] OR trial[ti])'
      queryNarrow='("elderly"[MeSH Terms] OR "aged"[MeSH Terms]) AND ("exercise"[MeSH Terms] OR "physical activity"[MeSH Terms]) AND ("depression"[MeSH Terms]) AND (randomized controlled trial[pt] OR controlled clinical trial[pt] OR randomized[tiab] OR placebo[tiab] OR clinical trials as topic[mesh:noexp] OR randomly[tiab] OR trial[ti]) AND ("2015/01/01"[PDAT] : "3000"[PDAT]) AND (english[la])'
      expectedYield="50-200 results"
      useCases={[
        "Clinical practice guidelines",
        "Evidence-based medicine",
        "Treatment effectiveness studies"
      ]}
      badge={{
        label: "RCT FOCUSED",
        variant: "amber"
      }}
      hedgeApplied="Cochrane Sensitivity-Maximizing RCT Filter"
      hedgeCitation="Lefebvre C, et al. Cochrane Handbook 2023"
      onCopy={(query) => console.log("Copied:", query)}
      onExecute={(query) => console.log("Execute:", query)}
      onOpenPubMed={(query) => console.log("Open PubMed:", query)}
      isExpanded={true}
    />
  );
}

// Example 4: Using all strategies in a list
export function MultipleStrategiesExample() {
  const strategies = [
    {
      name: "Strategy A: Comprehensive Query (High Sensitivity)",
      purpose: "Maximizes retrieval of all potentially relevant studies",
      formula: "P AND I AND (C OR O)",
      query: "...",
      expectedYield: "1000-5000+ results",
      useCases: ["Systematic reviews", "Meta-analyses"],
      badge: { label: "HIGH RECALL", variant: "emerald" as const }
    },
    {
      name: "Strategy B: Focused Query (High Precision)",
      purpose: "Targets most relevant studies with tighter criteria",
      formula: "P AND I AND C AND O",
      query: "...",
      expectedYield: "100-500 results",
      useCases: ["Rapid reviews", "Clinical guidelines"],
      badge: { label: "HIGH PRECISION", variant: "blue" as const }
    },
    {
      name: "Strategy C: Clinical Filtered (Therapy/RCT)",
      purpose: "Applies validated clinical hedge",
      formula: "(P AND I AND O) + Clinical Hedge",
      query: "...",
      expectedYield: "50-200 results",
      useCases: ["Clinical guidelines", "Evidence-based medicine"],
      badge: { label: "RCT FOCUSED", variant: "amber" as const }
    }
  ];

  return (
    <div className="space-y-4">
      {strategies.map((strategy, index) => (
        <StrategyCard
          key={index}
          {...strategy}
          onCopy={(query) => console.log("Copied:", query)}
          onExecute={(query) => console.log("Execute:", query)}
          onOpenPubMed={(query) => console.log("Open PubMed:", query)}
        />
      ))}
    </div>
  );
}
