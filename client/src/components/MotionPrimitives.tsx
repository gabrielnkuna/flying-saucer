/* =============================================================
   COMPONENT: MotionPrimitives
   Design: Classified Aerospace Dossier
   4 UFO motion primitives with animated demonstrations
   ============================================================= */
import { useState, useEffect, useRef } from "react";

const PRIMITIVES = [
  {
    id: "A",
    name: "Field Hover",
    desc: "Body nearly level with small vertical micro-corrections. Looks like stable levitation — no visible thrust source.",
    requirements: ["High-frequency thrust control (electric)", "Plenum smoothing (reduces wobble)", "Altitude hold loop"],
    color: "oklch(0.65 0.18 145)",
    accelG: "±0.05–0.10 g vertical",
  },
  {
    id: "B",
    name: "Flat Glide",
    desc: "Lateral movement while staying nearly flat — no aircraft-like pitching. The core UFO signature move.",
    requirements: ["Segmented vectoring ring", "Lateral fraction ≥ 0.10 g", "Level-first control priority"],
    color: "oklch(0.75 0.18 200)",
    accelG: "0.10–0.20 g sustained",
  },
  {
    id: "C",
    name: "Repulsion from Objects",
    desc: "Approaches a wall or structure and slides away as if hitting an invisible pressure cushion.",
    requirements: ["360° proximity sensing", "Synthetic potential field controller", "Vectoring ring (no tilt required)"],
    color: "oklch(0.72 0.16 80)",
    accelG: "0.15–0.25 g burst",
  },
  {
    id: "D",
    name: "Snap Stop",
    desc: "High deceleration with minimal tilt. Looks like inertia is being damped by space itself.",
    requirements: ["Burst power headroom", "Jerk-limited command shaping", "Smooth onset/offset profile"],
    color: "oklch(0.65 0.22 25)",
    accelG: "0.25–0.35 g decel",
  },
];

function MiniSaucer({ primitive, t }: { primitive: typeof PRIMITIVES[0]; t: number }) {
  const id = primitive.id;

  // Different animation per primitive
  let tx = 0, ty = 0, tilt = 0, glowScale = 1;

  if (id === "A") {
    ty = Math.sin(t * 0.8) * 6;
    tilt = Math.sin(t * 1.2) * 0.5;
    glowScale = 0.8 + Math.sin(t * 1.5) * 0.2;
  } else if (id === "B") {
    tx = Math.sin(t * 0.6) * 30;
    tilt = 0; // stays flat — that's the point
    glowScale = 0.9 + Math.abs(Math.sin(t * 0.6)) * 0.2;
  } else if (id === "C") {
    const phase = (t % 4) / 4;
    if (phase < 0.4) { tx = phase * 50; }
    else if (phase < 0.6) { tx = 20 - (phase - 0.4) * 100; }
    else { tx = 20 - (phase - 0.4) * 100; }
    tx = Math.max(-30, Math.min(30, tx));
    glowScale = 1 + Math.abs(Math.sin(t * 2)) * 0.3;
  } else if (id === "D") {
    const phase = (t % 5) / 5;
    if (phase < 0.3) { tx = phase * 100; }
    else if (phase < 0.55) { tx = 30 - (phase - 0.3) * 120; }
    else { tx = 0; }
    tx = Math.max(-35, Math.min(35, tx));
    tilt = 0; // snap stop — no tilt
  }

  const color = primitive.color;

  return (
    <svg viewBox="0 0 120 80" className="w-full" style={{ height: 80 }}>
      {/* Ground line */}
      <line x1={10} y1={68} x2={110} y2={68} stroke="oklch(0.25 0.015 240)" strokeWidth="1" />

      {/* Obstacle for primitive C */}
      {id === "C" && (
        <rect x={88} y={40} width={12} height={28} fill="oklch(0.20 0.018 240)" stroke="oklch(0.30 0.015 240)" strokeWidth="1" />
      )}

      {/* Saucer */}
      <g transform={`translate(${60 + tx}, ${30 + ty}) rotate(${tilt})`}>
        {/* Glow */}
        <ellipse cx={0} cy={8} rx={28 * glowScale} ry={6 * glowScale}
          fill={`${color.replace(')', ' / 0.08)')}`}
          style={{ filter: "blur(4px)" }}
        />
        {/* Upper dome */}
        <ellipse cx={0} cy={-4} rx={20} ry={8}
          fill="oklch(0.22 0.020 240)" stroke="oklch(0.32 0.015 240)" strokeWidth="1" />
        {/* Lower disc */}
        <ellipse cx={0} cy={2} rx={28} ry={5}
          fill="oklch(0.18 0.018 240)" stroke="oklch(0.28 0.015 240)" strokeWidth="1" />
        {/* Thrust ring */}
        <ellipse cx={0} cy={5} rx={26} ry={3}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.6 + Math.sin(t * 2) * 0.3}
        />
      </g>

      {/* Motion trail for B and D */}
      {(id === "B" || id === "D") && Math.abs(tx) > 5 && (
        <line
          x1={60 + tx - Math.sign(tx) * 20} y1={30 + ty}
          x2={60 + tx} y2={30 + ty}
          stroke={color} strokeWidth="1" opacity="0.3" strokeDasharray="3 3"
        />
      )}

      {/* Repulsion field bubble for C */}
      {id === "C" && (
        <ellipse cx={88} cy={52} rx={20 + Math.sin(t * 3) * 3} ry={18 + Math.sin(t * 3) * 2}
          fill="none"
          stroke={`${color.replace(')', ' / 0.25)')}`}
          strokeWidth="1"
          strokeDasharray="4 4"
        />
      )}
    </svg>
  );
}

