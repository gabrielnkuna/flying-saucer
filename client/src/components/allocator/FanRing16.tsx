import * as React from "react";

type Props = {
  fanThrust16: number[];  // length 16
  size?: number;          // px
  title?: string;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

export default function FanRing16({
  fanThrust16,
  size = 320,
  title = "Fan Ring (16)",
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

    ctx.clearRect(0, 0, W, H);

    const rOuter = Math.min(W, H) * 0.46;
    const rInner = rOuter * 0.68;

    // normalize relative to median (so “mostly constant” shows as near-uniform)
    const N = 16;
    const f = (fanThrust16 || []).slice(0, N);
    while (f.length < N) f.push(0);

    const sorted = f.slice().sort((a, b) => a - b);
    const med = sorted[Math.floor(sorted.length / 2)] || 1;
    const rel = f.map((v) => (med > 1e-9 ? v / med : 1));

    const gap = (Math.PI * 2) * 0.006;
    const segSpan = (Math.PI * 2) / N;

    // draw background donut
    ctx.strokeStyle = "rgba(255,255,255,0.20)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
    ctx.stroke();

    // draw each fan wedge; thickness indicates relative thrust vs median
    for (let i = 0; i < N; i++) {
      const ang0 = i * segSpan - Math.PI / 2 + gap;
      const ang1 = (i + 1) * segSpan - Math.PI / 2 - gap;

      // relative thrust visual
      const m = clamp(rel[i], 0.7, 1.3);          // clamp for readability
      const mag = clamp((m - 0.7) / (1.3 - 0.7), 0, 1); // 0..1

      const r0 = rInner;
      const r1 = rInner + (rOuter - rInner) * (0.25 + 0.75 * mag);

      // grayscale intensity: higher thrust -> darker
      const intensity = 0.2 + 0.8 * mag;
      const g = Math.floor(255 * (1 - intensity));
      ctx.fillStyle = `rgb(${g},${g},${g})`;

      ctx.beginPath();
      ctx.moveTo(cx + r0 * Math.cos(ang0), cy + r0 * Math.sin(ang0));
      ctx.arc(cx, cy, r0, ang0, ang1);
      ctx.lineTo(cx + r1 * Math.cos(ang1), cy + r1 * Math.sin(ang1));
      ctx.arc(cx, cy, r1, ang1, ang0, true);
      ctx.closePath();
      ctx.fill();

      // label tick (fan index)
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 1;
      const mid = (ang0 + ang1) / 2;
      ctx.beginPath();
      ctx.moveTo(cx + (rOuter + 4) * Math.cos(mid), cy + (rOuter + 4) * Math.sin(mid));
      ctx.lineTo(cx + (rOuter + 10) * Math.cos(mid), cy + (rOuter + 10) * Math.sin(mid));
      ctx.stroke();
    }

    // center label
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "12px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    ctx.textAlign = "center";
    ctx.fillText("16 fans", cx, cy + 4);

    // small legend
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
    ctx.fillText("thickness ~ thrust/median", cx, cy + 22);
  }, [fanThrust16, size]);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs opacity-70 mb-2">{title}</div>
      <canvas ref={canvasRef} style={{ width: size, height: size }} />
      <div className="text-xs opacity-60 mt-2 font-mono">
        normalized vs median (flat ring = constant fans)
      </div>
    </div>
  );
}
