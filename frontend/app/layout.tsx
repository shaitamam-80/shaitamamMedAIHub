import { ErrorBoundary } from "@/components/error-boundary";
import { MobileNav } from "@/components/mobile-nav";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "MedAI Hub - Systematic Literature Review Platform",
  description:
    "AI-powered systematic literature review platform for medical research",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.variable} ${jetbrainsMono.variable} font-sans`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded z-50"
        >
          Skip to main content
        </a>
        <NuqsAdapter>
          <AuthProvider>
            <div className="flex h-screen overflow-hidden bg-background p-0 md:p-4">
              {/* Floating Sidebar */}
              <div className="hidden md:flex">
                <AppSidebar />
              </div>

              {/* Main Content Area */}
              <main
                id="main-content"
                className="flex-1 overflow-y-auto md:ml-4 md:rounded-2xl md:bg-card/30"
              >
                <ErrorBoundary>
                  {children}
                  <Toaster />
                </ErrorBoundary>
              </main>
              <MobileNav />
            </div>
          </AuthProvider>
        </NuqsAdapter>
      </body>
    </html>
  );
}
