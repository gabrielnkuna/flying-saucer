/* =============================================================
   COMPONENT: ThermalManagement
   Design: Classified Aerospace Dossier
   Fan ring heat map at different throttle levels,
   cooling airflow paths, thermal runaway warning
   ============================================================= */
import { useState, useEffect, useRef } from "react";

const FANS = 16;

// Thermal model per fan
// Motor temp rises with throttle^2, cooled by airflow (proportional to throttle)
// ESC temp lags motor by ~15°C
// Ambient: 25°C
function computeTemps(throttles: number[], ambientC: number, timeS: number) {
  return throttles.map((t, i) => {
    // Steady-state motor temp: ambient + (throttle^2 * 85°C rise at 100%)
    const motorSS = ambientC + t * t * 85;
    // Airflow cooling: higher throttle = more cooling air through duct
    const cooling = t * 18;
    const motorTemp = motorSS - cooling;
    // ESC runs ~12°C cooler than motor (better airflow position)
    const escTemp = motorTemp - 12 + (i % 3 === 0 ? 3 : 0); // slight variation
    // Battery pack: uniform, rises with total load
    const totalLoad = throttles.reduce((s, v) => s + v, 0) / FANS;
    const battTemp = ambientC + totalLoad * totalLoad * 22;
    return { motorTemp: Math.max(ambientC, motorTemp), escTemp: Math.max(ambientC, escTemp), battTemp };
  });
}

function tempColor(t: number): string {
  // Cold: blue → green → amber → red → white-hot
  if (t < 40) return `oklch(0.65 0.18 240)`;
  if (t < 60) return `oklch(0.70 0.18 175)`;
  if (t < 80) return `oklch(0.72 0.16 80)`;
  if (t < 100) return `oklch(0.65 0.22 25)`;
  return `oklch(0.80 0.20 10)`;
}

function tempLabel(t: number): string {
  if (t < 40) return "COLD";
  if (t < 60) return "NOMINAL";
  if (t < 80) return "WARM";
  if (t < 100) return "HOT";
  return "CRITICAL";
}

const THROTTLE_PRESETS = [
  { label: "IDLE", value: 0.3 },
  { label: "HOVER", value: 0.75 },
  { label: "BURST", value: 1.0 },
];

// Cooling path SVG paths (simplified airflow arrows around the ring)
const COOLING_PATHS = [
  { d: "M 150 30 Q 150 80 150 130", label: "Plenum intake" },
  { d: "M 30 150 Q 80 150 130 150", label: "Lateral duct" },
  { d: "M 270 150 Q 220 150 170 150", label: "Lateral duct" },
  { d: "M 150 270 Q 150 220 150 170", label: "Exhaust return" },
];

