/**
 * PubMed Query Parser
 * Parses PubMed query strings into visual blocks for the hybrid query editor
 */

export interface QueryTerm {
  id: string;
  value: string;
  type: "mesh" | "text" | "operator" | "filter" | "group";
  tag?: string; // [Mesh], [tiab], [lang], etc.
  original: string; // Original string for reconstruction
}

// Regex patterns for PubMed query parsing
const PATTERNS = {
  // Match quoted terms with tags: "term"[Mesh], "term"[tiab], etc.
  quotedWithTag: /"([^"]+)"\[([^\]]+)\]/g,
  // Match unquoted terms with tags: term[Mesh], humans[Mesh], English[lang]
  unquotedWithTag: /\b([A-Za-z0-9*\-\s]+)\[([^\]]+)\]/g,
  // Match operators
  operator: /\b(AND|OR|NOT)\b/g,
  // Match parentheses groups
  groupStart: /\(/g,
  groupEnd: /\)/g,
};

// Tag to type mapping
const TAG_TO_TYPE: Record<string, QueryTerm["type"]> = {
  mesh: "mesh",
  majr: "mesh",
  tiab: "text",
  ti: "text",
  ab: "text",
  tw: "text",
  au: "filter",
  lang: "filter",
  dp: "filter",
  pt: "filter",
  sb: "filter",
};

/**
 * Generate a unique ID for a term
 */
