import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        className="pointer-events-none absolute inset-2 z-30 hidden border-[10px] border-[#6b2414] shadow-[inset_0_0_0_3px_#f5c518] sm:block"
        aria-hidden
      />
      <Header />
      <main className="relative z-10 flex-1 px-1 sm:px-4">{children}</main>
      <Footer />
    </div>
  );
}
