/**
 * Example usage of ToolboxAccordion component
 *
 * This file demonstrates how to use the ToolboxAccordion component
 * to display optional filters for PubMed queries.
 */

"use client";

import React, { useState } from "react";
import { ToolboxAccordion } from "./ToolboxAccordion";

// Example filter data
const exampleFilters = [
  // Age Filters
  {
    category: "Age Filters",
    label: "Adults (19+ years)",
    query: 'AND (adult[mh] OR "adult"[tiab])',
    description: "Limit to studies involving adult populations"
  },
  {
    category: "Age Filters",
    label: "Children (0-18 years)",
    query: 'AND (child[mh] OR pediatric[mh] OR "child"[tiab] OR "children"[tiab])',
    description: "Limit to pediatric populations"
  },
  {
    category: "Age Filters",
    label: "Elderly (65+ years)",
    query: 'AND (aged[mh] OR "elderly"[tiab] OR "older adults"[tiab])',
    description: "Limit to geriatric populations"
  },

  // Article Type Filters
  {
    category: "Article Type",
    label: "Randomized Controlled Trials",
    query: 'AND "randomized controlled trial"[pt]',
    description: "Only RCTs - highest level of evidence"
  },
  {
    category: "Article Type",
    label: "Meta-Analysis",
    query: 'AND "meta-analysis"[pt]',
    description: "Systematic reviews with statistical pooling"
  },
  {
    category: "Article Type",
    label: "Systematic Reviews",
    query: 'AND "systematic review"[pt]',
    description: "Comprehensive literature reviews"
  },
  {
    category: "Article Type",
    label: "Clinical Trials",
    query: 'AND "clinical trial"[pt]',
    description: "All types of clinical trials"
  },

  // Publication Date Filters
  {
    category: "Publication Date",
    label: "Last 5 Years",
    query: 'AND ("2020/01/01"[PDAT] : "3000/12/31"[PDAT])',
    description: "Recent publications from 2020 onwards"
  },
  {
    category: "Publication Date",
    label: "Last 10 Years",
    query: 'AND ("2015/01/01"[PDAT] : "3000/12/31"[PDAT])',
    description: "Publications from 2015 onwards"
  },
  {
    category: "Publication Date",
    label: "Last Year",
    query: 'AND ("2024/01/01"[PDAT] : "3000/12/31"[PDAT])',
    description: "Only the most recent publications"
  },

  // Language Filters
  {
    category: "Language & Availability",
    label: "English Only",
    query: 'AND "english"[lang]',
    description: "Restrict to English language publications"
  },
  {
    category: "Language & Availability",
    label: "Free Full Text",
    query: 'AND "free full text"[sb]',
    description: "Only articles with free full text available"
  },

  // Study Design Filters
  {
    category: "Study Design",
    label: "Human Studies",
    query: 'AND "humans"[mh]',
    description: "Exclude animal studies"
  },
  {
    category: "Study Design",
    label: "Female Population",
    query: 'AND "female"[mh]',
    description: "Studies focusing on female subjects"
  },
  {
    category: "Study Design",
    label: "Male Population",
    query: 'AND "male"[mh]',
    description: "Studies focusing on male subjects"
  },

  // Advanced Techniques
  {
    category: "Advanced Search Techniques",
    label: "Exclude Case Reports",
    query: 'NOT "case reports"[pt]',
    description: "Remove low-level evidence case reports"
  },
  {
    category: "Advanced Search Techniques",
    label: "Exclude Reviews",
    query: 'NOT "review"[pt]',
    description: "Focus on primary research"
  },
];

export function ToolboxAccordionExample() {
  const [currentQuery, setCurrentQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleAddFilter = (filter: { label: string; query: string }) => {
    // Append filter to current query
    setCurrentQuery((prev) => prev + " " + filter.query);

    // Add to active filters list
    if (!activeFilters.includes(filter.label)) {
      setActiveFilters([...activeFilters, filter.label]);
    }
  };

  const handleCopyFilter = (query: string) => {
    console.log("Copied filter:", query);
    // You can show a toast notification here
  };

  return (
    <div className="space-y-4 p-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Current Query</h2>
        <div className="p-4 bg-muted rounded-lg font-mono text-sm">
          {currentQuery || "No query yet..."}
        </div>
      </div>

      <ToolboxAccordion
        filters={exampleFilters}
        onAddFilter={handleAddFilter}
        onCopyFilter={handleCopyFilter}
        activeFilters={activeFilters}
      />

      <div className="flex gap-2">
        <button
          onClick={() => {
            setCurrentQuery("");
            setActiveFilters([]);
          }}
          className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md"
        >
          Clear All
        </button>
      </div>
    </div>
  );
}

export default ToolboxAccordionExample;
