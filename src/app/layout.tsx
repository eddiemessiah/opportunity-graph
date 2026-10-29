import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif-display" });

export const metadata: Metadata = {
  title: "Opportunity Graph",
  description: "A personal AI that triages fellowships, grants and hackathons. Nemotron on Nebius Token Factory, research by Tavily.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${mono.variable} ${serif.variable} font-sans antialiased grain`}>
        <header className="border-b border-line/80 backdrop-blur sticky top-0 z-20 bg-ink/70">
          <div className="mx-auto max-w-7xl px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-accent shadow-[0_0_12px_#c6f432]" />
              <span className="font-serif text-xl tracking-tight">Opportunity <em>Graph</em></span>
            </Link>
            <nav className="flex gap-5 text-sm text-muted">
              <Link href="/" className="hover:text-white">Board</Link>
              <Link href="/profile" className="hover:text-white">Profile</Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mx-auto max-w-7xl px-5 py-10 text-xs text-muted">
          Built on NVIDIA Nemotron via Nebius Token Factory, research by Tavily. Human-in-the-loop: drafts are starting points, you decide what to submit.
        </footer>
      </body>
    </html>
  );
}
