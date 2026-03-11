import * as React from "react";
import AllocatorKpiGrid from "@/components/AllocatorKpiGrid";
import FlapRing32 from "@/components/allocator/FlapRing32";
import FanRing16 from "@/components/allocator/FanRing16";
import { loadJson, fmt } from "@/lib/loadJson";
import { computeGateDHeadlineFromTrace, type TraceV4 } from "@/lib/gateDFromHist";

export default function V4RepelCard({ url, autoPlay = false }: { url: string; autoPlay?: boolean }) {
  const [trace, setTrace] = React.useState<TraceV4 | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [idx, setIdx] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const animRef = React.useRef<number | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    let alive = true;
    loadJson<TraceV4>(url)
      .then((d) => {
        if (!alive) return;
        setTrace(d);
        setIdx(0);
        if (autoPlay) {
          // Short delay so the canvas has time to render before playback starts
          setTimeout(() => { if (alive) setPlaying(true); }, 500);
        }
      })
      .catch((e) => alive && setErr(e?.message ?? String(e)));
    return () => { alive = false; };
  }, [url, autoPlay]);

  // Auto-play logic
  React.useEffect(() => {
    if (!playing || !trace) return;
    const N = trace.hist?.t?.length ?? 0;
    const step = () => {
      setIdx((prev) => {
        if (prev >= N - 1) { setPlaying(false); return prev; }
        return prev + 1;
      });
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [playing, trace]);

  const headline = React.useMemo(() => {
    if (!trace) return null;
    if (trace.headline && Object.keys(trace.headline).length > 0) {
      return { ...computeGateDHeadlineFromTrace(trace), ...trace.headline };
    }
    return computeGateDHeadlineFromTrace(trace);
  }, [trace]);

  // Canvas draw
  React.useEffect(() => {
    if (!trace?.hist || !trace?.meta || !canvasRef.current) return;
    const hist = trace.hist;
    const meta = trace.meta;
    const t = (hist.t ?? []).map(Number);
    const x = (hist.x ?? []).map(Number);
    const y = (hist.y ?? []).map(Number);
    const vx = (hist.vx ?? []).map(Number);
    const vy = (hist.vy ?? []).map(Number);
    const N = t.length;
    if (!N) return;

    const ox = Number(meta?.obstacle?.x_m ?? 0);
    const oy = Number(meta?.obstacle?.y_m ?? 0);
    const radius = Number(meta?.field?.radius_m ?? 0);

    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const rect = c.getBoundingClientRect();
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    c.width = Math.floor(rect.width * dpr);
    c.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = rect.width;
    const H = rect.height;
    const pad = 28;

    const allX = [...x, ox - radius, ox + radius];
    const allY = [...y, oy - radius, oy + radius];
    const minX = Math.min(...allX);
    const maxX = Math.max(...allX);
    const minY = Math.min(...allY);
    const maxY = Math.max(...allY);
    const spanX = Math.max(1e-6, maxX - minX);
    const spanY = Math.max(1e-6, maxY - minY);
    const s = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY);

    const toCanvas = (wx: number, wy: number): [number, number] => [
      pad + (wx - minX) * s,
      H - (pad + (wy - minY) * s),
    ];

    const i = Math.max(0, Math.min(N - 1, idx));

    // Background
    ctx.fillStyle = "rgba(2,8,23,0.95)";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let gx = Math.ceil(minX); gx <= Math.floor(maxX); gx++) {
      const [cx] = toCanvas(gx, minY);
      ctx.beginPath(); ctx.moveTo(cx, pad); ctx.lineTo(cx, H - pad); ctx.stroke();
    }
    for (let gy = Math.ceil(minY); gy <= Math.floor(maxY); gy++) {
      const [, cy] = toCanvas(minX, gy);
      ctx.beginPath(); ctx.moveTo(pad, cy); ctx.lineTo(W - pad, cy); ctx.stroke();
    }

    // Repel field outer ring (2× radius)
    const [ocx, ocy] = toCanvas(ox, oy);
    ctx.strokeStyle = "rgba(245,158,11,0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(ocx, ocy, radius * 2 * s, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Repel field inner radius ring
    ctx.strokeStyle = "rgba(245,158,11,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ocx, ocy, radius * s, 0, Math.PI * 2);
    ctx.stroke();

    // Obstacle
    ctx.fillStyle = "rgba(239,68,68,0.8)";
    ctx.beginPath();
    ctx.arc(ocx, ocy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(239,68,68,0.4)";
    ctx.font = "10px monospace";
    ctx.fillText("OBS", ocx + 10, ocy + 4);

    // Full path (faded)
    ctx.strokeStyle = "rgba(34,211,238,0.15)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let k = 0; k < N; k++) {
      const [cx, cy] = toCanvas(x[k], y[k]);
      if (k === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Traversed path (bright)
    ctx.strokeStyle = "rgba(34,211,238,0.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k <= i; k++) {
      const [cx, cy] = toCanvas(x[k], y[k]);
      if (k === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Craft marker
    const [px, py] = toCanvas(x[i], y[i]);
    ctx.strokeStyle = "#22d3ee";
    ctx.fillStyle = "rgba(34,211,238,0.2)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Velocity arrow
    const vScale = 20;
    const ax = px + vx[i] * vScale;
    const ay = py - vy[i] * vScale;
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    // Time label
    ctx.fillStyle = "rgba(34,211,238,0.6)";
    ctx.font = "11px monospace";
    ctx.fillText(`t = ${fmt(t[i], 2)} s`, pad, pad - 8);
  }, [trace, idx]);

  if (err) return <div className="text-sm text-red-400 font-mono p-4">V4 error: {err}</div>;
  if (!trace) return <div className="text-sm opacity-50 font-mono p-4 animate-pulse">Loading V4 repel trace…</div>;
  if (!headline) return <div className="text-sm opacity-50 font-mono p-4">Loaded trace — computing headline…</div>;

  const N = trace.hist?.t?.length ?? 0;
  const fanThrust16 = (trace.hist?.fan_thrust_16?.[idx] as number[] | undefined) ?? [];
  const alphaDeg32: number[] = (trace.hist?.alpha_deg_32 as number[][] | undefined)?.[idx] ?? [];
  const ftTan32: number[] | undefined = (trace.hist?.ft_tan_32 as number[][] | undefined)?.[idx];
  const fxCmd = (trace.hist?.fx_cmd as number[] | undefined)?.[idx] ?? 0;
  const fyCmd = (trace.hist?.fy_cmd as number[] | undefined)?.[idx] ?? 0;

  return (
    <div className="grid gap-4">
      <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 uppercase tracking-widest">V4</span>
          <span className="text-sm font-semibold">Repel Field — Gate-D Style</span>
        </div>
        <div className="text-xs opacity-60 font-mono mt-1">
          Synthetic repulsion field. Craft approaches obstacle; field deflects outward. Scrub or play the trajectory below.
        </div>
      </div>

      <AllocatorKpiGrid
        kpis={[
          { title: "Reaction", value: `${fmt(headline.response_latency_s, 2)} s`, sub: "response latency", accent: "cyan" },
          { title: "Reversal", value: `${fmt(headline.recede_latency_s, 2)} s`, sub: "to recede" },
          { title: "Kick", value: `${fmt(headline.a_rad_peak_mps2, 2)} m/s²`, sub: "peak outward accel", accent: "amber" },
          { title: "Away in", value: `${fmt(headline.t_to_vrad_away_0p5_s, 2)} s`, sub: "to +0.5 m/s away" },
        ]}
      />

      <div className="text-[11px] opacity-50 font-mono border-t border-white/10 pt-2">
        entry@ {fmt(headline.enter_radius_time_s, 2)}s · v_rad_enter {fmt(headline.v_rad_enter_mps, 2)} m/s · vmax {fmt(headline.repel_speed_mps_max, 2)} m/s · yaw–track {fmt(headline.yaw_track_coupling_mean_abs_deg, 1)}°
      </div>

      {/* Replay canvas + FlapRing32 — 2-column grid */}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-white/10 bg-[#020817] p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase tracking-widest opacity-60">Top-Down Replay</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setIdx(0); setPlaying(false); }}
                className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/10 hover:border-cyan-500/40 transition-colors"
              >RESET</button>
              <button
                onClick={() => { if (idx >= N - 1) setIdx(0); setPlaying((p) => !p); }}
                className="text-[10px] font-mono px-3 py-0.5 rounded border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10 transition-colors"
              >{playing ? "PAUSE" : "PLAY"}</button>
            </div>
          </div>
          <canvas ref={canvasRef} style={{ width: "100%", height: 280, display: "block" }} />
          <input
            className="w-full mt-3 accent-cyan-500"
            type="range"
            min={0}
            max={Math.max(0, N - 1)}
            value={idx}
            onChange={(e) => { setPlaying(false); setIdx(parseInt(e.target.value, 10)); }}
          />
          <div className="text-[10px] opacity-40 mt-1 font-mono flex justify-between">
            <span>frame {idx} / {Math.max(0, N - 1)}</span>
            <span>{N} samples · {fmt((N > 0 && trace.hist?.t ? Number(trace.hist.t[N-1]) : 0), 1)} s total</span>
          </div>
        </div>

        <div className="grid gap-3">
          <FanRing16
            fanThrust16={fanThrust16}
            size={320}
            title="Fan Ring (16) — current frame"
          />
          <FlapRing32
            alphaDeg32={alphaDeg32}
            ftTan32={ftTan32}
            fxCmd={fxCmd}
            fyCmd={fyCmd}
            size={320}
            maxAlphaDeg={30}
            title="Flap Ring (32) — current frame"
            showLabels={true}
            showForceArrow={true}
          />
        </div>
      </div>
    </div>
  );
}
