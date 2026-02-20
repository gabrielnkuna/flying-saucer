/* =============================================================
   COMPONENT: FaultToleranceSimulator
   Design: Classified Aerospace Dossier
   Click fans to disable them → control stack recalculates
   asymmetric compensation → shows attitude-hold capability
   ============================================================= */
import { useState, useEffect, useRef } from "react";

const FANS = 16;
const CRAFT_MASS = 800; // kg
const G = 9.81;
const BASE_THRUST_PER_FAN = (CRAFT_MASS * G) / FANS; // N per fan at hover

interface FanState {
  id: number;
  failed: boolean;
  compensated: number; // throttle multiplier applied by control stack
}

// Given a set of failed fans, compute:
// 1. Compensation throttles for surviving fans
// 2. Residual torque (roll, pitch) after compensation
// 3. Whether attitude hold is achievable
function computeCompensation(fans: FanState[]): {
  fans: FanState[];
  residualRoll: number;   // N·m
  residualPitch: number;  // N·m
  totalThrust: number;    // N
  attitudeHold: boolean;
  marginPct: number;
  failedCount: number;
  status: "nominal" | "degraded" | "critical" | "lost";
} {
  const RADIUS = 3.5; // m — fan ring radius
  const failedCount = fans.filter(f => f.failed).length;
  const activeFans = fans.filter(f => !f.failed);

  if (activeFans.length === 0) {
    return { fans, residualRoll: 999, residualPitch: 999, totalThrust: 0, attitudeHold: false, marginPct: 0, failedCount, status: "lost" };
  }

  // Compute centre-of-thrust offset from failed fans
  let torqueX = 0; // pitch torque contribution from asymmetry
  let torqueY = 0; // roll torque contribution
  fans.forEach(fan => {
    if (fan.failed) {
      const angle = ((fan.id - 1) / FANS) * 2 * Math.PI - Math.PI / 2;
      // Missing thrust creates a torque
      torqueX += BASE_THRUST_PER_FAN * RADIUS * Math.sin(angle);
      torqueY += BASE_THRUST_PER_FAN * RADIUS * Math.cos(angle);
    }
  });

  // Control stack compensates by boosting opposite fans
  // Max boost headroom: 1.6× (60% above hover)
  const MAX_BOOST = 1.6;
  const compensatedFans = fans.map(fan => {
    if (fan.failed) return { ...fan, compensated: 0 };
    const angle = ((fan.id - 1) / FANS) * 2 * Math.PI - Math.PI / 2;
    // Boost fans on the opposite side of the failure
    const rollComp = -torqueY / (RADIUS * BASE_THRUST_PER_FAN * activeFans.length) * Math.cos(angle);
    const pitchComp = -torqueX / (RADIUS * BASE_THRUST_PER_FAN * activeFans.length) * Math.sin(angle);
    const boost = 1 + (rollComp + pitchComp) * 0.8;
    return { ...fan, compensated: Math.min(MAX_BOOST, Math.max(0.3, boost)) };
  });

  // Residual torque after compensation
  let residualRoll = 0;
  let residualPitch = 0;
  compensatedFans.forEach(fan => {
    const angle = ((fan.id - 1) / FANS) * 2 * Math.PI - Math.PI / 2;
    const thrust = fan.failed ? 0 : fan.compensated * BASE_THRUST_PER_FAN;
    residualRoll += thrust * RADIUS * Math.cos(angle);
    residualPitch += thrust * RADIUS * Math.sin(angle);
  });

  const totalThrust = compensatedFans.reduce((s, f) => s + (f.failed ? 0 : f.compensated * BASE_THRUST_PER_FAN), 0);
  const thrustMargin = (totalThrust - CRAFT_MASS * G) / (CRAFT_MASS * G);
  const marginPct = Math.max(0, thrustMargin * 100);

  const residualMag = Math.sqrt(residualRoll ** 2 + residualPitch ** 2);
  const attitudeHold = residualMag < 800 && totalThrust > CRAFT_MASS * G * 0.85;

  let status: "nominal" | "degraded" | "critical" | "lost" = "nominal";
  if (failedCount === 0) status = "nominal";
  else if (failedCount <= 2 && attitudeHold) status = "degraded";
  else if (failedCount <= 4 && attitudeHold) status = "critical";
  else status = "lost";

  return { fans: compensatedFans, residualRoll, residualPitch, totalThrust, attitudeHold, marginPct, failedCount, status };
}

