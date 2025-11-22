"use client"

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { FileText } from "lucide-react"

export default function ReviewPage() {
  return (
    <div className="container mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Review Tool</h1>
        <p className="text-muted-foreground">
          Literature Screening & Abstract Analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>
            Upload MEDLINE files and use AI to screen abstracts for your systematic review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This tool will help you efficiently screen abstracts using AI assistance. Features include:
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-muted-foreground">
            <li>MEDLINE file upload and parsing</li>
            <li>AI-powered batch abstract screening</li>
            <li>Interactive data table for decision tracking</li>
            <li>Include/exclude decisions with AI reasoning</li>
            <li>Human override capabilities</li>
            <li>Export screening results</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
