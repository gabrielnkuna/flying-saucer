/* =============================================================
   COMPONENT: WindDisturbanceSimulator
   Design: Classified Aerospace Dossier
   Wind vector input → control stack compensates fan throttles
   to maintain heading and position against crosswind.
   ============================================================= */
import { useState, useEffect, useRef, useMemo } from "react";

const FANS = 16;
const CRAFT_MASS = 800;
const G = 9.81;
const BASE_THRUST = (CRAFT_MASS * G) / FANS;
const FAN_RING_R = 3.5; // m

// Drag coefficient model: F_drag = 0.5 * rho * Cd * A * v^2
// Cd ≈ 0.4 for a disc, A ≈ π*(4)^2/4 ≈ 12.6 m²
const RHO = 1.225;
const CD = 0.4;
const DISC_AREA = Math.PI * 4 * 4 / 4;

function windForce(speedMs: number): number {
  return 0.5 * RHO * CD * DISC_AREA * speedMs * speedMs;
}

// Given wind vector (angle in degrees, speed in m/s),
// compute the per-fan throttle compensation needed to
// maintain position (null the wind force) and the residual
// drift if compensation is saturated.
function computeWindCompensation(windAngleDeg: number, windSpeedMs: number, hoverThrottle: number) {
  const windAngleRad = (windAngleDeg * Math.PI) / 180;
  const Fw = windForce(windSpeedMs); // N

  // Required lateral thrust to null wind
  const Fx = -Fw * Math.cos(windAngleRad); // N (x-axis)
  const Fy = -Fw * Math.sin(windAngleRad); // N (y-axis)

  const fans = Array.from({ length: FANS }, (_, i) => {
    const fanAngle = (i / FANS) * 2 * Math.PI - Math.PI / 2;
    // Each fan contributes to lateral force via vectoring vanes (max ±25°)
    // Effective lateral fraction: sin(25°) ≈ 0.42
    const lateralFraction = 0.42;
    const fanFx = BASE_THRUST * hoverThrottle * lateralFraction * Math.cos(fanAngle);
    const fanFy = BASE_THRUST * hoverThrottle * lateralFraction * Math.sin(fanAngle);

    // Throttle boost to compensate: project required force onto fan axis
    const projection = (Fx * Math.cos(fanAngle) + Fy * Math.sin(fanAngle));
    const boost = projection / (BASE_THRUST * hoverThrottle * lateralFraction + 0.001);
    const compensated = Math.min(1.6, Math.max(0.5, hoverThrottle + boost * 0.3));

    return { id: i + 1, angle: fanAngle, compensated, boost };
  });

  // Residual force after compensation (saturation)
  const actualFx = fans.reduce((s, f) => {
    const lat = BASE_THRUST * f.compensated * 0.42 * Math.cos(f.angle);
    return s + lat;
  }, 0);
  const actualFy = fans.reduce((s, f) => {
    const lat = BASE_THRUST * f.compensated * 0.42 * Math.sin(f.angle);
    return s + lat;
  }, 0);

  const residualFx = Fx + actualFx;
  const residualFy = Fy + actualFy;
  const residualForce = Math.sqrt(residualFx ** 2 + residualFy ** 2);
  const residualDrift = residualForce / CRAFT_MASS; // m/s²
  const compensationPct = Math.max(0, Math.min(100, (1 - residualForce / (Fw + 0.001)) * 100));

  return { fans, residualDrift, compensationPct, windForceN: Fw, requiredFx: Fx, requiredFy: Fy };
}

const WIND_PRESETS = [
  { label: "CALM", speed: 0, angle: 270 },
  { label: "BREEZE 5 m/s", speed: 5, angle: 270 },
  { label: "MODERATE 10 m/s", speed: 10, angle: 270 },
  { label: "STRONG 15 m/s", speed: 15, angle: 225 },
  { label: "GUST 20 m/s", speed: 20, angle: 315 },
];

