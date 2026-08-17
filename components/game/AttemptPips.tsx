export function AttemptPips({
  max,
  used,
  lastCorrect,
}: {
  max: number;
  used: number;
  lastCorrect?: boolean;
}) {
  return (
    <div className="flex items-center gap-2" aria-label={`${Math.max(0, max - used)} attempts left`}>
      {Array.from({ length: max }, (_, i) => {
        const spent = i < used;
        return (
          <span
            key={i}
            className="h-2 w-7"
            style={{
              background: spent
                ? lastCorrect && i === used - 1
                  ? "#F5C518"
                  : "#FF3B30"
                : "rgba(246,239,227,0.2)",
            }}
          />
        );
      })}
    </div>
  );
}
