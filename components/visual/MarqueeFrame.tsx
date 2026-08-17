export function MarqueeFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto max-w-[520px] sm:max-w-[640px]">
      <div className="marquee-shell">
        <div className="bulbs" aria-hidden />
        {children}
      </div>
    </div>
  );
}

export function Rain() {
  return <div className="rain" aria-hidden />;
}
