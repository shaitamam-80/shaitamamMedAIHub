import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Lightbulb,
  Search,
  ClipboardCheck,
  FolderOpen,
  Sparkles,
  Workflow,
  FileSearch,
  Home,
  LayoutGrid
} from "lucide-react"

export default function HomePage() {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-24">
      {/* Hero Section */}
      <main className="flex-grow px-4 pt-12 text-center">
        <h1 className="text-3xl font-bold leading-tight tracking-tight font-display md:text-4xl">
          Welcome to MedAI Hub
        </h1>
        <p className="text-muted-foreground text-base font-normal leading-normal pt-2 pb-8 max-w-xl mx-auto">
          Streamlining medical research from question to conclusion.
        </p>
        <div className="flex justify-center">
          <Link href="/projects">
            <Button className="w-full max-w-sm h-12 px-5 text-base font-bold gap-2">
              <FolderOpen className="h-5 w-5" />
              Get Started with Projects
            </Button>
          </Link>
        </div>
      </main>

      {/* Core Tools Section */}
      <section className="p-4 mt-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Define Tool */}
          <Link href="/define" className="group">
            <div className="flex flex-1 gap-4 rounded-lg border border-border bg-card/50 p-4 flex-col transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Lightbulb className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold leading-tight font-display group-hover:text-primary transition-colors">
                  Define
                </h2>
                <p className="text-muted-foreground text-sm font-normal leading-normal">
                  Formulate clear and concise research questions with structured guidance.
                </p>
              </div>
            </div>
          </Link>

          {/* Query Tool */}
          <Link href="/query" className="group">
            <div className="flex flex-1 gap-4 rounded-lg border border-border bg-card/50 p-4 flex-col transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold leading-tight font-display group-hover:text-primary transition-colors">
                  Query
                </h2>
                <p className="text-muted-foreground text-sm font-normal leading-normal">
                  Translate your questions into powerful, effective search strings for databases.
                </p>
              </div>
            </div>
          </Link>

          {/* Review Tool */}
          <Link href="/review" className="group">
            <div className="flex flex-1 gap-4 rounded-lg border border-border bg-card/50 p-4 flex-col transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ClipboardCheck className="h-6 w-6 text-primary" />
              </div>
              <div className="flex flex-col gap-1">
                <h2 className="text-base font-bold leading-tight font-display group-hover:text-primary transition-colors">
                  Review
                </h2>
                <p className="text-muted-foreground text-sm font-normal leading-normal">
                  Efficiently screen and analyze articles with AI-assisted review tools.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="px-4 mt-4">
        <h2 className="text-xl font-bold leading-tight tracking-tight px-0 pb-4 pt-5 font-display">
          Platform Features
        </h2>
        <div className="flex flex-col gap-5 md:grid md:grid-cols-2">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-card/30 border border-border/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <LayoutGrid className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold leading-tight font-display">Dynamic Framework Support</h3>
              <p className="text-muted-foreground text-sm font-normal leading-normal">
                Adapt your research methodology with flexible and dynamic framework options like PICO, CoCoPop, PEO, SPIDER, and more.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-card/30 border border-border/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold leading-tight font-display">AI-Powered Analysis</h3>
              <p className="text-muted-foreground text-sm font-normal leading-normal">
                Leverage machine learning to identify key themes, data, and insights from articles with Google Gemini AI.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-card/30 border border-border/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Workflow className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold leading-tight font-display">Project-Based Workflow</h3>
              <p className="text-muted-foreground text-sm font-normal leading-normal">
                Organize your research into distinct projects for better management and seamless collaboration.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-lg bg-card/30 border border-border/50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <FileSearch className="h-5 w-5 text-primary" />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-base font-bold leading-tight font-display">MEDLINE Parser</h3>
              <p className="text-muted-foreground text-sm font-normal leading-normal">
                Seamlessly import and parse citations and abstracts directly from PubMed MEDLINE format files.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Navigation Bar - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 border-t border-border bg-background/70 backdrop-blur-lg md:hidden">
        <div className="flex h-full items-center justify-around px-2">
          <Link href="/" className="flex flex-col items-center justify-center gap-1 text-primary">
            <Home className="h-6 w-6" style={{ fill: 'currentColor' }} />
            <span className="text-xs font-medium">Home</span>
          </Link>
          <Link href="/projects" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <FolderOpen className="h-6 w-6" />
            <span className="text-xs font-medium">Projects</span>
          </Link>
          <Link href="/define" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <Lightbulb className="h-6 w-6" />
            <span className="text-xs font-medium">Define</span>
          </Link>
          <Link href="/query" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <Search className="h-6 w-6" />
            <span className="text-xs font-medium">Query</span>
          </Link>
          <Link href="/review" className="flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-foreground transition-colors">
            <ClipboardCheck className="h-6 w-6" />
            <span className="text-xs font-medium">Review</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
