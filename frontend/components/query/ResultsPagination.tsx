"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface ResultsPaginationProps {
  currentPage: number;
  totalPages: number;
  totalResults: number;
  resultsPerPage: number;
  onPageChange: (page: number) => void;
  onResultsPerPageChange: (count: number) => void;
  isLoading?: boolean;
}

export function ResultsPagination({
  currentPage,
  totalPages,
  totalResults,
  resultsPerPage,
  onPageChange,
  onResultsPerPageChange,
  isLoading = false,
}: ResultsPaginationProps) {
  const [goToPage, setGoToPage] = React.useState("");

  // Calculate display range
  const startResult = (currentPage - 1) * resultsPerPage + 1;
  const endResult = Math.min(currentPage * resultsPerPage, totalResults);

  const handleGoToPage = () => {
    const pageNum = parseInt(goToPage, 10);
    if (pageNum >= 1 && pageNum <= totalPages) {
      onPageChange(pageNum);
      setGoToPage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleGoToPage();
    }
  };

  // Generate visible page numbers
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      // Show all pages if small number
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  if (totalResults === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
      {/* Results info and per-page selector */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          Showing <span className="font-medium text-foreground">{startResult}</span>
          {" - "}
          <span className="font-medium text-foreground">{endResult}</span>
          {" of "}
          <span className="font-medium text-foreground">{totalResults.toLocaleString()}</span>
          {" articles"}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-xs">Per page:</span>
          <Select
            value={resultsPerPage.toString()}
            onValueChange={(value) => onResultsPerPageChange(parseInt(value, 10))}
            disabled={isLoading}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center gap-1">
        {/* First page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
          title="First page"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          title="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {/* Page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getVisiblePages().map((page, index) =>
            page === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                ...
              </span>
            ) : (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="icon"
                className="h-8 w-8"
                onClick={() => onPageChange(page as number)}
                disabled={isLoading}
              >
                {page}
              </Button>
            )
          )}
        </div>

        {/* Mobile: show current/total */}
        <span className="sm:hidden text-sm px-2">
          Page {currentPage} of {totalPages}
        </span>

        {/* Next page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          title="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last page */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || isLoading}
          title="Last page"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>

        {/* Go to page */}
        <div className="hidden lg:flex items-center gap-2 ml-4">
          <span className="text-sm text-muted-foreground">Go to:</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={goToPage}
            onChange={(e) => setGoToPage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="h-8 w-16"
            placeholder="#"
            disabled={isLoading}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={handleGoToPage}
            disabled={isLoading || !goToPage}
          >
            Go
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ResultsPagination;
