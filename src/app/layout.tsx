import type { Metadata } from 'next';
import './globals.css';
import { ReaderProvider } from '@/context/ReaderContext';

export const metadata: Metadata = {
  title: 'Readwise Reader — The First Read-It-Later App Built for Power Readers',
  description:
    'All your reading in one place: web articles, RSS feeds, email newsletters, PDFs, EPUBs, YouTube transcripts, and Ghostreader AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen antialiased selection:bg-blue-500/20">
        <ReaderProvider>{children}</ReaderProvider>
      </body>
    </html>
  );
}