const BEAUFORT = (v: number) => {
  if (v < 0.5) return "Calm";
  if (v < 1.6) return "Light air";
  if (v < 3.4) return "Light breeze";
  if (v < 5.5) return "Gentle breeze";
  if (v < 8.0) return "Moderate breeze";
  if (v < 10.8) return "Fresh breeze";
  if (v < 13.9) return "Strong breeze";
  if (v < 17.2) return "Near gale";
  if (v < 20.8) return "Gale";
  return "Strong gale";
};

export default function WindDisturbanceSimulator() {
  const [windSpeed, setWindSpeed] = useState(10);
  const [windAngle, setWindAngle] = useState(270); // degrees, 0=East, 90=North
  const [hoverThrottle, setHoverThrottle] = useState(0.75);
  const [activePreset, setActivePreset] = useState(2);
  const [isDragging, setIsDragging] = useState(false);
  const compassRef = useRef<SVGSVGElement>(null);
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const loop = () => { setTick(Date.now()); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const t = tick / 1000;

  const result = useMemo(() => computeWindCompensation(windAngle, windSpeed, hoverThrottle), [windAngle, windSpeed, hoverThrottle]);

  const cx = 150, cy = 150, ringR = 100;

  const getFanPos = (i: number) => {
    const angle = (i / FANS) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + ringR * Math.cos(angle), y: cy + ringR * Math.sin(angle), angle };
  };

  // Wind arrow direction
  const windRad = (windAngle * Math.PI) / 180;
  const windArrowLen = Math.min(60, windSpeed * 3);
  const windX = cx + windArrowLen * Math.cos(windRad);
  const windY = cy + windArrowLen * Math.sin(windRad);

  // Drift arrow (residual)
  const driftAngle = windRad; // simplified: drift in wind direction
  const driftLen = Math.min(40, result.residualDrift * 15);

  // Compass drag handler
  const handleCompassClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = compassRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - cx;
    const y = e.clientY - rect.top - cy;
    const angle = Math.atan2(y, x) * (180 / Math.PI);
    setWindAngle(((angle % 360) + 360) % 360);
    setActivePreset(-1);
  };

  const statusColor = result.compensationPct > 90 ? "oklch(0.65 0.18 145)"
    : result.compensationPct > 60 ? "oklch(0.72 0.16 80)"
    : "oklch(0.65 0.22 25)";

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="rounded-sm px-5 py-3 flex items-center justify-between" style={{
        background: `${statusColor.replace(")", " / 0.08)")}`,
        border: `1px solid ${statusColor.replace(")", " / 0.35)")}`,
      }}>
        <div>
          <div className="label-caps" style={{ color: statusColor }}>
            {result.compensationPct > 90 ? "✓ POSITION HOLD MAINTAINED"
              : result.compensationPct > 60 ? "⚠ PARTIAL COMPENSATION — SLOW DRIFT"
              : "⚠ COMPENSATION SATURATED — SIGNIFICANT DRIFT"}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.010 240)", fontFamily: "'Inter'" }}>
            Wind force: {result.windForceN.toFixed(0)} N · Compensation: {result.compensationPct.toFixed(0)}% · Residual drift: {result.residualDrift.toFixed(2)} m/s²
          </div>
        </div>
        <div className="label-caps" style={{ color: "oklch(0.45 0.015 240)" }}>{BEAUFORT(windSpeed)}</div>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-navy-surface panel-border rounded-sm p-5 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="label-caps">Wind Speed</div>
                <div className="data-value text-sm" style={{ color: "oklch(0.75 0.18 200)" }}>{windSpeed} m/s</div>
              </div>
              <input type="range" min={0} max={25} step={0.5} value={windSpeed}
                onChange={e => { setWindSpeed(parseFloat(e.target.value)); setActivePreset(-1); }}
                className="w-full" style={{ accentColor: "oklch(0.75 0.18 200)" }} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="label-caps">Hover Throttle</div>
                <div className="data-value text-sm" style={{ color: "oklch(0.72 0.16 80)" }}>{(hoverThrottle * 100).toFixed(0)}%</div>
              </div>
              <input type="range" min={0.5} max={1.0} step={0.01} value={hoverThrottle}
                onChange={e => setHoverThrottle(parseFloat(e.target.value))}
                className="w-full" style={{ accentColor: "oklch(0.72 0.16 80)" }} />
            </div>
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {WIND_PRESETS.map((p, i) => (
              <button key={p.label} onClick={() => { setWindSpeed(p.speed); setWindAngle(p.angle); setActivePreset(i); }}
                className="px-2 py-1.5 rounded-sm text-xs transition-all"
                style={{
                  fontFamily: "'JetBrains Mono'",
                  background: activePreset === i ? "oklch(0.75 0.18 200 / 0.15)" : "oklch(0.18 0.018 240)",
                  border: `1px solid ${activePreset === i ? "oklch(0.75 0.18 200 / 0.5)" : "oklch(0.25 0.015 240)"}`,
                  color: activePreset === i ? "oklch(0.75 0.18 200)" : "oklch(0.50 0.015 240)",
                }}>{p.label}</button>
            ))}
          </div>
        </div>

        <div className="bg-navy-surface panel-border rounded-sm p-4">
          <div className="label-caps mb-2">Wind Direction</div>
          <p className="text-xs mb-2" style={{ color: "oklch(0.40 0.012 240)", fontFamily: "'Inter'" }}>Click compass to set direction</p>
          <svg ref={compassRef} viewBox="0 0 80 80" className="w-full max-w-[80px] mx-auto cursor-crosshair" onClick={handleCompassClick}>
            <circle cx={40} cy={40} r={38} fill="oklch(0.12 0.018 240)" stroke="oklch(0.25 0.015 240)" strokeWidth="1" />
            {["N","E","S","W"].map((d, i) => {
              const a = (i / 4) * 2 * Math.PI - Math.PI / 2;
              return <text key={d} x={40 + 28 * Math.cos(a)} y={40 + 28 * Math.sin(a) + 3}
                textAnchor="middle" style={{ fontFamily: "'JetBrains Mono'", fontSize: 8, fill: "oklch(0.45 0.015 240)" }}>{d}</text>;
            })}
            {/* Wind arrow */}
            <line x1={40} y1={40}
              x2={40 + 22 * Math.cos(windRad)} y2={40 + 22 * Math.sin(windRad)}
              stroke="oklch(0.75 0.18 200)" strokeWidth="2" strokeLinecap="round" />
            <circle cx={40 + 22 * Math.cos(windRad)} cy={40 + 22 * Math.sin(windRad)} r={3}
              fill="oklch(0.75 0.18 200)" />
            <circle cx={40} cy={40} r={3} fill="oklch(0.40 0.015 240)" />
            <text x={40} y={72} textAnchor="middle"
              style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: "oklch(0.55 0.015 240)" }}>
              {windAngle.toFixed(0)}°
            </text>
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fan ring with compensation */}
        <div className="bg-navy-surface panel-border rounded-sm p-4">
          <div className="label-caps mb-3">Fan Compensation Ring — Top View</div>
          <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
            <defs>
              <radialGradient id="wind-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="oklch(0.18 0.018 240)" />
                <stop offset="100%" stopColor="oklch(0.11 0.022 240)" />
              </radialGradient>
            </defs>
            <circle cx={cx} cy={cy} r={145} fill="url(#wind-bg)" />
            <circle cx={cx} cy={cy} r={140} fill="none" stroke="oklch(0.20 0.015 240)" strokeWidth="1" />

            {/* Wind vector arrow */}
            {windSpeed > 0 && (
              <g>
                <defs>
                  <marker id="wind-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="oklch(0.75 0.18 200 / 0.7)" />
                  </marker>
                </defs>
                <line
                  x1={cx - windArrowLen * 0.5 * Math.cos(windRad)}
                  y1={cy - windArrowLen * 0.5 * Math.sin(windRad)}
                  x2={cx + windArrowLen * 0.9 * Math.cos(windRad)}
                  y2={cy + windArrowLen * 0.9 * Math.sin(windRad)}
                  stroke="oklch(0.75 0.18 200 / 0.5)"
                  strokeWidth="2"
                  strokeDasharray="5 3"
                  markerEnd="url(#wind-arrow)"
                />
                <text
                  x={cx + (windArrowLen + 12) * Math.cos(windRad)}
                  y={cy + (windArrowLen + 12) * Math.sin(windRad) + 3}
                  textAnchor="middle"
                  style={{ fontFamily: "'JetBrains Mono'", fontSize: 8, fill: "oklch(0.75 0.18 200 / 0.7)" }}>
                  {windSpeed}m/s
                </text>
              </g>
            )}

            {/* Residual drift arrow */}
            {result.residualDrift > 0.05 && (
              <g>
                <defs>
                  <marker id="drift-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                    <path d="M0,0 L6,3 L0,6 Z" fill="oklch(0.65 0.22 25 / 0.7)" />
                  </marker>
                </defs>
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx + driftLen * Math.cos(driftAngle)}
                  y2={cy + driftLen * Math.sin(driftAngle)}
                  stroke="oklch(0.65 0.22 25 / 0.6)"
                  strokeWidth="2"
                  markerEnd="url(#drift-arrow)"
                />
              </g>
            )}

            {/* Craft body */}
            <ellipse cx={cx} cy={cy} rx={28} ry={10} fill="oklch(0.20 0.020 240)" stroke="oklch(0.35 0.015 240)" strokeWidth="1.5" />
            <ellipse cx={cx} cy={cy - 6} rx={18} ry={7} fill="oklch(0.25 0.020 240)" stroke="oklch(0.38 0.015 240)" strokeWidth="1" />

            {/* Fan modules with compensation colour */}
            {result.fans.map((fan) => {
              const pos = getFanPos(fan.id - 1);
              const boost = fan.compensated;
              const fanColor = boost > 1.3 ? "oklch(0.65 0.22 25)"
                : boost > 1.1 ? "oklch(0.72 0.16 80)"
                : boost < 0.7 ? "oklch(0.60 0.15 280)"
                : "oklch(0.65 0.18 145)";

              return (
                <g key={fan.id}>
                  <circle cx={pos.x} cy={pos.y} r={10}
                    fill={`${fanColor.replace(")", " / 0.15)")}`}
                    stroke={fanColor}
                    strokeWidth="1.5"
                  />
                  {/* Throttle bar */}
                  <line
                    x1={cx + (ringR - 18) * Math.cos(pos.angle)}
                    y1={cy + (ringR - 18) * Math.sin(pos.angle)}
                    x2={cx + (ringR - 18 + (boost - 0.75) * 20) * Math.cos(pos.angle)}
                    y2={cy + (ringR - 18 + (boost - 0.75) * 20) * Math.sin(pos.angle)}
                    stroke={fanColor}
                    strokeWidth="2.5"
                    opacity="0.8"
                  />
                  <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: "'JetBrains Mono'", fontSize: 6.5, fill: fanColor }}>
                    {(boost * 100).toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Compass rose */}
            {["N","E","S","W"].map((d, i) => {
              const a = (i / 4) * 2 * Math.PI - Math.PI / 2;
              return <text key={d} x={cx + 132 * Math.cos(a)} y={cy + 132 * Math.sin(a) + 3}
                textAnchor="middle" style={{ fontFamily: "'JetBrains Mono'", fontSize: 8, fill: "oklch(0.30 0.012 240)" }}>{d}</text>;
            })}

            {/* Legend */}
            <g transform="translate(8, 272)">
              {[
                ["oklch(0.65 0.18 145)", "NOMINAL"],
                ["oklch(0.72 0.16 80)", "BOOSTED"],
                ["oklch(0.65 0.22 25)", "HIGH"],
                ["oklch(0.60 0.15 280)", "REDUCED"],
              ].map(([c, l], i) => (
                <g key={l} transform={`translate(${i * 62}, 0)`}>
                  <circle cx={4} cy={4} r={4} fill={c} />
                  <text x={11} y={8} style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: "oklch(0.45 0.015 240)" }}>{l}</text>
                </g>
              ))}
            </g>
          </svg>
        </div>

        {/* Metrics */}
        <div className="space-y-4">
          <div className="bg-navy-surface panel-border rounded-sm p-5">
            <div className="label-caps mb-3">Compensation Metrics</div>
            <div className="space-y-0">
              {[
                { label: "Wind Speed", value: `${windSpeed} m/s`, sub: BEAUFORT(windSpeed), color: "oklch(0.75 0.18 200)" },
                { label: "Wind Direction", value: `${windAngle.toFixed(0)}°`, sub: "", color: "oklch(0.75 0.18 200)" },
                { label: "Wind Force", value: `${result.windForceN.toFixed(0)} N`, sub: "", color: "oklch(0.72 0.16 80)" },
                { label: "Compensation", value: `${result.compensationPct.toFixed(0)}%`, sub: "", color: statusColor },
                { label: "Residual Drift", value: `${result.residualDrift.toFixed(3)} m/s²`, sub: result.residualDrift < 0.05 ? "negligible" : result.residualDrift < 0.2 ? "slow drift" : "significant drift", color: result.residualDrift < 0.05 ? "oklch(0.65 0.18 145)" : result.residualDrift < 0.2 ? "oklch(0.72 0.16 80)" : "oklch(0.65 0.22 25)" },
                { label: "Max Fan Boost", value: `${(Math.max(...result.fans.map(f => f.compensated)) * 100).toFixed(0)}%`, sub: "of rated thrust", color: "oklch(0.72 0.16 80)" },
                { label: "Min Fan Throttle", value: `${(Math.min(...result.fans.map(f => f.compensated)) * 100).toFixed(0)}%`, sub: "of rated thrust", color: "oklch(0.60 0.15 280)" },
              ].map(({ label, value, sub, color }) => (
                <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}>
                  <span className="label-caps">{label}</span>
                  <div className="text-right">
                    <div className="data-value text-sm" style={{ color }}>{value}</div>
                    {sub && <div className="label-caps" style={{ color: "oklch(0.38 0.012 240)", fontSize: 9 }}>{sub}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-navy-surface panel-border rounded-sm p-5">
            <div className="label-caps mb-3">Control Authority Notes</div>
            <div className="space-y-2">
              {[
                { threshold: "< 8 m/s", label: "Full authority", desc: "All position-hold modes available. Compensation < 20% of headroom.", color: "oklch(0.65 0.18 145)" },
                { threshold: "8–14 m/s", label: "Reduced authority", desc: "Position hold maintained. Lateral manoeuvres limited to downwind direction.", color: "oklch(0.72 0.16 80)" },
                { threshold: "14–20 m/s", label: "Degraded mode", desc: "Heading hold only. Slow downwind drift. Flat-glide manoeuvres suspended.", color: "oklch(0.65 0.22 25)" },
                { threshold: "> 20 m/s", label: "Emergency", desc: "Return to base or land immediately. Compensation saturated.", color: "oklch(0.55 0.22 15)" },
              ].map(row => (
                <div key={row.threshold} className="flex items-start gap-3 py-1.5" style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
                  <span className="data-value text-xs w-16 shrink-0" style={{ color: row.color }}>{row.threshold}</span>
                  <div>
                    <div className="label-caps" style={{ color: row.color }}>{row.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "oklch(0.45 0.010 240)", fontFamily: "'Inter'" }}>{row.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