export default function ThermalManagement() {
  const [throttle, setThrottle] = useState(0.75);
  const [ambient, setAmbient] = useState(25);
  const [activePreset, setActivePreset] = useState(1);
  const [viewMode, setViewMode] = useState<"motor" | "esc" | "battery">("motor");
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const loop = () => { setTick(Date.now()); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const t = tick / 1000;

  // Slight per-fan variation to make it realistic
  const throttles = Array.from({ length: FANS }, (_, i) => {
    const variation = 1 + Math.sin(t * 0.3 + i * 0.7) * 0.04;
    return Math.min(1.0, throttle * variation);
  });

  const temps = computeTemps(throttles, ambient, t);

  const cx = 150, cy = 150, ringR = 108;
  const getFanPos = (i: number) => {
    const angle = (i / FANS) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + ringR * Math.cos(angle), y: cy + ringR * Math.sin(angle), angle };
  };

  const getTemp = (i: number) => {
    if (viewMode === "motor") return temps[i].motorTemp;
    if (viewMode === "esc") return temps[i].escTemp;
    return temps[i].battTemp;
  };

  const maxTemp = Math.max(...temps.map(t => getTemp(temps.indexOf(t))));
  const avgTemp = temps.reduce((s, _, i) => s + getTemp(i), 0) / FANS;
  const battTemp = temps[0].battTemp;
  const isRunawayRisk = maxTemp > 95 || battTemp > 55;
  const isCritical = maxTemp > 105 || battTemp > 65;

  // Gradient stops for the ring glow
  const ringGlowColor = tempColor(avgTemp);

  return (
    <div className="space-y-6">
      {/* Thermal runaway warning */}
      {isRunawayRisk && (
        <div className="rounded-sm px-5 py-3 flex items-center gap-4" style={{
          background: isCritical ? "oklch(0.65 0.22 25 / 0.12)" : "oklch(0.72 0.16 80 / 0.08)",
          border: `1px solid ${isCritical ? "oklch(0.65 0.22 25 / 0.5)" : "oklch(0.72 0.16 80 / 0.4)"}`,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: isCritical ? "oklch(0.65 0.22 25)" : "oklch(0.72 0.16 80)",
            boxShadow: `0 0 8px ${isCritical ? "oklch(0.65 0.22 25)" : "oklch(0.72 0.16 80)"}`,
            animation: "pulse 0.8s infinite",
            flexShrink: 0,
          }} />
          <div>
            <div className="label-caps" style={{ color: isCritical ? "oklch(0.65 0.22 25)" : "oklch(0.72 0.16 80)" }}>
              {isCritical ? "⚠ THERMAL RUNAWAY RISK — REDUCE THROTTLE IMMEDIATELY" : "⚠ ELEVATED TEMPERATURE — MONITOR CLOSELY"}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.010 240)", fontFamily: "'Inter'" }}>
              {isCritical
                ? `Peak motor: ${maxTemp.toFixed(0)}°C · Battery: ${battTemp.toFixed(0)}°C · Initiate emergency cooling protocol`
                : `Peak motor: ${maxTemp.toFixed(0)}°C · Battery: ${battTemp.toFixed(0)}°C · Thermal margins tightening`}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="label-caps">Throttle Level</div>
            <div className="data-value text-sm" style={{ color: "oklch(0.75 0.18 200)" }}>{(throttle * 100).toFixed(0)}%</div>
          </div>
          <input type="range" min={0.1} max={1.0} step={0.01} value={throttle}
            onChange={e => { setThrottle(parseFloat(e.target.value)); setActivePreset(-1); }}
            className="w-full mb-3" style={{ accentColor: "oklch(0.75 0.18 200)" }}
          />
          <div className="flex gap-2">
            {THROTTLE_PRESETS.map((p, i) => (
              <button key={p.label} onClick={() => { setThrottle(p.value); setActivePreset(i); }}
                className="px-3 py-1.5 rounded-sm text-xs transition-all"
                style={{
                  fontFamily: "'JetBrains Mono'",
                  background: activePreset === i ? "oklch(0.75 0.18 200 / 0.15)" : "oklch(0.18 0.018 240)",
                  border: `1px solid ${activePreset === i ? "oklch(0.75 0.18 200 / 0.5)" : "oklch(0.25 0.015 240)"}`,
                  color: activePreset === i ? "oklch(0.75 0.18 200)" : "oklch(0.50 0.015 240)",
                }}>{p.label}</button>
            ))}
          </div>
        </div>

        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="label-caps">Ambient Temperature</div>
            <div className="data-value text-sm" style={{ color: "oklch(0.72 0.16 80)" }}>{ambient}°C</div>
          </div>
          <input type="range" min={-10} max={50} step={1} value={ambient}
            onChange={e => setAmbient(parseInt(e.target.value))}
            className="w-full mb-3" style={{ accentColor: "oklch(0.72 0.16 80)" }}
          />
          <div className="flex gap-2">
            {[{ label: "ARCTIC −10°C", v: -10 }, { label: "STANDARD 25°C", v: 25 }, { label: "DESERT 45°C", v: 45 }].map(p => (
              <button key={p.label} onClick={() => setAmbient(p.v)}
                className="px-2 py-1.5 rounded-sm text-xs transition-all"
                style={{
                  fontFamily: "'JetBrains Mono'", fontSize: 9,
                  background: ambient === p.v ? "oklch(0.72 0.16 80 / 0.15)" : "oklch(0.18 0.018 240)",
                  border: `1px solid ${ambient === p.v ? "oklch(0.72 0.16 80 / 0.5)" : "oklch(0.25 0.015 240)"}`,
                  color: ambient === p.v ? "oklch(0.72 0.16 80)" : "oklch(0.50 0.015 240)",
                }}>{p.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heat map ring */}
        <div className="bg-navy-surface panel-border rounded-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="label-caps">Thermal Heat Map</div>
            <div className="flex gap-1">
              {(["motor", "esc", "battery"] as const).map(mode => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className="px-2 py-1 rounded-sm text-xs transition-all"
                  style={{
                    fontFamily: "'JetBrains Mono'",
                    background: viewMode === mode ? "oklch(0.75 0.18 200 / 0.15)" : "oklch(0.18 0.018 240)",
                    border: `1px solid ${viewMode === mode ? "oklch(0.75 0.18 200 / 0.5)" : "oklch(0.25 0.015 240)"}`,
                    color: viewMode === mode ? "oklch(0.75 0.18 200)" : "oklch(0.50 0.015 240)",
                  }}>{mode.toUpperCase()}</button>
              ))}
            </div>
          </div>

          <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
            <defs>
              <radialGradient id="therm-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="oklch(0.18 0.018 240)" />
                <stop offset="100%" stopColor="oklch(0.11 0.022 240)" />
              </radialGradient>
            </defs>
            <circle cx={cx} cy={cy} r={145} fill="url(#therm-bg)" />
            <circle cx={cx} cy={cy} r={140} fill="none" stroke="oklch(0.20 0.015 240)" strokeWidth="1" />

            {/* Cooling airflow paths */}
            {[0, 1, 2, 3].map(i => {
              const angle = (i / 4) * 2 * Math.PI - Math.PI / 2;
              const x1 = cx + 50 * Math.cos(angle);
              const y1 = cy + 50 * Math.sin(angle);
              const x2 = cx + 90 * Math.cos(angle);
              const y2 = cy + 90 * Math.sin(angle);
              return (
                <g key={i}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="oklch(0.75 0.18 200 / 0.15)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <line x1={x1} y1={y1} x2={x2} y2={y2}
                    stroke="oklch(0.75 0.18 200 / 0.4)"
                    strokeWidth="1.5"
                    strokeDasharray={`4 3`}
                    strokeDashoffset={`${-(t * 12) % 7}`}
                    strokeLinecap="round"
                  />
                </g>
              );
            })}

            {/* Battery pack (centre) */}
            {viewMode === "battery" ? (
              <g>
                <rect x={cx - 28} y={cy - 20} width={56} height={40} rx={4}
                  fill={`${tempColor(battTemp).replace(")", " / 0.2)")}`}
                  stroke={tempColor(battTemp)}
                  strokeWidth="1.5"
                />
                <text x={cx} y={cy - 4} textAnchor="middle"
                  style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, fill: tempColor(battTemp) }}>
                  {battTemp.toFixed(0)}°C
                </text>
                <text x={cx} y={cy + 9} textAnchor="middle"
                  style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: "oklch(0.50 0.015 240)" }}>
                  BATTERY
                </text>
              </g>
            ) : (
              <g>
                <rect x={cx - 22} y={cy - 16} width={44} height={32} rx={3}
                  fill="oklch(0.18 0.020 240)"
                  stroke="oklch(0.28 0.015 240)"
                  strokeWidth="1"
                />
                <text x={cx} y={cy + 4} textAnchor="middle"
                  style={{ fontFamily: "'JetBrains Mono'", fontSize: 8, fill: "oklch(0.40 0.012 240)" }}>
                  PLENUM
                </text>
              </g>
            )}

            {/* Fan modules with heat colour */}
            {Array.from({ length: FANS }).map((_, i) => {
              const pos = getFanPos(i);
              const temp = getTemp(i);
              const color = tempColor(temp);
              const r = 11;

              return (
                <g key={i}>
                  {/* Heat glow */}
                  <circle cx={pos.x} cy={pos.y} r={r + 6}
                    fill={`${color.replace(")", " / 0.10)")}`}
                    style={{ filter: "blur(4px)" }}
                  />
                  {/* Fan body */}
                  <circle cx={pos.x} cy={pos.y} r={r}
                    fill={`${color.replace(")", " / 0.18)")}`}
                    stroke={color}
                    strokeWidth="1.5"
                  />
                  {/* Temp text */}
                  <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: "'JetBrains Mono'", fontSize: 6.5, fill: color }}>
                    {temp.toFixed(0)}
                  </text>
                </g>
              );
            })}

            {/* Temperature scale bar */}
            <defs>
              <linearGradient id="temp-scale" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="oklch(0.65 0.18 240)" />
                <stop offset="33%" stopColor="oklch(0.70 0.18 175)" />
                <stop offset="66%" stopColor="oklch(0.72 0.16 80)" />
                <stop offset="85%" stopColor="oklch(0.65 0.22 25)" />
                <stop offset="100%" stopColor="oklch(0.80 0.20 10)" />
              </linearGradient>
            </defs>
            <rect x={20} y={272} width={160} height={6} rx={3} fill="url(#temp-scale)" />
            <text x={20} y={286} style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: "oklch(0.45 0.015 240)" }}>20°C</text>
            <text x={172} y={286} textAnchor="end" style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: "oklch(0.45 0.015 240)" }}>110°C</text>
          </svg>
        </div>

        {/* Metrics + limits */}
        <div className="space-y-4">
          <div className="bg-navy-surface panel-border rounded-sm p-5">
            <div className="label-caps mb-3">Thermal Readout — {viewMode.toUpperCase()}</div>
            <div className="space-y-0">
              {[
                { label: "Peak Temperature", value: `${maxTemp.toFixed(1)}°C`, color: tempColor(maxTemp), limit: viewMode === "motor" ? 105 : viewMode === "esc" ? 90 : 65 },
                { label: "Average Temperature", value: `${avgTemp.toFixed(1)}°C`, color: tempColor(avgTemp), limit: null },
                { label: "Battery Pack", value: `${battTemp.toFixed(1)}°C`, color: tempColor(battTemp), limit: 65 },
                { label: "Ambient", value: `${ambient}°C`, color: "oklch(0.65 0.015 240)", limit: null },
                { label: "Thermal Margin", value: `${Math.max(0, (viewMode === "motor" ? 105 : 90) - maxTemp).toFixed(0)}°C`, color: maxTemp > 90 ? "oklch(0.65 0.22 25)" : "oklch(0.65 0.18 145)", limit: null },
                { label: "Status", value: tempLabel(maxTemp), color: tempColor(maxTemp), limit: null },
              ].map(({ label, value, color, limit }) => (
                <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}>
                  <div>
                    <span className="label-caps">{label}</span>
                    {limit && <span className="label-caps ml-2" style={{ color: "oklch(0.35 0.012 240)" }}>/ {limit}°C max</span>}
                  </div>
                  <span className="data-value text-sm" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cooling system summary */}
          <div className="bg-navy-surface panel-border rounded-sm p-5">
            <div className="label-caps mb-3">Cooling Architecture</div>
            <div className="space-y-2">
              {[
                { system: "Forced-air duct cooling", desc: "Intake above plenum, exhaust below fan ring", status: throttle > 0.2 ? "ACTIVE" : "STANDBY", color: "oklch(0.65 0.18 145)" },
                { system: "Thermal interface pads", desc: "Motor → mount → duct wall conduction path", status: "PASSIVE", color: "oklch(0.75 0.18 200)" },
                { system: "Battery thermal wrap", desc: "Phase-change material + aluminium spreader", status: battTemp > 45 ? "ABSORBING" : "NOMINAL", color: battTemp > 45 ? "oklch(0.72 0.16 80)" : "oklch(0.65 0.18 145)" },
                { system: "Thermal camera (SR3)", desc: "360° hull monitoring, 10 Hz update rate", status: "MONITORING", color: "oklch(0.60 0.15 280)" },
              ].map(row => (
                <div key={row.system} className="flex items-start gap-3 py-1.5" style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: row.color, marginTop: 3, flexShrink: 0 }} />
                  <div className="flex-1">
                    <div className="label-caps" style={{ color: "oklch(0.75 0.005 240)" }}>{row.system}</div>
                    <div className="text-xs mt-0.5" style={{ color: "oklch(0.45 0.010 240)", fontFamily: "'Inter'" }}>{row.desc}</div>
                  </div>
                  <span className="label-caps text-xs" style={{ color: row.color, flexShrink: 0 }}>{row.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
