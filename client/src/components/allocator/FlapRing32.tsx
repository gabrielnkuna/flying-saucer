// FlapRing32 — 32-segment flap angle ring visualiser
// Design: Classified Aerospace Dossier — dark navy, electric cyan accents
// Features: wedge thickness = |alpha|, sign tick (outer=+, inner=−),
//           optional ft_tan inner bars, segment labels 0–31, commanded force arrow

import * as React from "react";

type Props = {
  alphaDeg32: number[];       // length 32 — flap angles in degrees
  ftTan32?: number[];         // optional length 32 — tangential effort per segment
  fxCmd?: number;             // commanded force x (for arrow)
  fyCmd?: number;             // commanded force y (for arrow)
  size?: number;              // canvas size in px
  maxAlphaDeg?: number;       // max alpha for full-scale wedge (default 30)
  title?: string;
  showLabels?: boolean;
  showForceArrow?: boolean;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export default function FlapRing32({
  alphaDeg32,
  ftTan32,
  fxCmd = 0,
  fyCmd = 0,
  size = 320,
  maxAlphaDeg = 30,
  title = "Flap Ring (32)",
  showLabels = true,
  showForceArrow = true,
}: Props) {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, window.devicePixelRatio || 1);
    c.width = Math.floor(size * dpr);
    c.height = Math.floor(size * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const W = size;
    const H = size;
    const cx = W / 2;
    const cy = H / 2;

    // Clear with dark background
    ctx.fillStyle = "#020817";
    ctx.fillRect(0, 0, W, H);

    const rOuter = Math.min(W, H) * 0.42;
    const rInner = rOuter * 0.60;
    const rLabel = rOuter + 14;

    // Background ring guides
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = "#22d3ee";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Segment data
    const N = 32;
    const a = (alphaDeg32 || []).slice(0, N);
    while (a.length < N) a.push(0);

    const ft = (ftTan32 || []).slice(0, N);
    while (ft.length < N) ft.push(0);

    const ftAbsMax = ftTan32 && ftTan32.length
      ? Math.max(...ft.map((x) => Math.abs(x)), 1e-6)
      : 1;

    const gap = (Math.PI * 2) * 0.004;
    const segSpan = (Math.PI * 2) / N;

    for (let i = 0; i < N; i++) {
      const ang0 = i * segSpan - Math.PI / 2 + gap;
      const ang1 = (i + 1) * segSpan - Math.PI / 2 - gap;
      const mid = (ang0 + ang1) / 2;

      const alpha = a[i];
      const mag = clamp(Math.abs(alpha) / maxAlphaDeg, 0, 1);

      const r0 = rInner;
      const r1 = rInner + (rOuter - rInner) * (0.12 + 0.88 * mag);

      // Colour: positive = cyan, negative = amber
      const isPos = alpha >= 0;
      const baseColor = isPos ? `rgba(34,211,238,${0.15 + 0.75 * mag})` : `rgba(251,191,36,${0.15 + 0.75 * mag})`;

      // Draw wedge
      ctx.globalAlpha = 1.0;
      ctx.beginPath();
      ctx.moveTo(cx + r0 * Math.cos(ang0), cy + r0 * Math.sin(ang0));
      ctx.arc(cx, cy, r0, ang0, ang1);
      ctx.lineTo(cx + r1 * Math.cos(ang1), cy + r1 * Math.sin(ang1));
      ctx.arc(cx, cy, r1, ang1, ang0, true);
      ctx.closePath();
      ctx.fillStyle = baseColor;
      ctx.fill();

      // Wedge border
      ctx.strokeStyle = isPos ? "rgba(34,211,238,0.3)" : "rgba(251,191,36,0.3)";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Sign tick
      ctx.strokeStyle = isPos ? "rgba(34,211,238,0.8)" : "rgba(251,191,36,0.8)";
      ctx.lineWidth = 1.5;
      const rt0 = isPos ? r1 : r0;
      const rt1 = isPos ? r1 + 6 : r0 - 6;
      ctx.beginPath();
      ctx.moveTo(cx + rt0 * Math.cos(mid), cy + rt0 * Math.sin(mid));
      ctx.lineTo(cx + rt1 * Math.cos(mid), cy + rt1 * Math.sin(mid));
      ctx.stroke();

      // ft_tan inner bar
      if (ftTan32 && ftTan32.length) {
        const fmag = clamp(Math.abs(ft[i]) / ftAbsMax, 0, 1);
        const rr0 = rInner * 0.86;
        const rr1 = rr0 + 10 * fmag;
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(cx + rr0 * Math.cos(mid), cy + rr0 * Math.sin(mid));
        ctx.lineTo(cx + rr1 * Math.cos(mid), cy + rr1 * Math.sin(mid));
        ctx.stroke();
      }

      // Segment labels
      if (showLabels) {
        const lx = cx + rLabel * Math.cos(mid);
        const ly = cy + rLabel * Math.sin(mid);
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(mid + Math.PI / 2);
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = `${Math.max(7, Math.floor(size / 46))}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(String(i), 0, 0);
        ctx.restore();
      }
    }

    // Commanded force arrow in centre
    if (showForceArrow) {
      const fMag = Math.sqrt(fxCmd * fxCmd + fyCmd * fyCmd);
      if (fMag > 1e-6) {
        const arrowLen = rInner * 0.7 * clamp(fMag / 500, 0.1, 1);
        const ax = (fxCmd / fMag) * arrowLen;
        const ay = (fyCmd / fMag) * arrowLen;

        ctx.strokeStyle = "rgba(34,211,238,0.9)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + ax, cy + ay);
        ctx.stroke();

        // Arrowhead
        const headLen = 8;
        const angle = Math.atan2(ay, ax);
        ctx.beginPath();
        ctx.moveTo(cx + ax, cy + ay);
        ctx.lineTo(
          cx + ax - headLen * Math.cos(angle - Math.PI / 6),
          cy + ay - headLen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(cx + ax, cy + ay);
        ctx.lineTo(
          cx + ax - headLen * Math.cos(angle + Math.PI / 6),
          cy + ay - headLen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();

        // Force magnitude label
        ctx.fillStyle = "rgba(34,211,238,0.7)";
        ctx.font = `${Math.max(9, Math.floor(size / 36))}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${fMag.toFixed(0)} N`, cx, cy - rInner * 0.35);
      } else {
        // No force — show idle label
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.font = `${Math.max(9, Math.floor(size / 36))}px ui-monospace, monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("IDLE", cx, cy - rInner * 0.35);
      }
    }

    // Centre label
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = `${Math.max(9, Math.floor(size / 36))}px ui-monospace, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("32 flaps", cx, cy + rInner * 0.35);

    // Legend
    const legY = H - 14;
    ctx.font = `${Math.max(8, Math.floor(size / 42))}px ui-monospace, monospace`;
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(34,211,238,0.7)";
    ctx.fillText("+ deflect", 8, legY);
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(251,191,36,0.7)";
    ctx.fillText("− deflect", W - 8, legY);

  }, [alphaDeg32, ftTan32, fxCmd, fyCmd, size, maxAlphaDeg, showLabels, showForceArrow]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex flex-col">
      <div className="text-xs font-mono opacity-60 mb-2 uppercase tracking-widest">{title}</div>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size, display: "block" }}
      />
      <div className="text-[10px] font-mono opacity-40 mt-2 flex gap-3">
        <span>maxα = {maxAlphaDeg}°</span>
        <span>outer tick = +</span>
        <span>inner tick = −</span>
        {showForceArrow && <span>arrow = F_cmd</span>}
      </div>
    </div>
  );
}
