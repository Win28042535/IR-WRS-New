import type { Metadata } from "next";
import { Fraunces, Inter, Manrope, Prompt, Sora, Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/Header";
import { RealtimeSync } from "@/components/RealtimeSync";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

// Prompt client-mode typeface (Thai + Latin, by Cadson Demak)
const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

// FC Minimal IR Plus brand display family (Thai + Latin)
const display = localFont({
  variable: "--font-display",
  src: [
    { path: "../fonts/FCMinimal-Regular.ttf", weight: "400", style: "normal" },
    { path: "../fonts/FCMinimal-Italic.ttf", weight: "400", style: "italic" },
    { path: "../fonts/FCMinimal-Bold.ttf", weight: "700", style: "normal" },
    { path: "../fonts/FCMinimal-BoldItalic.ttf", weight: "700", style: "italic" },
  ],
  display: "swap",
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
    <html lang="th" className={`${inter.variable} ${display.variable} ${prompt.variable} ${fraunces.variable} ${manrope.variable} ${spaceGrotesk.variable} ${sora.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-ir-bg text-ir-t1">
        <RealtimeSync />
        <Header />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
