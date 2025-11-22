import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { FileText, MessageSquare, Search, FolderOpen } from "lucide-react"

export default function Home() {
  return (
    <div className="container mx-auto px-6 py-12">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Welcome to MedAI Hub
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          AI-powered systematic literature review platform for medical researchers.
          Formulate research questions, generate PubMed queries, and screen abstracts with AI assistance.
        </p>
        <div className="mt-8">
          <Link href="/projects">
            <Button size="lg">
              <FolderOpen className="mr-2 h-5 w-5" />
              Get Started with Projects
            </Button>
          </Link>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Link href="/define">
          <Card className="h-full transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <MessageSquare className="h-6 w-6" />
              </div>
              <CardTitle>Define</CardTitle>
              <CardDescription>Research Question Formulator</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use AI chat to formulate your research question using frameworks like PICO, CoCoPop, PEO, and more.
                Dynamic forms adapt to your chosen framework.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/query">
          <Card className="h-full transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Search className="h-6 w-6" />
              </div>
              <CardTitle>Query</CardTitle>
              <CardDescription>PubMed Search Builder</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Convert your research question into optimized PubMed boolean search queries.
                Generate multiple query variations automatically.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/review">
          <Card className="h-full transition-all hover:shadow-lg">
            <CardHeader>
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <CardTitle>Review</CardTitle>
              <CardDescription>Literature Screening</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Upload MEDLINE files and use AI to batch analyze abstracts.
                Interactive data table for efficient screening and decision tracking.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Features Section */}
      <div className="mt-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Platform Features</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Dynamic Framework Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Support for multiple research frameworks: PICO, CoCoPop, PEO, SPIDER, SPICE, ECLIPSE, and FINER.
                Forms dynamically adapt based on your selected framework.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Powered by Google Gemini AI for intelligent conversation, query generation, and abstract screening.
                Get AI reasoning for every decision.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project-Based Workflow</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Organize your systematic reviews by project. All tools operate within project context
                for seamless workflow integration.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MEDLINE Parser</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Advanced parser for PubMed MEDLINE format files. Handles multi-line abstracts,
                metadata extraction, and bulk import.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
