import * as React from "react";
import AllocatorKpiGrid from "@/components/AllocatorKpiGrid";
import { loadJson, fmt } from "@/lib/loadJson";

type SnapOut = {
  version: string;
  step_metrics: {
    speed_at_step_mps?: number | null;
    speed_at_snap_end_mps?: number | null;
    t_to_speed_below_thr_s: number | null;
    snap_stop_distance_m: number | null;
    t_reversal_s: number | null;
    t90_dir_s: number | null;
    yaw_track_coupling_mean_abs_deg: number | null;
  };
};

export default function V3StepSnapCard({ url }: { url: string }) {
  const [data, setData] = React.useState<SnapOut | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;
    loadJson<SnapOut>(url)
      .then((d) => alive && setData(d))
      .catch((e) => alive && setErr(e?.message ?? String(e)));
    return () => { alive = false; };
  }, [url]);

  if (err) return <div className="text-sm text-red-400 font-mono p-4">V3 Step-Snap error: {err}</div>;
  if (!data) return (
    <div className="text-sm opacity-50 font-mono p-4 animate-pulse">Loading V3 Step-Snap…</div>
  );

  const m = data.step_metrics;

  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 grid gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase tracking-widest">V3-SNAP</span>
        <div>
          <div className="text-sm font-semibold">Step-Snap — Stop &amp; Reverse</div>
          <div className="text-xs opacity-60 font-mono mt-0.5">Aurora signature: snap stop + reverse without yaw.</div>
        </div>
      </div>

      <AllocatorKpiGrid
        kpis={[
          { title: "Stop time", value: `${fmt(m.t_to_speed_below_thr_s, 2)} s`, sub: "to ≤0.2 m/s", accent: "amber" },
          { title: "Stop dist", value: `${fmt(m.snap_stop_distance_m, 2)} m`, sub: "during snap", accent: "amber" },
          { title: "Reverse", value: `${fmt(m.t_reversal_s, 2)} s`, sub: "to recede" },
          { title: "Snap end", value: `${fmt(m.speed_at_snap_end_mps, 2)} m/s`, sub: "residual speed" },
        ]}
      />

      <div className="text-[11px] opacity-50 font-mono border-t border-amber-500/20 pt-3">
        speed@step {fmt(m.speed_at_step_mps, 2)} m/s · align {fmt(m.t90_dir_s, 2)} s · coupling {fmt(m.yaw_track_coupling_mean_abs_deg, 1)}°
      </div>
    </div>
  );
}
