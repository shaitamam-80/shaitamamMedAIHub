"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"

export default function QueryPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Query Tool</h1>
        <p className="text-muted-foreground">
          PubMed Search Query Generator
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Search className="h-6 w-6" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Generate optimized PubMed boolean search queries from your research question
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This tool will convert your framework data (from the Define tool) into
            effective PubMed search queries using AI. Features include:
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>Boolean search query generation</li>
            <li>MeSH term suggestions</li>
            <li>Field tag recommendations</li>
            <li>Query history and variations</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
