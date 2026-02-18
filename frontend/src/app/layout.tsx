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
  title: 'MedAI Hub',
  description: 'AI-powered medical research assistant',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${inter.variable}`}>
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
