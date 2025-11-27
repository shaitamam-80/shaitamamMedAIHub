import { ErrorBoundary } from "@/components/error-boundary";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/auth-context";
import type { Metadata } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans } from "next/font/google";
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
        <AuthProvider>
          <div className="flex h-screen overflow-hidden">
            {/* Persistent Sidebar */}
            <AppSidebar />

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
              <ErrorBoundary>
                {children}
                <Toaster />
              </ErrorBoundary>
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
