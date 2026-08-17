import type { Metadata, Viewport } from "next";
import { Archivo_Black, Geist, IBM_Plex_Mono, Tiro_Devanagari_Hindi } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import "./globals.css";

const archivo = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo",
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

const tiro = Tiro_Devanagari_Hindi({
  weight: "400",
  subsets: ["devanagari", "latin"],
  variable: "--font-devanagari",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Beat Pehchaan — Pehchaan beat se.",
  description: "Lyrics ke bina gaana pehchaan ke dikha. Desi hip-hop beat guessing.",
  metadataBase: new URL("https://beatpehchaan.in"),
  openGraph: {
    title: "Beat Pehchaan",
    description: "2 sec. Pehchaan sakta hai?",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C0907",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="hi"
      className={`${archivo.variable} ${geist.variable} ${plex.variable} ${tiro.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-bg text-ink">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
