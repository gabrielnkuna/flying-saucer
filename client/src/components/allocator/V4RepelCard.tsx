import * as React from "react";
import AllocatorKpiGrid from "@/components/AllocatorKpiGrid";
import FlapRing32 from "@/components/allocator/FlapRing32";
import FanRing16 from "@/components/allocator/FanRing16";
import { loadJson, fmt } from "@/lib/loadJson";
import { computeGateDHeadlineFromTrace, type TraceV4 } from "@/lib/gateDFromHist";

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4] as const;
type SpeedOption = (typeof SPEED_OPTIONS)[number];

export default function V4RepelCard({ url, autoPlay = false }: { url: string; autoPlay?: boolean }) {
  const [trace, setTrace] = React.useState<TraceV4 | null>(null);
  const [err, setErr] = React.useState<string | null>(null);
  const [idx, setIdx] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);
  const [speed, setSpeed] = React.useState<SpeedOption>(1);
  const animRef = React.useRef<number | null>(null);
  const lastFrameTimeRef = React.useRef<number | null>(null);
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

  // Auto-play logic with speed control
  // We advance one frame every (dt / speed) ms, where dt is the simulation timestep.
  // For 600 frames at dt=0.05 s: 30 s of data → at 1× plays in 30 s, at 4× in 7.5 s.
  // We use requestAnimationFrame + elapsed time tracking instead of advancing every frame,
  // so the playback rate is independent of monitor refresh rate.
  React.useEffect(() => {
    if (!playing || !trace) return;
    const N = trace.hist?.t?.length ?? 0;
    const dt = (trace.meta as any)?.dt ?? 0.05; // simulation timestep in seconds
    const msPerFrame = (dt / speed) * 1000;     // real ms to wait between frames

    lastFrameTimeRef.current = null;

    const step = (timestamp: number) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = timestamp;
      }
      const elapsed = timestamp - lastFrameTimeRef.current;
      if (elapsed >= msPerFrame) {
        // Advance by however many frames fit in elapsed time
        const framesToAdvance = Math.max(1, Math.floor(elapsed / msPerFrame));
        lastFrameTimeRef.current = timestamp;
        setIdx((prev) => {
          const next = prev + framesToAdvance;
          if (next >= N - 1) {
            setPlaying(false);
            return N - 1;
          }
          return next;
        });
      }
      animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [playing, trace, speed]);

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

    // Support both single obstacle (legacy) and multi-obstacle (new schema)
    type ObsMeta = { label?: string; x_m: number; y_m: number; k?: number; radius?: number };
    const obstacles: ObsMeta[] = Array.isArray((meta as any)?.obstacles)
      ? (meta as any).obstacles
      : [{ label: "OBS", x_m: Number((meta as any)?.obstacle?.x_m ?? 0), y_m: Number((meta as any)?.obstacle?.y_m ?? 0) }];
    const radius = Number((meta as any)?.field?.radius_m ?? 28);
    const phases: { label: string; t_start: number; t_end: number; color: string }[] =
      (meta as any)?.phases ?? [];
    const faultWindows: Record<string, { t_start: number; t_end: number }> =
      (meta as any)?.fault?.fault_windows ?? {};

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
    const pad = 32;

    // Compute world bounds including all obstacles
    const allX = [...x, ...obstacles.map(o => o.x_m - radius), ...obstacles.map(o => o.x_m + radius)];
    const allY = [...y, ...obstacles.map(o => o.y_m - radius), ...obstacles.map(o => o.y_m + radius)];
    const minX = Math.min(...allX) - 2;
    const maxX = Math.max(...allX) + 2;
    const minY = Math.min(...allY) - 2;
    const maxY = Math.max(...allY) + 2;
    const spanX = Math.max(1e-6, maxX - minX);
    const spanY = Math.max(1e-6, maxY - minY);
    const s = Math.min((W - 2 * pad) / spanX, (H - 2 * pad) / spanY);

    const toCanvas = (wx: number, wy: number): [number, number] => [
      pad + (wx - minX) * s,
      H - (pad + (wy - minY) * s),
    ];

    const i = Math.max(0, Math.min(N - 1, idx));
    const curT = t[i];

    // Background
    ctx.fillStyle = "rgba(2,8,23,0.97)";
    ctx.fillRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.04)";
    ctx.lineWidth = 1;
    const gridStep = spanX > 60 ? 10 : 5;
    for (let gx = Math.ceil(minX / gridStep) * gridStep; gx <= maxX; gx += gridStep) {
      const [cx] = toCanvas(gx, minY);
      ctx.beginPath(); ctx.moveTo(cx, pad); ctx.lineTo(cx, H - pad); ctx.stroke();
    }
    for (let gy = Math.ceil(minY / gridStep) * gridStep; gy <= maxY; gy += gridStep) {
      const [, cy] = toCanvas(minX, gy);
      ctx.beginPath(); ctx.moveTo(pad, cy); ctx.lineTo(W - pad, cy); ctx.stroke();
    }

    // Draw all obstacles with their repulsion rings
    const obsColors = ["#ef4444", "#f59e0b", "#a78bfa", "#34d399"];
    obstacles.forEach((obs, oi) => {
      const [ocx, ocy] = toCanvas(obs.x_m, obs.y_m);
      const obsRadius = obs.radius ?? radius;
      const col = obsColors[oi % obsColors.length];
      // Soft zone ring (2× radius)
      ctx.strokeStyle = col.replace(")", "").replace("rgb", "rgba") + ",0.08)";
      const colRgba = (hex: string, a: number) => {
        const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
        return `rgba(${r},${g},${b},${a})`;
      };
      ctx.strokeStyle = colRgba(col, 0.12);
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.arc(ocx, ocy, obsRadius * 1.6 * s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      // Hard radius ring
      ctx.strokeStyle = colRgba(col, 0.55);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ocx, ocy, obsRadius * s, 0, Math.PI * 2);
      ctx.stroke();
      // Fill
      const grad = ctx.createRadialGradient(ocx, ocy, 0, ocx, ocy, 8);
      grad.addColorStop(0, colRgba(col, 0.9));
      grad.addColorStop(1, colRgba(col, 0.3));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(ocx, ocy, 7, 0, Math.PI * 2);
      ctx.fill();
      // Label
      ctx.fillStyle = colRgba(col, 0.7);
      ctx.font = "bold 9px monospace";
      ctx.fillText(obs.label ?? `OBS${oi+1}`, ocx + 10, ocy + 4);
    });

    // Draw phase-coloured full path segments
    if (phases.length > 0) {
      phases.forEach((ph) => {
        const startIdx = t.findIndex(tt => tt >= ph.t_start);
        const endIdx = t.findIndex(tt => tt >= ph.t_end);
        const si = Math.max(0, startIdx);
        const ei = Math.min(N - 1, endIdx < 0 ? N - 1 : endIdx);
        const colRgba = (hex: string, a: number) => {
          const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
          return `rgba(${r},${g},${b},${a})`;
        };
        ctx.strokeStyle = colRgba(ph.color, 0.18);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let k = si; k <= ei; k++) {
          const [cx, cy] = toCanvas(x[k], y[k]);
          if (k === si) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      });
    } else {
      // Fallback: single faded path
      ctx.strokeStyle = "rgba(34,211,238,0.12)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let k = 0; k < N; k++) {
        const [cx, cy] = toCanvas(x[k], y[k]);
        if (k === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    // Traversed path (bright, current phase colour)
    const curPhase = phases.find(ph => curT >= ph.t_start && curT < ph.t_end);
    const traversedColor = curPhase ? curPhase.color : "#22d3ee";
    const colRgbaFn = (hex: string, a: number) => {
      if (hex.startsWith("rgba") || hex.startsWith("rgb")) return hex;
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      return `rgba(${r},${g},${b},${a})`;
    };
    ctx.strokeStyle = colRgbaFn(traversedColor, 0.9);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let k = 0; k <= i; k++) {
      const [cx, cy] = toCanvas(x[k], y[k]);
      if (k === 0) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Fault window highlight on path
    Object.values(faultWindows).forEach((fw, fi) => {
      const fColors = ["rgba(239,68,68,0.6)", "rgba(245,158,11,0.6)"];
      const fsi = Math.max(0, t.findIndex(tt => tt >= fw.t_start));
      const fei = Math.min(i, t.findIndex(tt => tt >= fw.t_end) < 0 ? N-1 : t.findIndex(tt => tt >= fw.t_end));
      if (fsi >= fei) return;
      ctx.strokeStyle = fColors[fi % fColors.length];
      ctx.lineWidth = 3.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (let k = fsi; k <= fei; k++) {
        const [cx, cy] = toCanvas(x[k], y[k]);
        if (k === fsi) ctx.moveTo(cx, cy); else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Craft marker
    const [px, py] = toCanvas(x[i], y[i]);
    const craftColor = colRgbaFn(traversedColor, 1.0);
    ctx.strokeStyle = craftColor;
    ctx.fillStyle = colRgbaFn(traversedColor, 0.2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px, py, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Velocity arrow
    const vScale = Math.max(4, Math.min(20, 80 / Math.max(1, Math.sqrt(vx[i]**2 + vy[i]**2))));
    const ax = px + vx[i] * vScale;
    const ay = py - vy[i] * vScale;
    ctx.strokeStyle = craftColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(ax, ay);
    ctx.stroke();

    // Phase label
    const phLabel = curPhase ? curPhase.label : "";
    ctx.fillStyle = colRgbaFn(traversedColor, 0.75);
    ctx.font = "bold 10px monospace";
    ctx.fillText(`t = ${fmt(t[i], 2)} s  ${phLabel}`, pad, pad - 10);

    // Active fault label
    const activeFault = Object.entries(faultWindows).find(([, fw]) => curT >= fw.t_start && curT < fw.t_end);
    if (activeFault) {
      ctx.fillStyle = "rgba(239,68,68,0.85)";
      ctx.font = "bold 9px monospace";
      ctx.fillText(`⚡ FAULT: ${activeFault[0].replace(/_/g, " ")}`, pad, pad + 6);
    }
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
          <span className="text-sm font-semibold">Multi-Wall Complex Evasion — 5-Phase SITL</span>
        </div>
        <div className="text-xs opacity-60 font-mono mt-1">
          18 s run · 4 obstacles · 5 evasion phases: head-on approach → lateral snap past Wall A → S-curve corridor between Wall B &amp; C → snap-stop before Wall D → return glide.
          Fault injections: stuck flap #7 (t=7–8.4 s) and dead fan group 2 (t=12–13.6 s). Path colour changes per phase; dashed overlay marks fault windows.
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
            <div className="flex items-center gap-2">
              {/* Speed selector */}
              <div className="flex items-center gap-1">
                {SPEED_OPTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className="text-[9px] font-mono px-1.5 py-0.5 rounded transition-colors"
                    style={{
                      background: speed === s ? "rgba(34,211,238,0.20)" : "transparent",
                      border: `1px solid ${speed === s ? "rgba(34,211,238,0.50)" : "rgba(255,255,255,0.10)"}`,
                      color: speed === s ? "#22d3ee" : "rgba(255,255,255,0.40)",
                    }}
                  >{s}×</button>
                ))}
              </div>
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
