"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useQueryState } from "nuqs";
import type {
  QueryGenerateResponseV2,
  ToolboxFilter,
  ConceptAnalysisV2,
} from "@/lib/api";
import {
  strategyParser,
  filtersParser,
  URL_KEYS,
  type UrlStrategyType,
} from "@/lib/url-state";

// ============================================================================
// Types
// ============================================================================

export type StrategyType = "comprehensive" | "direct" | "clinical";

export interface ConceptTerm {
  id: string;
  term: string;
  type: "mesh" | "freetext" | "entry";
  included: boolean;
  conceptKey: string;
}

export interface QuickFilter {
  label: string;
  query: string;
  category: string;
}

export interface QueryBuilderState {
  // Strategy & Query
  currentStrategy: StrategyType;
  currentQuery: string;
  addedFilters: string[];

  // Edit Mode
  isEditMode: boolean;
  editedConcepts: ConceptAnalysisV2[];
  newTermInput: Record<string, string>;
  expandedEntryTerms: Record<string, boolean>;

  // UI State
  showMoreFilters: boolean;
}

export interface QueryBuilderActions {
  // Strategy
  setStrategy: (strategy: StrategyType) => void;
  setCurrentQuery: (query: string) => void;

  // Filters
  addFilter: (filter: QuickFilter | ToolboxFilter) => void;
  removeFilter: (filterLabel: string) => void;
  clearAllFilters: () => void;
  toggleMoreFilters: () => void;

  // Edit Mode
  startEdit: () => void;
  cancelEdit: () => void;
  saveEdit: () => void;
  removeTermFromConcept: (conceptKey: string, termType: "mesh" | "text", termValue: string) => void;
  addNewTerm: (conceptKey: string, termType: "mesh" | "text") => void;
  setNewTermInput: (key: string, value: string) => void;
  toggleEntryTermsExpanded: (conceptKey: string) => void;

  // Query Actions
  addTermToQuery: (term: string, type: "mesh" | "text") => void;
  resetToStrategyQuery: () => void;
}

export interface QueryBuilderComputed {
  // Current strategy object
  strategy: QueryGenerateResponseV2["strategies"]["comprehensive"] | undefined;

  // Concepts (edited or original)
  concepts: ConceptAnalysisV2[];

  // Toolbox grouped by category
  groupedToolbox: Record<string, ToolboxFilter[]>;

  // Query validation
  isQueryEmpty: boolean;
  queryLength: number;
}

export interface UseQueryBuilderReturn {
  state: QueryBuilderState;
  actions: QueryBuilderActions;
  computed: QueryBuilderComputed;
}

// ============================================================================
// Quick Filters - Static configuration
// ============================================================================

export const QUICK_FILTERS: QuickFilter[] = [
  { label: "Humans Only", query: "AND humans[Mesh]", category: "Population" },
  { label: "English", query: "AND English[lang]", category: "Language" },
  { label: "Last 5 Years", query: 'AND ("last 5 years"[dp])', category: "Date" },
  { label: "Adults (19+)", query: 'AND ("adult"[Mesh] OR adult*[tiab])', category: "Age" },
  { label: "RCTs Only", query: "AND (randomized controlled trial[pt])", category: "Study Design" },
];

// ============================================================================
// Hook Implementation
// ============================================================================

