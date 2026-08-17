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
                  ? "#C8FF00"
                  : "#FF4D3D"
                : "rgba(243,240,232,0.2)",
            }}
          />
        );
      })}
    </div>
  );
}
