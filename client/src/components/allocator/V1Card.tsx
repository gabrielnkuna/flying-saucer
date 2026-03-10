import * as React from "react";
import AllocatorKpiGrid from "@/components/AllocatorKpiGrid";
import { loadJson, fmt } from "@/lib/loadJson";

type DemoOut = {
  allocator_version: "v1";
  dir_deg: number;
  fxy_n: number;
  yaw_track_coupling_mean_abs_deg: number;
  final: {
    y_m: number;
    vy_mps: number;
    alpha_deg_rms: number;
    mz_est_nm: number;
  };
};

export default function V1Card({ url }: { url: string }) {
  const [data, setData] = React.useState<DemoOut | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    loadJson<DemoOut>(url)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setErr(e?.message ?? String(e)));
    return () => { alive = false; };
  }, [url]);

  if (err) return <div className="text-sm text-red-400 font-mono p-4">V1 error: {err}</div>;
  if (!data) return (
    <div className="text-sm opacity-50 font-mono p-4 animate-pulse">Loading V1 telemetry…</div>
  );

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 uppercase tracking-widest">V1</span>
          <span className="text-sm font-semibold">Omni Slide — Baseline</span>
        </div>
        <div className="text-xs opacity-60 font-mono mt-1">
          Pure translation via cosine flap distribution. No yaw-trim channel. Coupling is uncontrolled.
        </div>
      </div>

      <AllocatorKpiGrid
        kpis={[
          { title: "Coupling", value: `${fmt(data.yaw_track_coupling_mean_abs_deg, 1)}°`, sub: "yaw–track offset", accent: "amber" },
          { title: "Alpha RMS", value: `${fmt(data.final.alpha_deg_rms, 1)}°`, sub: "vector effort" },
          { title: "Mz est", value: fmt(data.final.mz_est_nm, 2), sub: "yaw moment (N·m)" },
          { title: "Vy final", value: `${fmt(data.final.vy_mps, 2)} m/s`, sub: "lateral velocity" },
        ]}
      />

      <div className="text-[11px] opacity-50 font-mono border-t border-white/10 pt-3">
        dir {fmt(data.dir_deg, 0)}° · Fxy {fmt(data.fxy_n, 1)} N · Y final {fmt(data.final.y_m, 2)} m
      </div>
    </div>
  );
}
