interface Props {
  values: number[];
  dayHigh: number;
  dayLow: number;
  width?: number;
  height?: number;
}

const PAD_X = 8;
const PAD_Y = 16;

export function TickerDetailChart({ values, dayHigh, dayLow, width = 400, height = 140 }: Props) {
  if (values.length < 2) return null;

  const min = Math.min(dayLow, ...values);
  const max = Math.max(dayHigh, ...values);
  const range = max - min || 1;
  const innerWidth = width - PAD_X * 2;
  const innerHeight = height - PAD_Y * 2;

  const yFor = (v: number) => PAD_Y + innerHeight - ((v - min) / range) * innerHeight;

  const points = values.map((v, i) => {
    const x = PAD_X + (i / (values.length - 1)) * innerWidth;
    return `${x.toFixed(1)},${yFor(v).toFixed(1)}`;
  });
  const path = `M${points.join(" L")}`;
  const [lastX, lastY] = points[points.length - 1].split(",").map(Number);

  const highY = yFor(dayHigh);
  const lowY = yFor(dayLow);

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Price history with day high and low">
      <line x1={PAD_X} y1={highY} x2={width - PAD_X} y2={highY} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="4 3" />
      <text x={width - PAD_X} y={highY - 4} textAnchor="end" className="fill-foreground/50 text-[10px]">
        High ${dayHigh.toFixed(2)}
      </text>

      <line x1={PAD_X} y1={lowY} x2={width - PAD_X} y2={lowY} stroke="currentColor" strokeOpacity={0.25} strokeDasharray="4 3" />
      <text x={width - PAD_X} y={lowY + 12} textAnchor="end" className="fill-foreground/50 text-[10px]">
        Low ${dayLow.toFixed(2)}
      </text>

      <path d={path} fill="none" className="stroke-royal-purple" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={4} className="fill-royal-purple" />
    </svg>
  );
}
