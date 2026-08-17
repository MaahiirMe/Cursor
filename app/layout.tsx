import type { Metadata, Viewport } from "next";
import { Anton, Geist, IBM_Plex_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const plex = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-plex",
  display: "swap",
});

const notoDev = Noto_Sans_Devanagari({
  weight: ["700", "900"],
  subsets: ["devanagari", "latin"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beat Pehchaan — Pehchaan beat se.",
  description: "2 second ka beat. Lyrics nahi. DHH pehchaan.",
  metadataBase: new URL("https://beatpehchaan.in"),
};

export const viewport: Viewport = {
  themeColor: "#0B0806",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="hi"
      className={`${anton.variable} ${geist.variable} ${plex.variable} ${notoDev.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-ink">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
