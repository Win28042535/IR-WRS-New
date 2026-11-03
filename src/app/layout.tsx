import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans_Thai, Inter, Manrope, Sora, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { RealtimeSync } from "@/components/RealtimeSync";

// IBM Plex Sans Thai — the single UI typeface (Thai + Latin), matching the production WRS.
// Feeds --font-sans / --font-display in globals.css.
const plex = IBM_Plex_Sans_Thai({
  variable: "--font-plex",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Heading typefaces the flow recommends per Design Direction (FONT_PAIRINGS in flow2).
// Loaded so the type specimens render in the real font instead of falling back to
// system-ui. Not preloaded — the browser only fetches one once a specimen uses it.
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], preload: false });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], preload: false });
const spaceGrotesk = Space_Grotesk({ variable: "--font-space-grotesk", subsets: ["latin"], preload: false });
const sora = Sora({ variable: "--font-sora", subsets: ["latin"], preload: false });

export const metadata: Metadata = {
  title: "IR Plus · Website Requirement System",
  description: "Design Intelligence Platform & Collaborative Requirement Workspace",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${plex.variable} ${inter.variable} ${fraunces.variable} ${manrope.variable} ${spaceGrotesk.variable} ${sora.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-ir-bg text-ir-t1">
        <RealtimeSync />
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
