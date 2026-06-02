import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hermes — Web UI',
  description: 'Chat with and control your Hermes Agent.',
};

export const viewport: Viewport = {
  themeColor: '#070b16',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="antialiased">
      <body>{children}</body>
    </html>
  );
}
