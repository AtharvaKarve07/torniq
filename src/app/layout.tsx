import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Syne } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['400','500','600','700','800'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', weight: ['300','400','500','600'] });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400','500'] });

export const metadata: Metadata = {
  title: 'TornIQ — Torn.com Analytics',
  description: 'Market intelligence, attack recommendations, and trade scanning for Torn.com players.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${inter.variable} ${mono.variable}`}>
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
