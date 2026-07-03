function toPath(values: number[], width: number, height: number, padding: number): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const innerWidth = width - padding * 2;
  const innerHeight = height - padding * 2;

  const points = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * innerWidth;
    const y = padding + innerHeight - ((v - min) / range) * innerHeight;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `M${points.join(" L")}`;
}

/** Compact inline trend line for a ticker tape row. Takes its color from `currentColor`, set by
 * the caller to the same up/down color as the adjacent ▲/▼ text — a redundant, not conflicting,
 * cue, since the arrow and number still carry the meaning without relying on color alone. */
export function TickerSparkline({ values, width = 72, height = 28 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) {
    return <svg width={width} height={height} aria-hidden />;
  }
  const path = toPath(values, width, height, 3);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Recent price trend">
      <path d={path} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
