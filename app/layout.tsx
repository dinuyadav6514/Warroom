import type { Metadata } from 'next';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'WARROOM // GLOBAL CONFLICT INTELLIGENCE TERMINAL',
  description: 'Near-real-time geopolitical conflict intelligence workstation monitoring armed conflict, military activity, and political violence.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-text-primary antialiased select-none selection:bg-accent-cyan/20 selection:text-accent-cyan">
        {children}
      </body>
    </html>
  );
}
