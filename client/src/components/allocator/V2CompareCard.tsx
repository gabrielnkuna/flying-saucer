import * as React from "react";
import AllocatorKpiGrid from "@/components/AllocatorKpiGrid";
import { loadJson, fmt } from "@/lib/loadJson";

type DemoOut = {
  allocator_version: "v2";
  mz_nm_cmd: number;
  yaw_track_coupling_mean_abs_deg: number;
  final: {
    y_m: number;
    vy_mps: number;
    alpha_deg_rms: number;
    ft_tan_rms: number;
    mz_est_nm: number;
  };
};

export default function V2CompareCard({ urlMz0, urlMz2000 }: { urlMz0: string; urlMz2000: string }) {
  const [a, setA] = React.useState<DemoOut | null>(null);
  const [b, setB] = React.useState<DemoOut | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    Promise.all([loadJson<DemoOut>(urlMz0), loadJson<DemoOut>(urlMz2000)])
      .then(([aa, bb]) => { if (!alive) return; setA(aa); setB(bb); })
      .catch((e) => alive && setErr(e?.message ?? String(e)));
    return () => { alive = false; };
  }, [urlMz0, urlMz2000]);

  if (err) return <div className="text-sm text-red-400 font-mono p-4">V2 error: {err}</div>;
  if (!a || !b) return (
    <div className="text-sm opacity-50 font-mono p-4 animate-pulse">Loading V2 comparison…</div>
  );

  const dy = b.final.y_m - a.final.y_m;
  const dvy = b.final.vy_mps - a.final.vy_mps;

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 uppercase tracking-widest">V2</span>
          <span className="text-sm font-semibold">Omni Slide + Yaw Trim</span>
        </div>
        <div className="text-xs opacity-60 font-mono mt-1">
          Translation channel unchanged; yaw torque controlled independently via tangential flap component.
          Comparing Mz=0 vs Mz=2000 N·m command.
        </div>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Mz cmd = 0</div>
          <div className="grid gap-1 text-xs font-mono">
            <div className="flex justify-between"><span className="opacity-60">Y final</span><span className="text-cyan-400">{fmt(a.final.y_m, 3)} m</span></div>
            <div className="flex justify-between"><span className="opacity-60">Vy</span><span className="text-cyan-400">{fmt(a.final.vy_mps, 3)} m/s</span></div>
            <div className="flex justify-between"><span className="opacity-60">Mz est</span><span className="text-cyan-400">{fmt(a.final.mz_est_nm, 1)} N·m</span></div>
            <div className="flex justify-between"><span className="opacity-60">Ft RMS</span><span className="text-cyan-400">{fmt(a.final.ft_tan_rms, 2)}</span></div>
          </div>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Mz cmd = 2000 N·m</div>
          <div className="grid gap-1 text-xs font-mono">
            <div className="flex justify-between"><span className="opacity-60">Y final</span><span className="text-amber-400">{fmt(b.final.y_m, 3)} m</span></div>
            <div className="flex justify-between"><span className="opacity-60">Vy</span><span className="text-amber-400">{fmt(b.final.vy_mps, 3)} m/s</span></div>
            <div className="flex justify-between"><span className="opacity-60">Mz est</span><span className="text-amber-400">{fmt(b.final.mz_est_nm, 1)} N·m</span></div>
            <div className="flex justify-between"><span className="opacity-60">Ft RMS</span><span className="text-amber-400">{fmt(b.final.ft_tan_rms, 2)}</span></div>
          </div>
        </div>
      </div>

      <AllocatorKpiGrid
        kpis={[
          { title: "ΔY", value: `${fmt(dy, 4)} m`, sub: "translation unchanged" },
          { title: "ΔVy", value: `${fmt(dvy, 4)} m/s`, sub: "velocity unchanged" },
          { title: "Mz est", value: `${fmt(b.final.mz_est_nm, 1)} N·m`, sub: "with yaw trim ON", accent: "amber" },
          { title: "Ft RMS", value: fmt(b.final.ft_tan_rms, 1), sub: "tangential effort" },
        ]}
      />

      <div className="text-[11px] opacity-50 font-mono border-t border-white/10 pt-3">
        Coupling stays ~{fmt(b.yaw_track_coupling_mean_abs_deg, 1)}° (side-slip) while Mz tracks command.
      </div>
    </div>
  );
}