export default function MotionPrimitives() {
  const [selected, setSelected] = useState<string>("B");
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    const loop = () => {
      setTick(Date.now() - startRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const t = tick / 1000;
  const active = PRIMITIVES.find(p => p.id === selected)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Primitive selector */}
      <div className="space-y-3">
        {PRIMITIVES.map(p => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className="w-full text-left rounded-sm p-4 transition-all"
            style={{
              background: selected === p.id ? `${p.color.replace(')', ' / 0.08)')}` : "oklch(0.14 0.020 240)",
              border: `1px solid ${selected === p.id ? p.color.replace(')', ' / 0.5)') : 'oklch(0.22 0.015 240)'}`,
            }}
          >
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-sm flex items-center justify-center"
                style={{ background: `${p.color.replace(')', ' / 0.15)')}`, border: `1px solid ${p.color.replace(')', ' / 0.4)')}` }}>
                <span style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 13, color: p.color }}>
                  {p.id}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ fontFamily: "'Rajdhani'", color: selected === p.id ? p.color : "oklch(0.80 0.005 240)", letterSpacing: "0.05em" }}>
                  {p.name}
                </div>
                <div className="label-caps mt-0.5">{p.accelG}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Detail panel */}
      <div className="bg-navy-surface panel-border rounded-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold" style={{ fontFamily: "'Rajdhani'", color: active.color, letterSpacing: "0.08em" }}>
            PRIMITIVE {active.id} — {active.name.toUpperCase()}
          </h3>
          <span className="data-value text-xs" style={{ color: active.color }}>{active.accelG}</span>
        </div>

        {/* Animation */}
        <div className="rounded-sm overflow-hidden" style={{ background: "oklch(0.11 0.022 240)", border: `1px solid oklch(0.20 0.015 240)` }}>
          <MiniSaucer primitive={active} t={t} />
        </div>

        <p className="text-sm leading-relaxed" style={{ color: "oklch(0.70 0.008 240)", fontFamily: "'Inter'" }}>
          {active.desc}
        </p>

        <div>
          <div className="label-caps mb-2">Design Requirements</div>
          <ul className="space-y-1.5">
            {active.requirements.map(req => (
              <li key={req} className="flex items-start gap-2">
                <span style={{ color: active.color, fontSize: 10, marginTop: 3 }}>▶</span>
                <span className="text-xs" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'" }}>{req}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
