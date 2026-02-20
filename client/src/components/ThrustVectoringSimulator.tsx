/* =============================================================
   COMPONENT: ThrustVectoringSimulator
   Design: Classified Aerospace Dossier
   Joystick input → asymmetric fan throttle ring → saucer motion preview
   ============================================================= */
import { useState, useEffect, useRef, useCallback } from "react";

const FANS = 16;
const CRAFT_MASS = 800; // kg
const G = 9.81;
const BASE_THRUST = CRAFT_MASS * G; // N — hover thrust

// Compute per-fan throttle given a lateral command vector (dx, dy) in [-1,1]
// and a yaw rate command in [-1,1]
function computeFanThrottles(dx: number, dy: number, yaw: number): number[] {
  const throttles: number[] = [];
  for (let i = 0; i < FANS; i++) {
    const angle = (i / FANS) * 2 * Math.PI - Math.PI / 2;
    // Fan contribution to lateral force: cosine projection
    const lateralContrib = Math.cos(angle) * dx + Math.sin(angle) * dy;
    // Fan contribution to yaw torque: tangential (perpendicular)
    const yawContrib = -Math.sin(angle) * yaw * 0.5;
    // Base hover + vectoring delta
    const t = 1.0 + lateralContrib * 0.45 + yawContrib;
    throttles.push(Math.max(0.05, Math.min(1.8, t)));
  }
  return throttles;
}

function computeForces(dx: number, dy: number, throttles: number[]) {
  const totalThrust = throttles.reduce((s, t) => s + t, 0) / FANS * BASE_THRUST;
  const lateralX = dx * BASE_THRUST * 0.35;
  const lateralY = dy * BASE_THRUST * 0.35;
  const lateralMag = Math.sqrt(lateralX ** 2 + lateralY ** 2);
  const accelLat = lateralMag / CRAFT_MASS;
  const accelG = accelLat / G;
  const tiltAngle = Math.atan2(lateralMag, BASE_THRUST) * (180 / Math.PI);
  return { totalThrust, lateralMag, accelG, tiltAngle };
}

interface JoystickProps {
  value: { x: number; y: number };
  onChange: (v: { x: number; y: number }) => void;
  label: string;
  color: string;
}

function Joystick({ value, onChange, label, color }: JoystickProps) {
  const padRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const getXY = (e: MouseEvent | TouchEvent) => {
    const rect = padRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const r = rect.width / 2 - 8;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    let dx = (clientX - cx) / r;
    let dy = (clientY - cy) / r;
    const mag = Math.sqrt(dx ** 2 + dy ** 2);
    if (mag > 1) { dx /= mag; dy /= mag; }
    return { x: dx, y: dy };
  };

  const onDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    dragging.current = true;
    onChange(getXY(e.nativeEvent as MouseEvent | TouchEvent));
  }, [onChange]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      onChange(getXY(e));
    };
    const onUp = () => {
      if (dragging.current) {
        dragging.current = false;
        onChange({ x: 0, y: 0 });
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [onChange]);

  const r = 52;
  const knobX = value.x * (r - 10);
  const knobY = value.y * (r - 10);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="label-caps" style={{ color }}>{label}</div>
      <div
        ref={padRef}
        onMouseDown={onDown}
        onTouchStart={onDown}
        className="relative rounded-full select-none"
        style={{
          width: r * 2,
          height: r * 2,
          background: "oklch(0.12 0.022 240)",
          border: `1px solid ${color.replace(")", " / 0.4)")}`,
          boxShadow: `0 0 12px ${color.replace(")", " / 0.1)")}`,
          cursor: "crosshair",
          touchAction: "none",
        }}
      >
        {/* Crosshair lines */}
        <div style={{ position: "absolute", top: "50%", left: 4, right: 4, height: 1, background: `${color.replace(")", " / 0.15)")}`, transform: "translateY(-50%)" }} />
        <div style={{ position: "absolute", left: "50%", top: 4, bottom: 4, width: 1, background: `${color.replace(")", " / 0.15)")}`, transform: "translateX(-50%)" }} />
        {/* Center ring */}
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          width: 16, height: 16, borderRadius: "50%",
          border: `1px solid ${color.replace(")", " / 0.25)")}`,
          transform: "translate(-50%, -50%)",
        }} />
        {/* Knob */}
        <div style={{
          position: "absolute",
          top: "50%", left: "50%",
          width: 20, height: 20,
          borderRadius: "50%",
          background: color,
          boxShadow: `0 0 8px ${color}`,
          transform: `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`,
          transition: dragging.current ? "none" : "transform 0.15s ease-out",
          pointerEvents: "none",
        }} />
      </div>
      <div className="data-value text-xs" style={{ color: "oklch(0.55 0.015 240)" }}>
        {value.x >= 0 ? "+" : ""}{(value.x).toFixed(2)}, {value.y >= 0 ? "+" : ""}{(value.y).toFixed(2)}
      </div>
    </div>
  );
}

