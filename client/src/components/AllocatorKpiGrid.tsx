// Design: Classified Aerospace Dossier — dark navy, cyan accents, JetBrains Mono data readouts

export type Kpi = { title: string; value: string; sub?: string; accent?: "cyan" | "amber" | "red" };

export default function AllocatorKpiGrid({ kpis }: { kpis: Kpi[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((k) => (
        <div
          key={k.title}
          className="rounded-lg border border-white/10 bg-white/5 p-3 flex flex-col gap-1"
          style={{ borderColor: k.accent === "amber" ? "rgba(245,158,11,0.3)" : k.accent === "red" ? "rgba(239,68,68,0.3)" : undefined }}
        >
          <div className="text-[10px] uppercase tracking-widest opacity-60 font-mono">{k.title}</div>
          <div
            className="text-xl font-bold font-mono"
            style={{
              color: k.accent === "amber" ? "#f59e0b" : k.accent === "red" ? "#ef4444" : "#22d3ee",
            }}
          >
            {k.value}
          </div>
          {k.sub && <div className="text-[10px] opacity-50 font-mono">{k.sub}</div>}
        </div>
      ))}
    </div>
  );
}
