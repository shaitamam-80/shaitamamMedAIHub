"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  ClipboardCopy,
  Download,
  ExternalLink,
  Filter,
  Loader2,
  Search,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Types
import type {
  PubMedSearchResponseV2,
  PubMedArticle,
  PubMedAbstractResponse,
} from "@/lib/api";

interface SearchResultsScreenProps {
  searchResults: PubMedSearchResponseV2;
  currentQuery: string;
  onQueryChange: (query: string) => void;
  onSearch: (page?: number) => void;
  onBackToBuilder: () => void;
  onExport: (format: "medline" | "csv") => void;
  onContinueToReview: () => void;
  onViewAbstract: (article: PubMedArticle) => Promise<PubMedAbstractResponse>;
  onCopy: (text: string, label: string) => void;
  isSearching: boolean;
  isExporting: boolean;
  perPage: number;
  setPerPage: (value: number) => void;
}

// Study type badge styling - more distinct colors
const STUDY_TYPE_COLORS: Record<string, string> = {
  "Systematic Review": "bg-purple-100 text-purple-800 border-purple-300",
  "Meta-Analysis": "bg-violet-100 text-violet-800 border-violet-300",
  "Randomized Controlled Trial": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "Clinical Trial": "bg-green-100 text-green-800 border-green-300",
  "Review": "bg-blue-100 text-blue-800 border-blue-300",
  "Case Reports": "bg-amber-100 text-amber-800 border-amber-300",
  "Cohort Study": "bg-cyan-100 text-cyan-800 border-cyan-300",
  "Observational Study": "bg-teal-100 text-teal-800 border-teal-300",
  "Guideline": "bg-rose-100 text-rose-800 border-rose-300",
  "Editorial": "bg-slate-100 text-slate-700 border-slate-300",
  "Letter": "bg-gray-100 text-gray-700 border-gray-300",
  "Comment": "bg-gray-100 text-gray-600 border-gray-200",
};

const getStudyTypeBadgeStyle = (type: string) => {
  // Check for exact match first
  if (STUDY_TYPE_COLORS[type]) return STUDY_TYPE_COLORS[type];

  // Check for partial matches
  if (type.includes("Systematic")) return STUDY_TYPE_COLORS["Systematic Review"];
  if (type.includes("Meta")) return STUDY_TYPE_COLORS["Meta-Analysis"];
  if (type.includes("Randomized")) return STUDY_TYPE_COLORS["Randomized Controlled Trial"];
  if (type.includes("Clinical Trial")) return STUDY_TYPE_COLORS["Clinical Trial"];
  if (type.includes("Cohort")) return STUDY_TYPE_COLORS["Cohort Study"];
  if (type.includes("Observational")) return STUDY_TYPE_COLORS["Observational Study"];
  if (type.includes("Review")) return STUDY_TYPE_COLORS["Review"];
  if (type.includes("Guideline")) return STUDY_TYPE_COLORS["Guideline"];
  if (type.includes("Case")) return STUDY_TYPE_COLORS["Case Reports"];

  return "bg-gray-100 text-gray-700 border-gray-200";
};

// Sort configuration type
type SortField = "pmid" | "title" | "journal" | "year" | "authors";
type SortDirection = "asc" | "desc";

