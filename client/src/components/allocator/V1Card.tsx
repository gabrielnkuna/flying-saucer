// Design: Classified Aerospace Dossier — dark navy, cyan accents, JetBrains Mono data readouts
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

/** Draw a polar cosine flap-distribution ring for 32 segments */
function CosineRingCanvas({ dirDeg, alphaDegRms }: { dirDeg: number; alphaDegRms: number }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const W = c.offsetWidth || 200;
    const H = c.offsetHeight || 180;
    c.width = W * dpr;
    c.height = H * dpr;
    const ctx = c.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cx = W / 2, cy = H / 2;
    const outerR = Math.min(W, H) / 2 - 8;
    const innerR = outerR * 0.42;
    const N = 32;
    const dirRad = (dirDeg * Math.PI) / 180;

    // Background
    ctx.fillStyle = "rgba(2,8,23,0.0)";
    ctx.fillRect(0, 0, W, H);

    // Draw wedges
    for (let i = 0; i < N; i++) {
      const segAngle = (2 * Math.PI * i) / N;
      const midAngle = segAngle + Math.PI / N;
      const cos = Math.cos(midAngle - dirRad - Math.PI / 2);
      const alpha = Math.max(0, cos) * alphaDegRms * 1.6;
      const barLen = (alpha / 30) * (outerR - innerR);

      const startAngle = segAngle;
      const endAngle = segAngle + (2 * Math.PI) / N - 0.02;
      const r1 = innerR + barLen;

      const intensity = Math.max(0, cos);
      ctx.fillStyle = `rgba(${Math.round(34 + intensity * 160)},${Math.round(211 - intensity * 50)},${Math.round(238 - intensity * 50)},${0.25 + intensity * 0.65})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r1, startAngle - Math.PI / 2, endAngle - Math.PI / 2);
      ctx.arc(cx, cy, innerR, endAngle - Math.PI / 2, startAngle - Math.PI / 2, true);
      ctx.closePath();
      ctx.fill();
    }

    // Inner ring border
    ctx.strokeStyle = "rgba(34,211,238,0.18)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.stroke();

    // Direction arrow
    const arrowLen = innerR * 0.72;
    const ax = cx + Math.sin(dirRad) * arrowLen;
    const ay = cy - Math.cos(dirRad) * arrowLen;
    ctx.strokeStyle = "rgba(34,211,238,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ax, ay);
    ctx.stroke();
    const headLen = 8;
    const headAngle = 0.4;
    const angle = Math.atan2(ay - cy, ax - cx);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - headLen * Math.cos(angle - headAngle), ay - headLen * Math.sin(angle - headAngle));
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - headLen * Math.cos(angle + headAngle), ay - headLen * Math.sin(angle + headAngle));
    ctx.stroke();

    // Centre label
    ctx.fillStyle = "rgba(34,211,238,0.75)";
    ctx.font = `bold ${Math.round(W * 0.065)}px monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${dirDeg}°`, cx, cy);
  }, [dirDeg, alphaDegRms]);

  return <canvas ref={canvasRef} style={{ width: "100%", height: 180, display: "block" }} />;
}

/** Horizontal bar gauge */
function Gauge({ label, value, max, unit, warn }: {
  label: string; value: number; max: number; unit: string; warn?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const color = warn ? "#f59e0b" : "#22d3ee";
  return (
    <div className="grid gap-1">
      <div className="flex justify-between text-[10px] font-mono">
        <span style={{ color: "rgba(255,255,255,0.5)" }}>{label}</span>
        <span style={{ color }}>{fmt(value, 2)} {unit}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

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
  if (!data) return <div className="text-sm opacity-50 font-mono p-4 animate-pulse">Loading V1 telemetry…</div>;

  const couplingPass = data.yaw_track_coupling_mean_abs_deg < 3.0;
  const mzPass = data.final.mz_est_nm < 10;

  return (
    <div className="grid gap-4">
      {/* Header */}
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 uppercase tracking-widest">V1</span>
          <span className="text-sm font-semibold">Omni Slide — Baseline Cosine Allocator</span>
        </div>
        <div className="text-xs opacity-60 font-mono mt-1">
          Pure translation via cosine flap distribution. No yaw-trim channel. Residual Mz is uncontrolled —
          this run establishes the baseline coupling penalty that V2 eliminates.
        </div>
      </div>

      {/* KPI grid */}
      <AllocatorKpiGrid
        kpis={[
          { title: "Coupling", value: `${fmt(data.yaw_track_coupling_mean_abs_deg, 2)}°`, sub: "yaw–track offset", accent: couplingPass ? "cyan" : "amber" },
          { title: "Alpha RMS", value: `${fmt(data.final.alpha_deg_rms, 2)}°`, sub: "vector effort" },
          { title: "Mz residual", value: `${fmt(data.final.mz_est_nm, 1)} N·m`, sub: "uncontrolled yaw moment", accent: mzPass ? "cyan" : "amber" },
          { title: "Vy final", value: `${fmt(data.final.vy_mps, 2)} m/s`, sub: "lateral velocity" },
        ]}
      />

      {/* Two-column: polar diagram + gauges */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Polar cosine ring */}
        <div className="rounded-lg border border-white/10 bg-[#020817] p-3">
          <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">
            Cosine Flap Distribution — {data.dir_deg}° thrust heading
          </div>
          <CosineRingCanvas dirDeg={data.dir_deg} alphaDegRms={data.final.alpha_deg_rms} />
          <div className="text-[9px] font-mono opacity-40 mt-2 text-center">
            Wedge height ∝ cos(θ − dir) · α_rms · 32 segments · Arrow = thrust direction
          </div>
        </div>

        {/* Gauges + assessment */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-4 grid gap-4 content-start">
          <div className="text-[10px] font-mono uppercase tracking-widest opacity-50">Performance Gauges</div>
          <div className="grid gap-3">
            <Gauge label="Fxy command" value={data.fxy_n} max={500} unit="N" />
            <Gauge label="Alpha RMS" value={data.final.alpha_deg_rms} max={15} unit="°" />
            <Gauge label="Yaw coupling" value={data.yaw_track_coupling_mean_abs_deg} max={10} unit="°" warn={!couplingPass} />
            <Gauge label="Mz residual" value={data.final.mz_est_nm} max={100} unit="N·m" warn={!mzPass} />
          </div>

          {/* Gate assessment */}
          <div className="border-t border-white/10 pt-3 grid gap-1.5">
            <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-1">Gate Assessment</div>
            {[
              { label: "Translation accuracy", pass: true, note: `Y = ${fmt(data.final.y_m, 2)} m` },
              { label: "Yaw coupling < 3°", pass: couplingPass, note: `${fmt(data.yaw_track_coupling_mean_abs_deg, 2)}°` },
              { label: "Mz residual < 10 N·m", pass: mzPass, note: `${fmt(data.final.mz_est_nm, 1)} N·m` },
            ].map(({ label, pass, note }) => (
              <div key={label} className="flex items-center justify-between text-[10px] font-mono">
                <span className="opacity-60">{label}</span>
                <div className="flex items-center gap-2">
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>{note}</span>
                  <span className="px-1.5 py-0.5 rounded uppercase tracking-widest" style={{
                    fontSize: 8,
                    background: pass ? "rgba(34,211,238,0.12)" : "rgba(245,158,11,0.12)",
                    color: pass ? "#22d3ee" : "#f59e0b",
                    border: `1px solid ${pass ? "rgba(34,211,238,0.3)" : "rgba(245,158,11,0.3)"}`,
                  }}>{pass ? "PASS" : "FAIL"}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[11px] opacity-50 font-mono border-t border-white/10 pt-3">
        SITL run · dir {fmt(data.dir_deg, 0)}° · Fxy {fmt(data.fxy_n, 1)} N · Y final {fmt(data.final.y_m, 2)} m ·
        Mz residual {fmt(data.final.mz_est_nm, 1)} N·m (uncontrolled) → V2 adds independent yaw-trim channel
      </div>
    </div>
  );
}
