// Design: Classified Aerospace Dossier — dark navy, cyan accents, JetBrains Mono data readouts
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

function CompareBar({ label, a, b, maxVal, unit }: {
  label: string; a: number; b: number; maxVal: number; unit?: string;
}) {
  const pctA = Math.min(100, Math.max(0, (Math.abs(a) / maxVal) * 100));
  const pctB = Math.min(100, Math.max(0, (Math.abs(b) / maxVal) * 100));
  return (
    <div className="grid gap-1">
      <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest">{label}</div>
      <div className="grid gap-0.5">
        <div className="flex items-center gap-2">
          <div className="w-12 text-[10px] font-mono text-right" style={{ color: "#22d3ee" }}>Mz=0</div>
          <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-sm" style={{ width: `${pctA}%`, background: "#22d3ee", opacity: 0.8 }} />
          </div>
          <div className="w-20 text-[10px] font-mono" style={{ color: "#22d3ee" }}>{fmt(a, 2)}{unit ? ` ${unit}` : ""}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 text-[10px] font-mono text-right" style={{ color: "#f59e0b" }}>Mz=2k</div>
          <div className="flex-1 h-3 rounded-sm overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="h-full rounded-sm" style={{ width: `${pctB}%`, background: "#f59e0b", opacity: 0.8 }} />
          </div>
          <div className="w-20 text-[10px] font-mono" style={{ color: "#f59e0b" }}>{fmt(b, 2)}{unit ? ` ${unit}` : ""}</div>
        </div>
      </div>
    </div>
  );
}

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
  if (!a || !b) return <div className="text-sm opacity-50 font-mono p-4 animate-pulse">Loading V2 comparison...</div>;

  const dy = Math.abs(b.final.y_m - a.final.y_m);
  const dvy = Math.abs(b.final.vy_mps - a.final.vy_mps);
  const mzTrackPct = (b.final.mz_est_nm / b.mz_nm_cmd) * 100;
  const decouplingProven = dy < 0.05 && dvy < 0.01;

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 uppercase tracking-widest">V2</span>
          <span className="text-sm font-semibold">Omni Slide + Independent Yaw Trim</span>
        </div>
        <div className="text-xs opacity-60 font-mono mt-1">
          Translation channel unchanged from V1. Yaw torque controlled independently via tangential flap component.
          Two SITL runs compared: Mz cmd = 0 vs Mz cmd = 2000 N·m — proving decoupling.
        </div>
      </div>

      <AllocatorKpiGrid
        kpis={[
          { title: "Mz tracking", value: `${fmt(mzTrackPct, 1)}%`, sub: `${fmt(b.final.mz_est_nm, 0)} / ${fmt(b.mz_nm_cmd, 0)} N·m`, accent: mzTrackPct > 95 ? "cyan" : "amber" },
          { title: "Ft tan RMS", value: fmt(b.final.ft_tan_rms, 2), sub: "tangential effort (Mz=2k)", accent: "amber" },
          { title: "\u0394Y (decoupling)", value: `${fmt(dy, 4)} m`, sub: "translation unchanged", accent: decouplingProven ? "cyan" : "amber" },
          { title: "Coupling", value: `${fmt(b.yaw_track_coupling_mean_abs_deg, 2)}\u00b0`, sub: "yaw\u2013track (Mz=2k)" },
        ]}
      />

      <div className="rounded-lg p-3 flex items-start gap-3" style={{
        background: decouplingProven ? "rgba(34,211,238,0.06)" : "rgba(245,158,11,0.06)",
        border: `1px solid ${decouplingProven ? "rgba(34,211,238,0.25)" : "rgba(245,158,11,0.25)"}`,
      }}>
        <span className="text-base mt-0.5">{decouplingProven ? "\u2713" : "\u26a0"}</span>
        <div>
          <div className="text-xs font-semibold font-mono" style={{ color: decouplingProven ? "#22d3ee" : "#f59e0b" }}>
            {decouplingProven ? "DECOUPLING PROVEN" : "DECOUPLING MARGINAL"}
          </div>
          <div className="text-[11px] font-mono opacity-60 mt-0.5">
            \u0394Y = {fmt(dy, 4)} m \u00b7 \u0394Vy = {fmt(dvy, 4)} m/s between Mz=0 and Mz=2000 N\u00b7m runs.
            Translation path is {decouplingProven ? "statistically identical" : "slightly perturbed"} while Mz tracks {fmt(mzTrackPct, 1)}% of command.
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-4 grid gap-4">
        <div className="text-[10px] font-mono uppercase tracking-widest opacity-50">Side-by-Side Comparison</div>
        <div className="grid gap-4">
          <CompareBar label="Mz estimated (N\u00b7m)" a={a.final.mz_est_nm} b={b.final.mz_est_nm} maxVal={2100} unit="N\u00b7m" />
          <CompareBar label="Ft tangential RMS" a={a.final.ft_tan_rms} b={b.final.ft_tan_rms} maxVal={25} />
          <CompareBar label="Alpha RMS (\u00b0)" a={a.final.alpha_deg_rms} b={b.final.alpha_deg_rms} maxVal={10} unit="\u00b0" />
          <CompareBar label="Y final (m)" a={a.final.y_m} b={b.final.y_m} maxVal={25} unit="m" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/10 bg-white/5 p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Mz cmd = 0 N\u00b7m</div>
          <div className="grid gap-1 text-xs font-mono">
            {([["Y final", `${fmt(a.final.y_m, 3)} m`], ["Vy", `${fmt(a.final.vy_mps, 3)} m/s`], ["Mz est", `${fmt(a.final.mz_est_nm, 1)} N\u00b7m`], ["Ft tan RMS", fmt(a.final.ft_tan_rms, 2)], ["Alpha RMS", `${fmt(a.final.alpha_deg_rms, 2)}\u00b0`], ["Coupling", `${fmt(a.yaw_track_coupling_mean_abs_deg, 2)}\u00b0`]] as [string,string][]).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="opacity-50">{k}</span><span style={{ color: "#22d3ee" }}>{v}</span></div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Mz cmd = 2000 N\u00b7m</div>
          <div className="grid gap-1 text-xs font-mono">
            {([["Y final", `${fmt(b.final.y_m, 3)} m`], ["Vy", `${fmt(b.final.vy_mps, 3)} m/s`], ["Mz est", `${fmt(b.final.mz_est_nm, 1)} N\u00b7m`], ["Ft tan RMS", fmt(b.final.ft_tan_rms, 2)], ["Alpha RMS", `${fmt(b.final.alpha_deg_rms, 2)}\u00b0`], ["Coupling", `${fmt(b.yaw_track_coupling_mean_abs_deg, 2)}\u00b0`]] as [string,string][]).map(([k, v]) => (
              <div key={k} className="flex justify-between"><span className="opacity-50">{k}</span><span style={{ color: "#f59e0b" }}>{v}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="text-[11px] opacity-50 font-mono border-t border-white/10 pt-3">
        SITL runs \u00b7 Mz tracking {fmt(mzTrackPct, 1)}% \u00b7 coupling ~{fmt(b.yaw_track_coupling_mean_abs_deg, 1)}\u00b0 (side-slip, not yaw rotation) \u2192 V3 adds step reversal
      </div>
    </div>
  );
}
