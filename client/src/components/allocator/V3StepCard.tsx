import * as React from "react";
import AllocatorKpiGrid from "@/components/AllocatorKpiGrid";
import { loadJson, fmt } from "@/lib/loadJson";

type StepOut = {
  version: string;
  step_metrics: {
    t90_dir_s: number | null;
    t_reversal_s: number | null;
    min_speed_transition_mps: number | null;
    peak_speed_mps: number | null;
    yaw_track_coupling_mean_abs_deg: number | null;
  };
};

export default function V3StepCard({ url }: { url: string }) {
  const [data, setData] = React.useState<StepOut | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    loadJson<StepOut>(url)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setErr(e?.message ?? String(e)));
    return () => { alive = false; };
  }, [url]);

  if (err) return <div className="text-sm text-red-400 font-mono p-4">V3 Step error: {err}</div>;
  if (!data) return (
    <div className="text-sm opacity-50 font-mono p-4 animate-pulse">Loading V3 Step…</div>
  );

  const m = data.step_metrics;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 grid gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 uppercase tracking-widest">V3</span>
        <div>
          <div className="text-sm font-semibold">Step Reversal — 0° → 180°</div>
          <div className="text-xs opacity-60 font-mono mt-0.5">Direction change without yaw rotation.</div>
        </div>
      </div>

      <AllocatorKpiGrid
        kpis={[
          { title: "Reversal", value: `${fmt(m.t_reversal_s, 2)} s`, sub: "to move back" },
          { title: "Align", value: `${fmt(m.t90_dir_s, 2)} s`, sub: "within ±20°" },
          { title: "Min speed", value: `${fmt(m.min_speed_transition_mps, 2)} m/s`, sub: "during transition" },
          { title: "Coupling", value: `${fmt(m.yaw_track_coupling_mean_abs_deg, 1)}°`, sub: "yaw–track" },
        ]}
      />

      <div className="text-[11px] opacity-50 font-mono border-t border-white/10 pt-3">
        Peak speed {fmt(m.peak_speed_mps, 2)} m/s · version {data.version}
      </div>
    </div>
  );
}
