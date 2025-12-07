import { ErrorBoundary } from "@/components/error-boundary";
import { MobileNav } from "@/components/mobile-nav";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Source_Serif_4 } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
  style: ["normal", "italic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "MedAI Hub - AI-Powered Systematic Review Platform",
    template: "%s | MedAI Hub",
  },
  description:
    "Streamline your systematic literature review with AI. From research question to evidence synthesis - PICO frameworks, PubMed queries, and automated abstract screening.",
  keywords: [
    "systematic review",
    "literature review",
    "medical research",
    "PICO",
    "PubMed",
    "AI screening",
    "abstract screening",
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0e1a" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} ${sourceSerif.variable} font-sans antialiased`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg z-50 font-medium shadow-lg"
        >
          Skip to main content
        </a>
        <NuqsAdapter>
          <AuthProvider>
            <div className="flex h-screen overflow-hidden bg-background">
              {/* Desktop Sidebar */}
              <div className="hidden md:flex md:p-4">
                <AppSidebar />
              </div>

              {/* Main Content Area */}
              <main
                id="main-content"
                className="flex-1 overflow-y-auto md:p-4 md:pl-0"
              >
                <div className="min-h-full md:rounded-2xl md:bg-card/20 md:border md:border-border/30">
                  <ErrorBoundary>
                    {children}
                    <Toaster />
                  </ErrorBoundary>
                </div>
              </main>

              {/* Mobile Navigation */}
              <MobileNav />
            </div>
          </AuthProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
