"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Filter,
  Loader2,
  Play,
  Search,
  ClipboardCopy,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Import pagination component
import { ResultsPagination } from "./ResultsPagination";

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

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={onBackToBuilder} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Query Builder
        </Button>
        <h1 className="text-xl font-semibold">Search Results</h1>
      </div>

      {/* Query Editor Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Current Query
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={currentQuery}
            onChange={(e) => onQueryChange(e.target.value)}
            className="font-mono text-xs min-h-[100px] bg-slate-900 text-slate-100"
          />
          <div className="flex gap-3">
            <Button
              onClick={() => onSearch(1)}
              disabled={isSearching || !currentQuery}
              className="gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
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
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open in PubMed
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Summary */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <Check className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {searchResults.count.toLocaleString()} Articles Found
                </h3>
                <p className="text-sm text-muted-foreground">
                  Showing page {searchResults.page} of {searchResults.total_pages} (
                  {searchResults.returned} results)
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                onClick={() => onExport("medline")}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export MEDLINE
              </Button>
              <Button
                variant="outline"
                onClick={() => onExport("csv")}
                disabled={isExporting}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              <Button onClick={onContinueToReview} className="gap-2">
                <ArrowRight className="h-4 w-4" />
                Continue to Review
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Input */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter results by title, author, or journal..."
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          className="max-w-md"
        />
        {filterText && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilterText("")}
            className="text-xs"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Articles List */}
      <div className="grid gap-4">
        {filteredArticles.map((article) => (
          <Card
            key={article.pmid}
            className="hover:border-primary/50 transition-colors"
          >
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm leading-tight mb-2">
                    {article.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{article.authors}</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>{article.journal}</span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>{article.pubdate}</span>
                  </div>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      PMID: {article.pmid}
                    </Badge>
                    {article.pubtype?.slice(0, 2).map((type, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewAbstract(article)}
                    className="gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    Abstract
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
                    className="gap-1"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results Message */}
      {filteredArticles.length === 0 && filterText && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              No articles match your filter. Try adjusting your search terms.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <ResultsPagination
        currentPage={searchResults.page}
        totalPages={searchResults.total_pages}
        totalResults={searchResults.count}
        resultsPerPage={perPage}
        onPageChange={(page) => onSearch(page)}
        onResultsPerPageChange={(newPerPage) => {
          setPerPage(newPerPage);
          onSearch(1);
        }}
        isLoading={isSearching}
      />

      {/* Abstract Preview Dialog */}
      <Dialog
        open={!!selectedArticle}
        onOpenChange={() => setSelectedArticle(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg pr-8">
              {selectedArticle?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>{selectedArticle?.authors}</p>
              <p>
                {selectedArticle?.journal} | {selectedArticle?.pubdate}
              </p>
            </div>

            <div className="pt-2 border-t">
              <h4 className="font-medium mb-2">Abstract</h4>
              {isLoadingAbstract ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading abstract...
                </div>
              ) : (
                <p className="text-sm leading-relaxed">{abstractContent}</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
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