export default function ThrustVectoringSimulator() {
  const [lateral, setLateral] = useState({ x: 0, y: 0 });
  const [yaw, setYaw] = useState({ x: 0, y: 0 });
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
  const throttles = computeFanThrottles(lateral.x, lateral.y, yaw.x);
  const forces = computeForces(lateral.x, lateral.y, throttles);

  const cx = 140, cy = 140, ringR = 105;

  const getFanPos = (i: number) => {
    const angle = (i / FANS) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + ringR * Math.cos(angle), y: cy + ringR * Math.sin(angle), angle };
  };

  // Saucer tilt preview
  const tiltX = lateral.y * forces.tiltAngle * 0.4;
  const tiltY = -lateral.x * forces.tiltAngle * 0.4;

  // Determine motion mode label
  let modeLabel = "HOVER";
  let modeColor = "oklch(0.65 0.18 145)";
  const mag = Math.sqrt(lateral.x ** 2 + lateral.y ** 2);
  if (mag > 0.7) { modeLabel = "FLAT GLIDE"; modeColor = "oklch(0.75 0.18 200)"; }
  else if (mag > 0.3) { modeLabel = "DRIFT"; modeColor = "oklch(0.72 0.16 80)"; }
  else if (Math.abs(yaw.x) > 0.3) { modeLabel = "YAW TURN"; modeColor = "oklch(0.60 0.15 280)"; }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Fan ring diagram */}
      <div className="bg-navy-surface panel-border rounded-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="label-caps">Fan Throttle Ring — Live</div>
          <div className="flex items-center gap-2">
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: modeColor, boxShadow: `0 0 6px ${modeColor}` }} />
            <span className="data-value text-xs" style={{ color: modeColor }}>{modeLabel}</span>
          </div>
        </div>
        <svg viewBox="0 0 280 280" className="w-full max-w-xs mx-auto">
          <defs>
            <radialGradient id="tvs-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.18 0.018 240)" />
              <stop offset="100%" stopColor="oklch(0.11 0.022 240)" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={135} fill="url(#tvs-bg)" />
          <circle cx={cx} cy={cy} r={130} fill="none" stroke="oklch(0.22 0.015 240)" strokeWidth="1" />

          {/* Thrust direction arrow */}
          {mag > 0.05 && (
            <g>
              <defs>
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 Z" fill="oklch(0.75 0.18 200 / 0.7)" />
                </marker>
              </defs>
              <line
                x1={cx} y1={cy}
                x2={cx + lateral.x * 50} y2={cy + lateral.y * 50}
                stroke="oklch(0.75 0.18 200 / 0.7)"
                strokeWidth="2"
                markerEnd="url(#arrow)"
              />
            </g>
          )}

          {/* Yaw arc */}
          {Math.abs(yaw.x) > 0.05 && (
            <circle cx={cx} cy={cy} r={30}
              fill="none"
              stroke={`oklch(0.60 0.15 280 / ${Math.abs(yaw.x) * 0.6})`}
              strokeWidth="2"
              strokeDasharray={`${Math.abs(yaw.x) * 60} 200`}
            />
          )}

          {/* Fan modules */}
          {Array.from({ length: FANS }).map((_, i) => {
            const pos = getFanPos(i);
            const th = throttles[i];
            // Color: green=low, cyan=nominal, amber=high, red=burst
            const fanColor = th < 0.5
              ? "oklch(0.65 0.18 145)"
              : th < 1.1
              ? "oklch(0.75 0.18 200)"
              : th < 1.4
              ? "oklch(0.72 0.16 80)"
              : "oklch(0.65 0.22 25)";
            const r2 = 6 + th * 4;

            return (
              <g key={i}>
                {/* Glow */}
                <circle cx={pos.x} cy={pos.y} r={r2 + 4}
                  fill={`${fanColor.replace(")", " / 0.08)")}`}
                  style={{ filter: "blur(3px)" }}
                />
                {/* Fan body */}
                <circle cx={pos.x} cy={pos.y} r={r2}
                  fill={`${fanColor.replace(")", " / 0.15)")}`}
                  stroke={fanColor}
                  strokeWidth="1.5"
                />
                {/* Throttle bar (radial line from center) */}
                <line
                  x1={cx + (ringR - 18) * Math.cos(pos.angle)}
                  y1={cy + (ringR - 18) * Math.sin(pos.angle)}
                  x2={cx + (ringR - 18 + (th - 1) * 14) * Math.cos(pos.angle)}
                  y2={cy + (ringR - 18 + (th - 1) * 14) * Math.sin(pos.angle)}
                  stroke={fanColor}
                  strokeWidth="2"
                  opacity="0.7"
                />
                {/* Fan number */}
                <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                  style={{ fontFamily: "'JetBrains Mono'", fontSize: 6.5, fill: fanColor }}>
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* Saucer body preview (tilted) */}
          <g transform={`translate(${cx}, ${cy})`}>
            <ellipse cx={0} cy={0} rx={28} ry={10}
              fill="oklch(0.20 0.020 240)"
              stroke="oklch(0.35 0.015 240)"
              strokeWidth="1.5"
              transform={`rotate(${tiltY})`}
            />
            <ellipse cx={0} cy={-6} rx={18} ry={7}
              fill="oklch(0.25 0.020 240)"
              stroke="oklch(0.38 0.015 240)"
              strokeWidth="1"
              transform={`rotate(${tiltY})`}
            />
            {/* Thrust ring glow */}
            <ellipse cx={0} cy={2} rx={26} ry={4}
              fill="none"
              stroke={`oklch(0.75 0.18 200 / ${0.4 + Math.sin(t * 2) * 0.2})`}
              strokeWidth="2"
            />
          </g>

          {/* Throttle legend */}
          <g transform="translate(8, 248)">
            {[
              ["oklch(0.65 0.18 145)", "< 50%"],
              ["oklch(0.75 0.18 200)", "NOMINAL"],
              ["oklch(0.72 0.16 80)", "HIGH"],
              ["oklch(0.65 0.22 25)", "BURST"],
            ].map(([c, l], i) => (
              <g key={l} transform={`translate(${i * 60}, 0)`}>
                <circle cx={4} cy={4} r={4} fill={c} />
                <text x={11} y={8} style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: "oklch(0.45 0.015 240)" }}>{l}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      {/* Controls + readouts */}
      <div className="space-y-5">
        {/* Joysticks */}
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="label-caps mb-4">Input Controls</div>
          <div className="flex justify-around gap-4">
            <Joystick
              value={lateral}
              onChange={setLateral}
              label="LATERAL VECTOR"
              color="oklch(0.75 0.18 200)"
            />
            <Joystick
              value={yaw}
              onChange={(v) => setYaw({ x: v.x, y: 0 })}
              label="YAW RATE"
              color="oklch(0.60 0.15 280)"
            />
          </div>
          <p className="text-xs mt-4 text-center" style={{ color: "oklch(0.40 0.012 240)", fontFamily: "'Inter'" }}>
            Drag joysticks — release to snap back to hover
          </p>
        </div>

        {/* Force readouts */}
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="label-caps mb-3">Live Force Readout</div>
          <div className="space-y-0">
            {[
              { label: "Lateral Command", value: `${(mag * 100).toFixed(0)}%`, color: "oklch(0.75 0.18 200)" },
              { label: "Lateral Force", value: `${forces.lateralMag.toFixed(0)} N`, color: "oklch(0.75 0.18 200)" },
              { label: "Lateral Accel", value: `${forces.accelG.toFixed(3)} g`, color: forces.accelG > 0.25 ? "oklch(0.65 0.22 25)" : forces.accelG > 0.12 ? "oklch(0.72 0.16 80)" : "oklch(0.65 0.18 145)" },
              { label: "Body Tilt (apparent)", value: `${forces.tiltAngle.toFixed(1)}°`, color: forces.tiltAngle > 8 ? "oklch(0.65 0.22 25)" : "oklch(0.88 0.005 240)" },
              { label: "Total Thrust", value: `${forces.totalThrust.toFixed(0)} N`, color: "oklch(0.88 0.005 240)" },
              { label: "Yaw Rate Cmd", value: `${(Math.abs(yaw.x) * 100).toFixed(0)}%`, color: "oklch(0.60 0.15 280)" },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}>
                <span className="label-caps">{label}</span>
                <span className="data-value text-sm" style={{ color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tilt warning */}
        {forces.tiltAngle > 8 && (
          <div className="rounded-sm p-3" style={{ background: "oklch(0.65 0.22 25 / 0.08)", border: "1px solid oklch(0.65 0.22 25 / 0.4)" }}>
            <div className="label-caps" style={{ color: "oklch(0.65 0.22 25)" }}>⚠ UFO ILLUSION DEGRADED</div>
            <p className="text-xs mt-1" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'" }}>
              Tilt &gt; 8° becomes visible to observers. Reduce lateral command or increase thrust headroom to maintain the level-flight aesthetic.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
