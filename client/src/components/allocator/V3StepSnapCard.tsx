// Design: Classified Aerospace Dossier — dark navy, cyan accents, JetBrains Mono data readouts
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

function SnapTimeline({ m }: { m: SnapOut["step_metrics"] }) {
  const vStep = m.speed_at_step_mps ?? 2;
  const tStop = m.t_to_speed_below_thr_s ?? 0.6;
  const tRev = m.t_reversal_s ?? 0.9;
  const vEnd = m.speed_at_snap_end_mps ?? 0.09;
  const tEnd = Math.max(tStop, tRev) * 1.45;
  const W = 100; const H = 48; const pad = 8;
  const tw = W - pad * 2;
  const toX = (t: number) => pad + (t / tEnd) * tw;
  const vMax = vStep * 1.1; const vMin2 = -vStep * 0.45; const vRange = vMax - vMin2;
  const toY = (v: number) => H - pad - ((v - vMin2) / vRange) * (H - pad * 2);
  const pts: [number, number][] = [[0, vStep], [tStop * 0.65, vStep * 0.25], [tStop, vEnd], [tRev * 0.85, -vStep * 0.12], [tEnd, -vStep * 0.3]];
  const pathD = pts.map(([t, v], i) => `${i === 0 ? "M" : "L"} ${toX(t).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 120 }}>
      <line x1={pad} y1={toY(0)} x2={W - pad} y2={toY(0)} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      <path d={`${pathD} L ${toX(tEnd).toFixed(1)} ${toY(0).toFixed(1)} L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)} Z`} fill="rgba(245,158,11,0.07)" />
      <path d={pathD} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
      <line x1={toX(tStop)} y1={pad} x2={toX(tStop)} y2={H - pad} stroke="rgba(245,158,11,0.7)" strokeWidth="0.8" strokeDasharray="2,2" />
      <text x={toX(tStop) + 1} y={pad + 4} fill="#f59e0b" fontSize="3.5" fontFamily="monospace">t_stop={fmt(tStop, 2)}s</text>
      <line x1={toX(tRev)} y1={pad} x2={toX(tRev)} y2={H - pad} stroke="rgba(239,68,68,0.6)" strokeWidth="0.8" strokeDasharray="2,2" />
      <text x={toX(tRev) + 1} y={pad + 9} fill="#ef4444" fontSize="3.5" fontFamily="monospace">t_rev={fmt(tRev, 2)}s</text>
      <text x={toX(0) + 1} y={toY(vStep) - 2} fill="rgba(245,158,11,0.7)" fontSize="3" fontFamily="monospace">{fmt(vStep, 2)} m/s</text>
      <text x={pad} y={H - 1} fill="rgba(255,255,255,0.3)" fontSize="3" fontFamily="monospace">0</text>
      <text x={W - pad - 6} y={H - 1} fill="rgba(255,255,255,0.3)" fontSize="3" fontFamily="monospace">{fmt(tEnd, 1)}s</text>
    </svg>
  );
}

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
  if (!data) return <div className="text-sm opacity-50 font-mono p-4 animate-pulse">Loading V3 Step-Snap...</div>;
  const m = data.step_metrics;
  const stopPass = (m.t_to_speed_below_thr_s ?? 99) < 0.7;
  const distPass = (m.snap_stop_distance_m ?? 99) < 0.6;
  const couplingPass = (m.yaw_track_coupling_mean_abs_deg ?? 99) < 4.0;
  const residualPass = (m.speed_at_snap_end_mps ?? 99) < 0.15;
  return (
    <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 grid gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase tracking-widest">V3-SNAP</span>
        <div>
          <div className="text-sm font-semibold">Step-Snap — Aurora Signature Manoeuvre</div>
          <div className="text-xs opacity-60 font-mono mt-0.5">Full-speed approach, snap-stop, reverse — all without body yaw rotation. The defining Aurora capability.</div>
        </div>
      </div>
      <AllocatorKpiGrid
        kpis={[
          { title: "Stop time", value: `${fmt(m.t_to_speed_below_thr_s, 2)} s`, sub: "to ≤0.2 m/s", accent: stopPass ? "cyan" : "amber" },
          { title: "Stop dist", value: `${fmt(m.snap_stop_distance_m, 2)} m`, sub: "during snap", accent: distPass ? "cyan" : "amber" },
          { title: "Reverse", value: `${fmt(m.t_reversal_s, 2)} s`, sub: "to recede" },
          { title: "Snap end", value: `${fmt(m.speed_at_snap_end_mps, 2)} m/s`, sub: "residual speed" },
        ]}
      />
      <div className="rounded-lg border border-amber-500/20 bg-[#020817] p-3">
        <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Velocity Profile — Snap-Stop Sequence</div>
        <SnapTimeline m={m} />
        <div className="text-[9px] font-mono opacity-40 mt-1 flex gap-4">
          <span style={{ color: "#f59e0b" }}>— t_stop: speed below threshold</span>
          <span style={{ color: "#ef4444" }}>— t_reversal: moving away</span>
        </div>
      </div>
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 grid gap-1.5">
        <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-1">Gate Assessment</div>
        {[
          { label: "Stop time < 0.7 s", pass: stopPass, note: `${fmt(m.t_to_speed_below_thr_s, 2)} s` },
          { label: "Stop distance < 0.6 m", pass: distPass, note: `${fmt(m.snap_stop_distance_m, 2)} m` },
          { label: "Yaw coupling < 4°", pass: couplingPass, note: `${fmt(m.yaw_track_coupling_mean_abs_deg, 2)}°` },
          { label: "Residual speed < 0.15 m/s", pass: residualPass, note: `${fmt(m.speed_at_snap_end_mps, 2)} m/s` },
        ].map(({ label, pass, note }) => (
          <div key={label} className="flex items-center justify-between text-[10px] font-mono">
            <span className="opacity-60">{label}</span>
            <div className="flex items-center gap-2">
              <span style={{ color: "rgba(255,255,255,0.35)" }}>{note}</span>
              <span className="px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ fontSize: 8, background: pass ? "rgba(34,211,238,0.12)" : "rgba(245,158,11,0.12)", color: pass ? "#22d3ee" : "#f59e0b", border: `1px solid ${pass ? "rgba(34,211,238,0.3)" : "rgba(245,158,11,0.3)"}` }}>{pass ? "PASS" : "FAIL"}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-[11px] opacity-50 font-mono border-t border-amber-500/20 pt-3">
        SITL run · speed@step {fmt(m.speed_at_step_mps, 2)} m/s · align {fmt(m.t90_dir_s, 2)} s · coupling {fmt(m.yaw_track_coupling_mean_abs_deg, 2)}° · version {data.version}
      </div>
    </div>
  );
}
