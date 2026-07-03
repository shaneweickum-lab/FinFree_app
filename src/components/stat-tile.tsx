export function StatTile({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="rounded-2xl border-2 border-royal-purple/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">{label}</p>
      <p className="mt-1 text-2xl font-bold text-royal-purple-dark">{value}</p>
      {sublabel && <p className="mt-0.5 text-xs text-foreground/50">{sublabel}</p>}
    </div>
  );
}
