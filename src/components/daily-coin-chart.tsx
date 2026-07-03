import type { DailyCoinBucket } from "@/lib/analytics";

export function DailyCoinChart({ data }: { data: DailyCoinBucket[] }) {
  const max = Math.max(1, ...data.map((d) => d.earned));

  return (
    <div>
      <div className="flex h-32 gap-1" role="img" aria-label="Fin Coin earned per day over the last two weeks">
        {data.map((d, i) => (
          <div
            key={i}
            className="flex h-full flex-1 flex-col items-center justify-end gap-1"
            title={`${d.dateLabel}: ${d.earned} Fin Coin`}
          >
            <div
              className="w-full rounded-t bg-rich-gold"
              style={{ height: `${Math.max(2, (d.earned / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 text-[10px] text-foreground/40">
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center">
            {i % 2 === 0 ? d.dateLabel : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
