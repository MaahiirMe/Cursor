import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { Rain } from "@/components/visual/MarqueeFrame";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <Rain />
      <Header />
      <main className="relative z-10 flex-1 px-3 py-4 sm:px-6">{children}</main>
      <Footer />
    </div>
  );
}