function generateId(): string {
  return `term-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Determine the type of a term based on its tag
 */
function getTypeFromTag(tag: string): QueryTerm["type"] {
  const normalizedTag = tag.toLowerCase();
  return TAG_TO_TYPE[normalizedTag] || "text";
}

/**
 * Parse a PubMed query string into visual blocks
 */
export function parseQuery(query: string): QueryTerm[] {
  if (!query || query.trim() === "") {
    return [];
  }

  const terms: QueryTerm[] = [];
  let remaining = query.trim();
  let position = 0;

  while (position < remaining.length) {
    // Skip whitespace
    while (position < remaining.length && /\s/.test(remaining[position])) {
      position++;
    }

    if (position >= remaining.length) break;

    // Check for parentheses
    if (remaining[position] === "(") {
      terms.push({
        id: generateId(),
        value: "(",
        type: "group",
        original: "(",
      });
      position++;
      continue;
    }

    if (remaining[position] === ")") {
      terms.push({
        id: generateId(),
        value: ")",
        type: "group",
        original: ")",
      });
      position++;
      continue;
    }

    // Check for operators (AND, OR, NOT)
    const operatorMatch = remaining.slice(position).match(/^(AND|OR|NOT)\b/i);
    if (operatorMatch) {
      terms.push({
        id: generateId(),
        value: operatorMatch[1].toUpperCase(),
        type: "operator",
        original: operatorMatch[1].toUpperCase(),
      });
      position += operatorMatch[1].length;
      continue;
    }

    // Check for quoted term with tag: "term"[Tag]
    const quotedMatch = remaining.slice(position).match(/^"([^"]+)"\[([^\]]+)\]/);
    if (quotedMatch) {
      const [fullMatch, value, tag] = quotedMatch;
      terms.push({
        id: generateId(),
        value: value,
        type: getTypeFromTag(tag),
        tag: `[${tag}]`,
        original: fullMatch,
      });
      position += fullMatch.length;
      continue;
    }

    // Check for unquoted term with tag: term[Tag]
    const unquotedMatch = remaining.slice(position).match(/^([A-Za-z0-9*\-]+)\[([^\]]+)\]/);
    if (unquotedMatch) {
      const [fullMatch, value, tag] = unquotedMatch;
      terms.push({
        id: generateId(),
        value: value,
        type: getTypeFromTag(tag),
        tag: `[${tag}]`,
        original: fullMatch,
      });
      position += fullMatch.length;
      continue;
    }

    // Check for quoted term without tag: "term"
    const quotedNoTagMatch = remaining.slice(position).match(/^"([^"]+)"/);
    if (quotedNoTagMatch) {
      const [fullMatch, value] = quotedNoTagMatch;
      terms.push({
        id: generateId(),
        value: value,
        type: "text",
        original: fullMatch,
      });
      position += fullMatch.length;
      continue;
    }

    // Check for filter patterns like: "last 5 years"[dp]
    const filterMatch = remaining.slice(position).match(/^"([^"]+)"\[([^\]]+)\]/);
    if (filterMatch) {
      const [fullMatch, value, tag] = filterMatch;
      terms.push({
        id: generateId(),
        value: value,
        type: "filter",
        tag: `[${tag}]`,
        original: fullMatch,
      });
      position += fullMatch.length;
      continue;
    }

    // Fallback: consume until next whitespace, operator, or special char
    const wordMatch = remaining.slice(position).match(/^[^\s()]+/);
    if (wordMatch) {
      const word = wordMatch[0];
      // Don't add empty or whitespace-only words
      if (word.trim()) {
        terms.push({
          id: generateId(),
          value: word,
          type: "text",
          original: word,
        });
      }
      position += word.length;
      continue;
    }

    // Safety: move forward if nothing matched
    position++;
  }

  return terms;
}

/**
 * Reconstruct query string from terms
 */
export function serializeTerms(terms: QueryTerm[]): string {
  return terms.map((t) => t.original).join(" ");
}

/**
 * Add a new term to the query
 */
export function addTerm(
  terms: QueryTerm[],
  value: string,
  type: "mesh" | "text",
  operator: "AND" | "OR" = "OR"
): QueryTerm[] {
  const newTerms = [...terms];

  // If there are existing terms, add an operator first
  if (newTerms.length > 0) {
    const lastTerm = newTerms[newTerms.length - 1];
    // Only add operator if last term isn't already an operator or opening paren
    if (lastTerm.type !== "operator" && lastTerm.value !== "(") {
      newTerms.push({
        id: generateId(),
        value: operator,
        type: "operator",
        original: operator,
      });
    }
  }

  // Create the new term
  const tag = type === "mesh" ? "[Mesh]" : "[tiab]";
  const original = `"${value}"${tag}`;

  newTerms.push({
    id: generateId(),
    value: value,
    type: type,
    tag: tag,
    original: original,
  });

  return newTerms;
}

/**
 * Remove a term by index
 */
export function removeTerm(terms: QueryTerm[], index: number): QueryTerm[] {
  const newTerms = [...terms];
  newTerms.splice(index, 1);

  // Clean up orphaned operators
  // If removal leaves an operator at the start, remove it
  while (newTerms.length > 0 && newTerms[0].type === "operator") {
    newTerms.shift();
  }

  // If removal leaves an operator at the end, remove it
  while (newTerms.length > 0 && newTerms[newTerms.length - 1].type === "operator") {
    newTerms.pop();
  }

  // Remove double operators
  for (let i = newTerms.length - 2; i >= 0; i--) {
    if (newTerms[i].type === "operator" && newTerms[i + 1].type === "operator") {
      newTerms.splice(i + 1, 1);
    }
  }

  return newTerms;
}

/**
 * Get display color class for term type (SCOUT/GEMS Design System)
 */
export function getTermColorClass(type: QueryTerm["type"]): string {
  switch (type) {
    case "mesh":
      return "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700 dark:hover:bg-blue-900/50";
    case "text":
      return "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700 dark:hover:bg-emerald-900/50";
    case "filter":
      return "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/50";
    case "operator":
      return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    case "group":
      return "bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700";
  }
}

/**
 * Validate query for common issues
 */
export function validateQuery(query: string): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Check for unbalanced parentheses
  let parenCount = 0;
  for (const char of query) {
    if (char === "(") parenCount++;
    if (char === ")") parenCount--;
    if (parenCount < 0) {
      warnings.push("Unbalanced parentheses: extra closing parenthesis");
      break;
    }
  }
  if (parenCount > 0) {
    warnings.push("Unbalanced parentheses: missing closing parenthesis");
  }

  // Check for empty quoted strings
  if (/""\[/.test(query)) {
    warnings.push("Empty quoted term detected");
  }

  // Check for missing operators between terms
  if (/"[^"]+"\[[^\]]+\]\s*"[^"]+"/.test(query)) {
    warnings.push("Missing operator between terms");
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