export function SearchResultsScreen({
  searchResults,
  currentQuery,
  onQueryChange,
  onSearch,
  onBackToBuilder,
  onExport,
  onContinueToReview,
  onViewAbstract,
  onCopy,
  isSearching,
  isExporting,
  perPage,
  setPerPage,
}: SearchResultsScreenProps) {
  // Local filter state
  const [filterText, setFilterText] = useState("");

  // Selection state
  const [selectedPmids, setSelectedPmids] = useState<Set<string>>(new Set());

  // Sorting state
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Expanded abstract state (accordion)
  const [expandedPmid, setExpandedPmid] = useState<string | null>(null);
  const [abstractCache, setAbstractCache] = useState<Record<string, string>>({});
  const [loadingAbstract, setLoadingAbstract] = useState<string | null>(null);

  // Handle abstract accordion toggle
  const handleToggleAbstract = async (article: PubMedArticle) => {
    const pmid = article.pmid;

    if (expandedPmid === pmid) {
      // Close accordion
      setExpandedPmid(null);
      return;
    }

    // Open accordion
    setExpandedPmid(pmid);

    // Load abstract if not cached
    if (!abstractCache[pmid]) {
      setLoadingAbstract(pmid);
      try {
        const abstractData = await onViewAbstract(article);
        setAbstractCache((prev) => ({
          ...prev,
          [pmid]: abstractData.abstract || "No abstract available",
        }));
      } catch {
        setAbstractCache((prev) => ({
          ...prev,
          [pmid]: "Failed to load abstract",
        }));
      } finally {
        setLoadingAbstract(null);
      }
    }
  };

  // Handle selection
  const handleSelectAll = () => {
    if (selectedPmids.size === filteredArticles.length) {
      setSelectedPmids(new Set());
    } else {
      setSelectedPmids(new Set(filteredArticles.map((a) => a.pmid)));
    }
  };

  const handleSelectOne = (pmid: string) => {
    const newSelection = new Set(selectedPmids);
    if (newSelection.has(pmid)) {
      newSelection.delete(pmid);
    } else {
      newSelection.add(pmid);
    }
    setSelectedPmids(newSelection);
  };

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter and sort articles
  const processedArticles = useMemo(() => {
    let articles = searchResults.articles;

    // Filter
    if (filterText) {
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(filterText.toLowerCase()) ||
          a.authors.toLowerCase().includes(filterText.toLowerCase()) ||
          a.journal.toLowerCase().includes(filterText.toLowerCase())
      );
    }

    // Sort
    if (sortField) {
      articles = [...articles].sort((a, b) => {
        let aVal: string | number = "";
        let bVal: string | number = "";

        switch (sortField) {
          case "pmid":
            aVal = parseInt(a.pmid);
            bVal = parseInt(b.pmid);
            break;
          case "title":
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          case "journal":
            aVal = a.journal.toLowerCase();
            bVal = b.journal.toLowerCase();
            break;
          case "year":
            aVal = a.pubdate?.split(" ")[0] || "";
            bVal = b.pubdate?.split(" ")[0] || "";
            break;
          case "authors":
            aVal = a.authors.toLowerCase();
            bVal = b.authors.toLowerCase();
            break;
        }

        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return articles;
  }, [searchResults.articles, filterText, sortField, sortDirection]);

  const filteredArticles = processedArticles;

  // Calculate pagination
  const startResult = (searchResults.page - 1) * perPage + 1;
  const endResult = Math.min(startResult + searchResults.returned - 1, searchResults.count);

  // Sortable header component
  const SortableHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className="flex items-center gap-1 hover:text-blue-600 transition-colors group"
    >
      {label}
      <span className="opacity-50 group-hover:opacity-100">
        {sortField === field ? (
          sortDirection === "asc" ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )
        ) : (
          <ArrowUpDown className="w-3 h-3" />
        )}
      </span>
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Advanced PubMed Search</h1>
        <p className="text-gray-500 mt-1">Enter or edit PubMed query to search for relevant articles</p>
      </div>

      {/* Search Section */}
      <Card className="shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <textarea
            value={currentQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            className="w-full h-28 p-4 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            placeholder="Enter your PubMed query..."
          />

          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => onSearch(1)}
              disabled={isSearching}
              className="flex-1 py-3 gap-2"
              size="lg"
            >
              {isSearching ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Search PubMed
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(currentQuery)}`,
                  "_blank"
                )
              }
              className="py-3 px-5 gap-2"
            >
              <ExternalLink className="w-5 h-5" />
              Open PubMed
            </Button>
            <Button
              variant="outline"
              onClick={onBackToBuilder}
              className="py-3 px-5 gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="shadow-sm border border-gray-200 overflow-hidden">
        {/* Results Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Search Results</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                <span className="font-semibold text-blue-600">
                  Found {searchResults.count.toLocaleString()} articles
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Page {searchResults.page} of {searchResults.total_pages}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={onContinueToReview}
                className="gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AI Analysis
              </Button>
              <Button
                variant="outline"
                onClick={() => onExport("csv")}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Filter */}
          <div className="relative mt-4">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Filter by title, journal, or author..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full sm:w-80 pl-10 bg-gray-50"
            />
          </div>
        </div>

        {/* Selection Info Bar */}
        {selectedPmids.size > 0 && (
          <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
            <span className="text-sm text-blue-700 font-medium">
              {selectedPmids.size} article(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const selected = filteredArticles.filter((a) =>
                    selectedPmids.has(a.pmid)
                  );
                  const citations = selected
                    .map(
                      (a) =>
                        `${a.title}\n${a.authors}\n${a.journal}, ${a.pubdate}\nPMID: ${a.pmid}`
                    )
                    .join("\n\n");
                  onCopy(citations, `${selected.length} citations`);
                }}
                className="h-7 text-xs gap-1"
              >
                <ClipboardCopy className="w-3 h-3" />
                Copy Selected
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedPmids(new Set())}
                className="h-7 text-xs"
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                  <Checkbox
                    checked={
                      filteredArticles.length > 0 &&
                      selectedPmids.size === filteredArticles.length
                    }
                    onCheckedChange={handleSelectAll}
                    className="mx-auto"
                  />
                </th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <SortableHeader field="pmid" label="PMID" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <SortableHeader field="title" label="Title" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <SortableHeader field="journal" label="Journal" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <SortableHeader field="year" label="Year" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  <SortableHeader field="authors" label="Authors" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Study Types
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-20">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredArticles.map((article, index) => (
                <React.Fragment key={article.pmid}>
                  {/* Main Row */}
                  <tr
                    className={cn(
                      "transition-colors cursor-pointer",
                      selectedPmids.has(article.pmid)
                        ? "bg-blue-50/50"
                        : "hover:bg-gray-50",
                      expandedPmid === article.pmid && "bg-blue-50/30"
                    )}
                    onClick={() => handleToggleAbstract(article)}
                  >
                    <td
                      className="px-3 py-3 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={selectedPmids.has(article.pmid)}
                        onCheckedChange={() => handleSelectOne(article.pmid)}
                      />
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-gray-400 font-mono">
                        {startResult + index}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:text-blue-800 font-mono text-sm font-medium hover:underline"
                      >
                        {article.pmid}
                      </a>
                    </td>
                    <td className="px-4 py-3 max-w-md">
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "transition-transform flex-shrink-0 mt-1",
                            expandedPmid === article.pmid && "rotate-90"
                          )}
                        >
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </span>
                        <span className="text-gray-900 font-medium text-sm line-clamp-2">
                          {article.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700 text-sm">{article.journal}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-700 text-sm font-medium">
                        {article.pubdate?.split(" ")[0] || article.pubdate}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-700 text-sm max-w-[120px] truncate">
                        {article.authors}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {article.pubtype?.slice(0, 2).map((type, i) => (
                          <span
                            key={i}
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full border",
                              getStudyTypeBadgeStyle(type)
                            )}
                          >
                            {type.length > 20 ? type.substring(0, 18) + "..." : type}
                          </span>
                        ))}
                        {article.pubtype && article.pubtype.length > 2 && (
                          <span className="text-xs text-gray-400">
                            +{article.pubtype.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            window.open(
                              `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
                              "_blank"
                            )
                          }
                          className="h-7 w-7 p-0"
                          title="View in PubMed"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Abstract Row (Accordion) */}
                  {expandedPmid === article.pmid && (
                    <tr className="bg-blue-50/20">
                      <td colSpan={9} className="px-6 py-4">
                        <div className="pl-8 pr-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                                Abstract
                              </h4>
                              {loadingAbstract === article.pmid ? (
                                <div className="flex items-center gap-2 text-gray-500 text-sm">
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Loading abstract...
                                </div>
                              ) : (
                                <p className="text-sm leading-relaxed text-gray-700">
                                  {abstractCache[article.pmid] || "No abstract available"}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  window.open(
                                    `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
                                    "_blank"
                                  )
                                }
                                className="h-8 text-xs gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                PubMed
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  onCopy(
                                    `${article.title}\n${article.authors}\n${article.journal}, ${article.pubdate}\nPMID: ${article.pmid}`,
                                    "Citation"
                                  )
                                }
                                className="h-8 text-xs gap-1"
                              >
                                <ClipboardCopy className="h-3 w-3" />
                                Copy
                              </Button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* No Results Message */}
        {filteredArticles.length === 0 && filterText && (
          <div className="py-12 text-center">
            <p className="text-gray-500">
              No articles match your filter. Try adjusting your search terms.
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {startResult}-{endResult}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
              {searchResults.count.toLocaleString()}
            </span>{" "}
            results
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSearch(searchResults.page - 1)}
              disabled={searchResults.page <= 1 || isSearching}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <Button
              size="sm"
              onClick={() => onSearch(searchResults.page + 1)}
              disabled={searchResults.page >= searchResults.total_pages || isSearching}
              className="gap-1"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Continue to Screening Card */}
      <Card className="shadow-sm border border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Ready to screen these articles?
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Continue to the Smart Screener for AI-powered abstract screening
              </p>
            </div>
            <Button
              onClick={onContinueToReview}
              size="lg"
              className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              <Sparkles className="w-5 h-5" />
              Start Smart Screening
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default SearchResultsScreen;
