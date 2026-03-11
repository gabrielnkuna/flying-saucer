// Design: Classified Aerospace Dossier — dark navy, cyan accents, JetBrains Mono data readouts
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

function StepTimeline({ m }: { m: StepOut["step_metrics"] }) {
  const tRev = m.t_reversal_s ?? 0;
  const t90 = m.t90_dir_s ?? 0;
  const vPeak = m.peak_speed_mps ?? 2;
  const vMin = m.min_speed_transition_mps ?? 0;
  const tEnd = Math.max(tRev, t90) * 1.35 + 0.05;
  const W = 100; const H = 48; const pad = 8;
  const tw = W - pad * 2;
  const toX = (t: number) => pad + (t / tEnd) * tw;
  const tPeak = tRev * 0.35; const tZero = tRev * 0.72;
  const vMax = vPeak * 1.1; const vMin2 = -vPeak * 0.65; const vRange = vMax - vMin2;
  const toY = (v: number) => H - pad - ((v - vMin2) / vRange) * (H - pad * 2);
  const pts: [number, number][] = [[0, 0], [tPeak, vPeak], [tZero, vMin], [tRev, -vPeak * 0.35], [tEnd, -vPeak * 0.55]];
  const pathD = pts.map(([t, v], i) => `${i === 0 ? "M" : "L"} ${toX(t).toFixed(1)} ${toY(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: 120 }}>
      <line x1={pad} y1={toY(0)} x2={W - pad} y2={toY(0)} stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      <path d={`${pathD} L ${toX(tEnd).toFixed(1)} ${toY(0).toFixed(1)} L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)} Z`} fill="rgba(34,211,238,0.08)" />
      <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="1.5" />
      <line x1={toX(tRev)} y1={pad} x2={toX(tRev)} y2={H - pad} stroke="rgba(245,158,11,0.6)" strokeWidth="0.8" strokeDasharray="2,2" />
      <text x={toX(tRev) + 1} y={pad + 4} fill="#f59e0b" fontSize="3.5" fontFamily="monospace">t_rev={fmt(tRev, 2)}s</text>
      <line x1={toX(t90)} y1={pad} x2={toX(t90)} y2={H - pad} stroke="rgba(34,211,238,0.5)" strokeWidth="0.8" strokeDasharray="2,2" />
      <text x={toX(t90) + 1} y={pad + 9} fill="#22d3ee" fontSize="3.5" fontFamily="monospace">t90={fmt(t90, 2)}s</text>
      <text x={toX(tPeak) + 1} y={toY(vPeak) - 2} fill="rgba(34,211,238,0.7)" fontSize="3" fontFamily="monospace">{fmt(vPeak, 2)} m/s</text>
      <text x={pad} y={H - 1} fill="rgba(255,255,255,0.3)" fontSize="3" fontFamily="monospace">0</text>
      <text x={W - pad - 6} y={H - 1} fill="rgba(255,255,255,0.3)" fontSize="3" fontFamily="monospace">{fmt(tEnd, 1)}s</text>
    </svg>
  );
}

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
  if (!data) return <div className="text-sm opacity-50 font-mono p-4 animate-pulse">Loading V3 Step...</div>;

  const m = data.step_metrics;
  const couplingPass = (m.yaw_track_coupling_mean_abs_deg ?? 99) < 4.0;
  const reversalPass = (m.t_reversal_s ?? 99) < 0.8;
  const alignPass = (m.t90_dir_s ?? 99) < 0.5;

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-4 grid gap-4">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 uppercase tracking-widest">V3</span>
        <div>
          <div className="text-sm font-semibold">Step Reversal — 0° to 180° without yaw rotation</div>
          <div className="text-xs opacity-60 font-mono mt-0.5">Craft accelerates to peak speed, then reverses direction in-place. No body rotation required.</div>
        </div>
      </div>

      <AllocatorKpiGrid
        kpis={[
          { title: "Reversal", value: `${fmt(m.t_reversal_s, 2)} s`, sub: "to move back", accent: reversalPass ? "cyan" : "amber" },
          { title: "Align", value: `${fmt(m.t90_dir_s, 2)} s`, sub: "within \u00b120\u00b0 of target", accent: alignPass ? "cyan" : "amber" },
          { title: "Min speed", value: `${fmt(m.min_speed_transition_mps, 2)} m/s`, sub: "during transition" },
          { title: "Coupling", value: `${fmt(m.yaw_track_coupling_mean_abs_deg, 2)}\u00b0`, sub: "yaw\u2013track", accent: couplingPass ? "cyan" : "amber" },
        ]}
      />

      <div className="rounded-lg border border-white/10 bg-[#020817] p-3">
        <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Velocity Profile \u2014 Step Reversal Sequence</div>
        <StepTimeline m={m} />
        <div className="text-[9px] font-mono opacity-40 mt-1 flex gap-4">
          <span style={{ color: "#f59e0b" }}>\u2014 t_reversal: direction flip point</span>
          <span style={{ color: "#22d3ee" }}>\u2014 t90: within \u00b120\u00b0 of new heading</span>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-3 grid gap-1.5">
        <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-1">Gate Assessment</div>
        {[
          { label: "Reversal time < 0.8 s", pass: reversalPass, note: `${fmt(m.t_reversal_s, 2)} s` },
          { label: "Align time < 0.5 s", pass: alignPass, note: `${fmt(m.t90_dir_s, 2)} s` },
          { label: "Yaw coupling < 4\u00b0", pass: couplingPass, note: `${fmt(m.yaw_track_coupling_mean_abs_deg, 2)}\u00b0` },
          { label: "Near-zero transition speed", pass: (m.min_speed_transition_mps ?? 99) < 0.15, note: `${fmt(m.min_speed_transition_mps, 2)} m/s` },
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

      <div className="text-[11px] opacity-50 font-mono border-t border-white/10 pt-3">
        SITL run \u00b7 peak speed {fmt(m.peak_speed_mps, 2)} m/s \u00b7 version {data.version} \u2192 V3-SNAP adds snap-stop capability
      </div>
    </div>
  );
}
