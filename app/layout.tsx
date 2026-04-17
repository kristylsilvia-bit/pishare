import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PiShare — Fast file sharing from your Pi',
  description: 'Upload files and share them instantly. Powered by your Raspberry Pi.',
  openGraph: {
    title: 'PiShare',
    description: 'Share files from your own storage.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-[#080c14]">{children}</body>
    </html>
  );
}