const STATUS_COLORS = {
  nominal: "oklch(0.65 0.18 145)",
  degraded: "oklch(0.72 0.16 80)",
  critical: "oklch(0.65 0.22 25)",
  lost: "oklch(0.55 0.22 15)",
};

const STATUS_LABELS = {
  nominal: "NOMINAL — ALL SYSTEMS GO",
  degraded: "DEGRADED — ATTITUDE HOLD MAINTAINED",
  critical: "CRITICAL — REDUCED AUTHORITY",
  lost: "ATTITUDE LOST — EMERGENCY DESCENT",
};

export default function FaultToleranceSimulator() {
  const [fans, setFans] = useState<FanState[]>(
    Array.from({ length: FANS }, (_, i) => ({ id: i + 1, failed: false, compensated: 1 }))
  );
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const loop = () => { setTick(Date.now()); rafRef.current = requestAnimationFrame(loop); };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const toggleFan = (id: number) => {
    setFans(prev => prev.map(f => f.id === id ? { ...f, failed: !f.failed } : f));
  };

  const resetAll = () => setFans(Array.from({ length: FANS }, (_, i) => ({ id: i + 1, failed: false, compensated: 1 })));

  const result = computeCompensation(fans);
  const statusColor = STATUS_COLORS[result.status];
  const t = tick / 1000;

  const cx = 150, cy = 150, ringR = 108;

  const getFanPos = (i: number) => {
    const angle = (i / FANS) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + ringR * Math.cos(angle), y: cy + ringR * Math.sin(angle), angle };
  };

  // Saucer tilt from residual torque
  const tiltRoll = Math.atan2(result.residualRoll, CRAFT_MASS * G * 3.5) * (180 / Math.PI) * 0.3;
  const tiltPitch = Math.atan2(result.residualPitch, CRAFT_MASS * G * 3.5) * (180 / Math.PI) * 0.3;

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="rounded-sm px-5 py-3 flex items-center justify-between" style={{
        background: `${statusColor.replace(")", " / 0.08)")}`,
        border: `1px solid ${statusColor.replace(")", " / 0.4)")}`,
      }}>
        <div className="flex items-center gap-3">
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: statusColor,
            boxShadow: `0 0 8px ${statusColor}`,
            animation: result.status !== "nominal" ? "pulse 1s infinite" : "none",
          }} />
          <span style={{ fontFamily: "'Rajdhani'", fontSize: 14, fontWeight: 700, color: statusColor, letterSpacing: "0.08em" }}>
            {STATUS_LABELS[result.status]}
          </span>
        </div>
        <button
          onClick={resetAll}
          className="label-caps px-3 py-1 rounded-sm transition-all"
          style={{ border: "1px solid oklch(0.30 0.015 240)", color: "oklch(0.50 0.015 240)" }}
        >
          RESET ALL
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fan ring */}
        <div className="bg-navy-surface panel-border rounded-sm p-4">
          <div className="label-caps mb-2">Fan Ring — Click to Fail/Restore</div>
          <p className="text-xs mb-3" style={{ color: "oklch(0.40 0.012 240)", fontFamily: "'Inter'" }}>
            Click any fan to simulate failure. The control stack compensates surviving fans in real time.
          </p>
          <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto">
            <defs>
              <radialGradient id="fts-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="oklch(0.18 0.018 240)" />
                <stop offset="100%" stopColor="oklch(0.11 0.022 240)" />
              </radialGradient>
            </defs>
            <circle cx={cx} cy={cy} r={145} fill="url(#fts-bg)" />
            <circle cx={cx} cy={cy} r={140} fill="none" stroke="oklch(0.20 0.015 240)" strokeWidth="1" />

            {/* Craft body (tilted by residual torque) */}
            <g transform={`translate(${cx}, ${cy})`}>
              <g transform={`rotate(${tiltRoll})`}>
                <ellipse cx={0} cy={0} rx={30} ry={11}
                  fill="oklch(0.20 0.020 240)"
                  stroke={result.attitudeHold ? "oklch(0.35 0.015 240)" : "oklch(0.65 0.22 25 / 0.6)"}
                  strokeWidth="1.5"
                />
                <ellipse cx={0} cy={-7} rx={20} ry={8}
                  fill="oklch(0.25 0.020 240)"
                  stroke="oklch(0.38 0.015 240)"
                  strokeWidth="1"
                />
                {/* Thrust ring glow */}
                <ellipse cx={0} cy={2} rx={28} ry={5}
                  fill="none"
                  stroke={`${statusColor.replace(")", ` / ${0.4 + Math.sin(t * 2) * 0.15})`)}`}
                  strokeWidth="2"
                />
              </g>
            </g>

            {/* Fan modules */}
            {result.fans.map((fan) => {
              const pos = getFanPos(fan.id - 1);
              const isFailed = fan.failed;
              const boost = fan.compensated;
              const fanColor = isFailed
                ? "oklch(0.65 0.22 25)"
                : boost > 1.4
                ? "oklch(0.72 0.16 80)"
                : boost > 1.1
                ? "oklch(0.75 0.18 200)"
                : "oklch(0.65 0.18 145)";

              return (
                <g key={fan.id} onClick={() => toggleFan(fan.id)} style={{ cursor: "pointer" }}>
                  {/* Glow */}
                  {!isFailed && (
                    <circle cx={pos.x} cy={pos.y} r={14}
                      fill={`${fanColor.replace(")", " / 0.08)")}`}
                      style={{ filter: "blur(4px)" }}
                    />
                  )}
                  {/* Fan body */}
                  <circle cx={pos.x} cy={pos.y} r={10}
                    fill={isFailed ? "oklch(0.12 0.022 240)" : `${fanColor.replace(")", " / 0.18)")}`}
                    stroke={fanColor}
                    strokeWidth={isFailed ? "1.5" : "1.5"}
                    strokeDasharray={isFailed ? "3 2" : "none"}
                    opacity={isFailed ? 0.7 : 1}
                  />
                  {/* Throttle indicator bar */}
                  {!isFailed && (
                    <line
                      x1={cx + (ringR - 22) * Math.cos(pos.angle)}
                      y1={cy + (ringR - 22) * Math.sin(pos.angle)}
                      x2={cx + (ringR - 22 + (boost - 1) * 18) * Math.cos(pos.angle)}
                      y2={cy + (ringR - 22 + (boost - 1) * 18) * Math.sin(pos.angle)}
                      stroke={fanColor}
                      strokeWidth="2.5"
                      opacity="0.8"
                    />
                  )}
                  {/* X mark for failed */}
                  {isFailed && (
                    <>
                      <line x1={pos.x - 5} y1={pos.y - 5} x2={pos.x + 5} y2={pos.y + 5} stroke="oklch(0.65 0.22 25)" strokeWidth="1.5" />
                      <line x1={pos.x + 5} y1={pos.y - 5} x2={pos.x - 5} y2={pos.y + 5} stroke="oklch(0.65 0.22 25)" strokeWidth="1.5" />
                    </>
                  )}
                  {/* Fan number */}
                  <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: isFailed ? "oklch(0.65 0.22 25)" : fanColor, pointerEvents: "none" }}>
                    {fan.id}
                  </text>
                </g>
              );
            })}

            {/* Legend */}
            <g transform="translate(8, 270)">
              {[
                ["oklch(0.65 0.18 145)", "NOMINAL"],
                ["oklch(0.75 0.18 200)", "BOOSTED"],
                ["oklch(0.72 0.16 80)", "HIGH"],
                ["oklch(0.65 0.22 25)", "FAILED"],
              ].map(([c, l], i) => (
                <g key={l} transform={`translate(${i * 62}, 0)`}>
                  <circle cx={4} cy={4} r={4} fill={c} />
                  <text x={11} y={8} style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: "oklch(0.45 0.015 240)" }}>{l}</text>
                </g>
              ))}
            </g>
          </svg>
        </div>

        {/* Readouts */}
        <div className="space-y-4">
          {/* Metrics */}
          <div className="bg-navy-surface panel-border rounded-sm p-5">
            <div className="label-caps mb-3">Control Stack Response</div>
            <div className="space-y-0">
              {[
                { label: "Failed Fans", value: `${result.failedCount} / ${FANS}`, color: result.failedCount === 0 ? "oklch(0.65 0.18 145)" : result.failedCount <= 2 ? "oklch(0.72 0.16 80)" : "oklch(0.65 0.22 25)" },
                { label: "Active Fans", value: `${FANS - result.failedCount}`, color: "oklch(0.88 0.005 240)" },
                { label: "Total Thrust", value: `${result.totalThrust.toFixed(0)} N`, color: result.totalThrust > CRAFT_MASS * G ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)" },
                { label: "Thrust Margin", value: `${result.marginPct.toFixed(1)}%`, color: result.marginPct > 10 ? "oklch(0.65 0.18 145)" : result.marginPct > 0 ? "oklch(0.72 0.16 80)" : "oklch(0.65 0.22 25)" },
                { label: "Residual Roll Torque", value: `${Math.abs(result.residualRoll).toFixed(0)} N·m`, color: Math.abs(result.residualRoll) < 400 ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)" },
                { label: "Residual Pitch Torque", value: `${Math.abs(result.residualPitch).toFixed(0)} N·m`, color: Math.abs(result.residualPitch) < 400 ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)" },
                { label: "Attitude Hold", value: result.attitudeHold ? "YES" : "NO", color: result.attitudeHold ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}>
                  <span className="label-caps">{label}</span>
                  <span className="data-value text-sm" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Failure scenarios reference */}
          <div className="bg-navy-surface panel-border rounded-sm p-5">
            <div className="label-caps mb-3">Fault Tolerance Reference</div>
            <div className="space-y-2">
              {[
                { n: "1–2", label: "Adjacent fans", outcome: "Full attitude hold, <3% thrust loss", color: "oklch(0.65 0.18 145)" },
                { n: "3–4", label: "One zone", outcome: "Degraded — attitude hold, reduced authority", color: "oklch(0.72 0.16 80)" },
                { n: "5–6", label: "Two zones", outcome: "Critical — controlled descent only", color: "oklch(0.65 0.22 25)" },
                { n: "7+", label: "Multi-zone", outcome: "Attitude lost — emergency autoland", color: "oklch(0.55 0.22 15)" },
              ].map(row => (
                <div key={row.n} className="flex items-start gap-3 py-1.5" style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
                  <span className="data-value text-xs w-6" style={{ color: row.color }}>{row.n}</span>
                  <div>
                    <div className="label-caps" style={{ color: row.color }}>{row.label}</div>
                    <div className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.010 240)", fontFamily: "'Inter'" }}>{row.outcome}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick scenario buttons */}
          <div className="bg-navy-surface panel-border rounded-sm p-4">
            <div className="label-caps mb-3">Quick Scenarios</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Single Failure", fans: [1] },
                { label: "Adjacent Pair", fans: [1, 2] },
                { label: "Zone A Out", fans: [1, 2, 3, 4] },
                { label: "Opposite Pair", fans: [1, 9] },
                { label: "Two Zones", fans: [1, 2, 3, 4, 9, 10, 11, 12] },
                { label: "Catastrophic", fans: [1, 3, 5, 7, 9, 11, 13, 15] },
              ].map(scenario => (
                <button
                  key={scenario.label}
                  onClick={() => setFans(Array.from({ length: FANS }, (_, i) => ({
                    id: i + 1,
                    failed: scenario.fans.includes(i + 1),
                    compensated: 1,
                  })))}
                  className="px-3 py-2 rounded-sm text-left transition-all"
                  style={{
                    background: "oklch(0.14 0.020 240)",
                    border: "1px solid oklch(0.22 0.015 240)",
                    fontFamily: "'Rajdhani'",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "oklch(0.65 0.015 240)",
                    letterSpacing: "0.05em",
                  }}
                >
                  {scenario.label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
