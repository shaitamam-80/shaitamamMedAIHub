/**
 * URL State Parsers for Query Tool
 * Uses nuqs library for type-safe URL state management in Next.js App Router
 */

import {
  parseAsString,
  parseAsArrayOf,
  parseAsInteger,
  createParser,
} from "nuqs";

// ============================================================================
// Strategy Parser
// ============================================================================

// Valid strategy values
const VALID_STRATEGIES = ["comprehensive", "direct", "clinical"] as const;
export type UrlStrategyType = (typeof VALID_STRATEGIES)[number];

// Strategy parser with validation - defaults to 'comprehensive'
export const strategyParser = createParser({
  parse: (value: string): UrlStrategyType => {
    if (VALID_STRATEGIES.includes(value as UrlStrategyType)) {
      return value as UrlStrategyType;
    }
    return "comprehensive"; // Default for invalid values
  },
  serialize: (value: UrlStrategyType): string => value,
}).withDefault("comprehensive");

// ============================================================================
// Filters Parser
// ============================================================================

// Filters as comma-separated string
export const filtersParser = parseAsArrayOf(parseAsString, ",").withDefault([]);

// ============================================================================
// Search Options Parsers
// ============================================================================

// Per page (results per page)
export const perPageParser = parseAsInteger.withDefault(20);

// Sort by - relevance or date
const VALID_SORT = ["relevance", "date"] as const;
export type UrlSortType = (typeof VALID_SORT)[number];

export const sortByParser = createParser({
  parse: (value: string): UrlSortType => {
    if (VALID_SORT.includes(value as UrlSortType)) {
      return value as UrlSortType;
    }
    return "relevance";
  },
  serialize: (value: UrlSortType): string => value,
}).withDefault("relevance");

// ============================================================================
// URL Parameter Keys
// ============================================================================

// Short keys to keep URLs clean
export const URL_KEYS = {
  strategy: "s", // ?s=clinical
  filters: "f", // ?f=Humans,English,RCT
  perPage: "n", // ?n=50
  sortBy: "sort", // ?sort=date
} as const;
