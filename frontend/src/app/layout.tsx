import type { Metadata } from 'next';
import { Heebo, Inter } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['latin', 'hebrew'],
  variable: '--font-heebo',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SR Portal - Systematic Review Assistant',
  description: 'AI-powered systematic review research assistant',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${inter.variable}`}>
      <body className="font-sans antialiased bg-[#0a0e1a] text-[#f1f5f9] min-h-screen">
        {children}
      </body>
    </html>
  );
}
