"use client";

import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardCopy,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  Search,
  Sparkles,
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

// Study type badge styling
const getStudyTypeBadgeStyle = (type: string) => {
  if (type.includes("Systematic") || type.includes("Meta"))
    return "bg-indigo-100 text-indigo-700 border-indigo-200";
  if (type.includes("Randomized"))
    return "bg-blue-100 text-blue-700 border-blue-200";
  if (type.includes("Cohort") || type.includes("Observational"))
    return "bg-cyan-100 text-cyan-700 border-cyan-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

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

  // Abstract preview state
  const [selectedArticle, setSelectedArticle] = useState<PubMedArticle | null>(null);
  const [abstractContent, setAbstractContent] = useState<string>("");
  const [isLoadingAbstract, setIsLoadingAbstract] = useState(false);

  // Handle abstract view
  const handleViewAbstract = async (article: PubMedArticle) => {
    setSelectedArticle(article);
    setIsLoadingAbstract(true);
    setAbstractContent("");

    try {
      const abstractData = await onViewAbstract(article);
      setAbstractContent(abstractData.abstract || "No abstract available");
    } catch {
      setAbstractContent("Failed to load abstract");
    } finally {
      setIsLoadingAbstract(false);
    }
  };

  // Filter articles locally
  const filteredArticles = filterText
    ? searchResults.articles.filter(
        (a) =>
          a.title.toLowerCase().includes(filterText.toLowerCase()) ||
          a.authors.toLowerCase().includes(filterText.toLowerCase()) ||
          a.journal.toLowerCase().includes(filterText.toLowerCase())
      )
    : searchResults.articles;

  // Calculate pagination
  const startResult = (searchResults.page - 1) * perPage + 1;
  const endResult = Math.min(startResult + searchResults.returned - 1, searchResults.count);

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

        {/* Results Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  PMID
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Journal
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Authors
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Study Types
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredArticles.map((article) => (
                <tr
                  key={article.pmid}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 font-mono text-sm font-medium hover:underline"
                    >
                      {article.pmid}
                    </a>
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <div>
                      <button
                        onClick={() => handleViewAbstract(article)}
                        className="text-gray-900 font-semibold text-sm hover:text-blue-700 transition-colors line-clamp-2 text-left"
                      >
                        {article.title}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700 text-sm">{article.journal}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-700 text-sm font-medium">
                      {article.pubdate?.split(" ")[0] || article.pubdate}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-gray-700 text-sm max-w-[150px] truncate">
                      {article.authors}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {article.pubtype?.slice(0, 2).map((type, i) => (
                        <span
                          key={i}
                          className={cn(
                            "text-xs font-medium px-2 py-0.5 rounded border",
                            getStudyTypeBadgeStyle(type)
                          )}
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewAbstract(article)}
                        className="h-8 w-8 p-0"
                        title="View Abstract"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`,
                            "_blank"
                          )
                        }
                        className="h-8 w-8 p-0"
                        title="View in PubMed"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
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

      {/* Continue to Review Card */}
      <Card className="shadow-sm border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Ready to screen these articles?
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Continue to the Review tool to screen articles with AI assistance
              </p>
            </div>
            <Button
              onClick={onContinueToReview}
              size="lg"
              className="gap-2"
            >
              <ArrowRight className="w-5 h-5" />
              Continue to Review
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Abstract Preview Dialog */}
      <Dialog
        open={!!selectedArticle}
        onOpenChange={() => setSelectedArticle(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg pr-8 leading-tight">
              {selectedArticle?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="text-sm text-gray-500">
              <p className="font-medium text-gray-700">{selectedArticle?.authors}</p>
              <p>
                {selectedArticle?.journal} • {selectedArticle?.pubdate}
              </p>
              <p className="text-blue-600 font-mono text-xs mt-1">
                PMID: {selectedArticle?.pmid}
              </p>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold text-gray-900 mb-2">Abstract</h4>
              {isLoadingAbstract ? (
                <div className="flex items-center gap-2 text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading abstract...
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-gray-700">{abstractContent}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() =>
                  selectedArticle &&
                  window.open(
                    `https://pubmed.ncbi.nlm.nih.gov/${selectedArticle.pmid}/`,
                    "_blank"
                  )
                }
                className="gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View in PubMed
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  selectedArticle &&
                  onCopy(
                    `${selectedArticle.title}\n${selectedArticle.authors}\n${selectedArticle.journal}, ${selectedArticle.pubdate}\nPMID: ${selectedArticle.pmid}`,
                    "Citation"
                  )
                }
                className="gap-2"
              >
                <ClipboardCopy className="h-4 w-4" />
                Copy Citation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SearchResultsScreen;