export function useQueryBuilder(
  queryResult: QueryGenerateResponseV2
): UseQueryBuilderReturn {
  // ---------------------------------------------------------------------------
  // URL State (synced with browser URL)
  // ---------------------------------------------------------------------------

  // Strategy from URL - ?s=comprehensive|direct|clinical
  const [urlStrategy, setUrlStrategy] = useQueryState(
    URL_KEYS.strategy,
    strategyParser
  );

  // Filters from URL - ?f=Humans,English,RCT
  const [urlFilters, setUrlFilters] = useQueryState(
    URL_KEYS.filters,
    filtersParser
  );

  // ---------------------------------------------------------------------------
  // Local State (not persisted in URL)
  // ---------------------------------------------------------------------------

  const [currentQuery, setCurrentQuery] = useState<string>("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedConcepts, setEditedConcepts] = useState<ConceptAnalysisV2[]>([]);
  const [newTermInput, setNewTermInputState] = useState<Record<string, string>>({});
  const [expandedEntryTerms, setExpandedEntryTerms] = useState<Record<string, boolean>>({});

  // ---------------------------------------------------------------------------
  // Derived State from URL
  // ---------------------------------------------------------------------------

  // Cast URL strategy to StrategyType (already validated by parser)
  const currentStrategy = urlStrategy as StrategyType;
  const addedFilters = urlFilters;

  // ---------------------------------------------------------------------------
  // Effects - Initialize query from strategy
  // ---------------------------------------------------------------------------

  // Track if this is the initial mount
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize query when strategy changes (from URL or user action)
  useEffect(() => {
    const strategyQuery = queryResult.strategies?.[currentStrategy]?.query || "";

    // On initial load, apply any URL filters to the query
    if (!isInitialized && urlFilters.length > 0) {
      const allFilters = [...QUICK_FILTERS, ...(queryResult.toolbox || [])];
      let queryWithFilters = strategyQuery;

      // Apply each URL filter that exists in our filter list
      urlFilters.forEach((filterLabel) => {
        const filter = allFilters.find((f) => f.label === filterLabel);
        if (filter && !queryWithFilters.includes(filter.query)) {
          queryWithFilters = queryWithFilters.trim()
            ? `${queryWithFilters} ${filter.query}`
            : filter.query.replace(/^AND\s+/, "");
        }
      });

      setCurrentQuery(queryWithFilters);
      setIsInitialized(true);
    } else if (isInitialized) {
      // Strategy changed by user action - reset to base query, clear filters
      setCurrentQuery(strategyQuery);
      setUrlFilters([]);
    } else {
      // Initial load with no URL filters
      setCurrentQuery(strategyQuery);
      setIsInitialized(true);
    }
  }, [queryResult, currentStrategy, isInitialized, urlFilters, queryResult.toolbox, setUrlFilters]);

  // ---------------------------------------------------------------------------
  // Computed Values
  // ---------------------------------------------------------------------------

  const strategy = queryResult.strategies?.[currentStrategy];

  const concepts = useMemo(() => {
    return isEditMode && editedConcepts.length > 0
      ? editedConcepts
      : queryResult.concepts || [];
  }, [isEditMode, editedConcepts, queryResult.concepts]);

  const groupedToolbox = useMemo(() => {
    const toolbox = queryResult.toolbox || [];
    return toolbox.reduce((acc, item) => {
      const cat = item.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {} as Record<string, ToolboxFilter[]>);
  }, [queryResult.toolbox]);

  const isQueryEmpty = !currentQuery.trim();
  const queryLength = currentQuery.length;

  // ---------------------------------------------------------------------------
  // Actions - Strategy
  // ---------------------------------------------------------------------------

  const setStrategy = useCallback((strategy: StrategyType) => {
    // Update URL state - this will trigger the effect above
    setUrlStrategy(strategy as UrlStrategyType);
  }, [setUrlStrategy]);

  // ---------------------------------------------------------------------------
  // Actions - Filters
  // ---------------------------------------------------------------------------

  const addFilter = useCallback((filter: QuickFilter | ToolboxFilter) => {
    if (!addedFilters.includes(filter.label)) {
      const newQuery = currentQuery.trim()
        ? `${currentQuery} ${filter.query}`
        : filter.query.replace(/^AND\s+/, "");
      setCurrentQuery(newQuery);
      // Update URL with new filter
      setUrlFilters([...addedFilters, filter.label]);
    }
  }, [currentQuery, addedFilters, setUrlFilters]);

  const removeFilter = useCallback((filterLabel: string) => {
    const allFilters = [...QUICK_FILTERS, ...(queryResult.toolbox || [])];
    const filter = allFilters.find((f) => f.label === filterLabel);

    if (filter) {
      let newQuery = currentQuery.replace(`${filter.query}`, "");
      newQuery = newQuery.replace(/\(\(([^)]+)\)\)\s*$/, "($1)");
      newQuery = newQuery.trim();
      setCurrentQuery(newQuery);
      // Update URL without this filter
      const newFilters = addedFilters.filter((f) => f !== filterLabel);
      setUrlFilters(newFilters.length > 0 ? newFilters : []);
    }
  }, [currentQuery, queryResult.toolbox, addedFilters, setUrlFilters]);

  const clearAllFilters = useCallback(() => {
    setCurrentQuery(queryResult.strategies?.[currentStrategy]?.query || "");
    // Clear URL filters
    setUrlFilters([]);
  }, [queryResult.strategies, currentStrategy, setUrlFilters]);

  const toggleMoreFilters = useCallback(() => {
    setShowMoreFilters((prev) => !prev);
  }, []);

  // ---------------------------------------------------------------------------
  // Actions - Edit Mode
  // ---------------------------------------------------------------------------

  const startEdit = useCallback(() => {
    setEditedConcepts(queryResult.concepts || []);
    setIsEditMode(true);
  }, [queryResult.concepts]);

  const cancelEdit = useCallback(() => {
    setIsEditMode(false);
    setEditedConcepts([]);
    setNewTermInputState({});
  }, []);

  const saveEdit = useCallback(() => {
    // TODO: Optionally save to backend or rebuild queries
    setIsEditMode(false);
    setNewTermInputState({});
  }, []);

  const removeTermFromConcept = useCallback(
    (conceptKey: string, termType: "mesh" | "text", termValue: string) => {
      setEditedConcepts((prev) =>
        prev.map((c) => {
          if ((c.key || c.component_key) !== conceptKey) return c;

          if (termType === "mesh") {
            return {
              ...c,
              mesh_terms: (c.mesh_terms || []).filter((t) => t !== termValue),
            };
          } else {
            return {
              ...c,
              free_text_terms: (c.free_text_terms || []).filter((t) => t !== termValue),
              entry_terms: (c.entry_terms || []).filter((t) => t !== termValue),
            };
          }
        })
      );
    },
    []
  );

  const addNewTerm = useCallback(
    (conceptKey: string, termType: "mesh" | "text") => {
      const inputKey = `${conceptKey}_${termType}`;
      const newTerm = newTermInput[inputKey]?.trim();
      if (!newTerm) return;

      setEditedConcepts((prev) =>
        prev.map((c) => {
          if ((c.key || c.component_key) !== conceptKey) return c;

          if (termType === "mesh") {
            return {
              ...c,
              mesh_terms: [...(c.mesh_terms || []), newTerm],
            };
          } else {
            return {
              ...c,
              free_text_terms: [...(c.free_text_terms || []), newTerm],
            };
          }
        })
      );

      setNewTermInputState((prev) => ({ ...prev, [inputKey]: "" }));
    },
    [newTermInput]
  );

  const setNewTermInput = useCallback((key: string, value: string) => {
    setNewTermInputState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const toggleEntryTermsExpanded = useCallback((conceptKey: string) => {
    setExpandedEntryTerms((prev) => ({
      ...prev,
      [conceptKey]: !prev[conceptKey],
    }));
  }, []);

  // ---------------------------------------------------------------------------
  // Actions - Query Manipulation
  // ---------------------------------------------------------------------------

  const addTermToQuery = useCallback(
    (term: string, type: "mesh" | "text") => {
      const formattedTerm = type === "mesh" ? `"${term}"[Mesh]` : `"${term}"[tiab]`;

      if (currentQuery.trim()) {
        setCurrentQuery((prev) => `${prev} OR ${formattedTerm}`);
      } else {
        setCurrentQuery(formattedTerm);
      }
    },
    [currentQuery]
  );

  const resetToStrategyQuery = useCallback(() => {
    setCurrentQuery(queryResult.strategies?.[currentStrategy]?.query || "");
    // Clear URL filters
    setUrlFilters([]);
  }, [queryResult.strategies, currentStrategy, setUrlFilters]);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    state: {
      currentStrategy,
      currentQuery,
      addedFilters,
      isEditMode,
      editedConcepts,
      newTermInput,
      expandedEntryTerms,
      showMoreFilters,
    },
    actions: {
      setStrategy,
      setCurrentQuery,
      addFilter,
      removeFilter,
      clearAllFilters,
      toggleMoreFilters,
      startEdit,
      cancelEdit,
      saveEdit,
      removeTermFromConcept,
      addNewTerm,
      setNewTermInput,
      toggleEntryTermsExpanded,
      addTermToQuery,
      resetToStrategyQuery,
    },
    computed: {
      strategy,
      concepts,
      groupedToolbox,
      isQueryEmpty,
      queryLength,
    },
  };
}

export default useQueryBuilder;
