/* =============================================================
   COMPONENT: FanLayout
   Design: Classified Aerospace Dossier
   Interactive 16-fan ring layout with 4 power zones
   ============================================================= */
import { useState, useEffect, useRef } from "react";

const FANS = 16;
const ZONES = 4;
const ZONE_COLORS = [
  "oklch(0.75 0.18 200)",   // Zone A — cyan
  "oklch(0.72 0.16 80)",    // Zone B — amber
  "oklch(0.65 0.18 145)",   // Zone C — green
  "oklch(0.60 0.15 280)",   // Zone D — purple
];

export default function FanLayout() {
  const [hoveredFan, setHoveredFan] = useState<number | null>(null);
  const [activeFans, setActiveFans] = useState<number[]>([0, 1, 2, 3]);
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

  const cx = 160, cy = 160, r = 110;

  const getFanPos = (i: number) => {
    const angle = (i / FANS) * 2 * Math.PI - Math.PI / 2;
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      angle: (angle * 180) / Math.PI + 90,
    };
  };

  const getZone = (i: number) => Math.floor(i / (FANS / ZONES));
  const isActive = (i: number) => activeFans.includes(getZone(i));

  const toggleZone = (z: number) => {
    setActiveFans(prev =>
      prev.includes(z) ? prev.filter(x => x !== z) : [...prev, z]
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* SVG Diagram */}
      <div className="bg-navy-surface panel-border rounded-sm p-4">
        <div className="label-caps mb-3">Fan Array — Top View</div>
        <svg viewBox="0 0 320 320" className="w-full max-w-xs mx-auto">
          {/* Background hex grid hint */}
          <defs>
            <radialGradient id="bg-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="oklch(0.18 0.018 240)" stopOpacity="1" />
              <stop offset="100%" stopColor="oklch(0.12 0.022 240)" stopOpacity="1" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={155} fill="url(#bg-grad)" />

          {/* Outer hull ring */}
          <circle cx={cx} cy={cy} r={148} fill="none" stroke="oklch(0.25 0.015 240)" strokeWidth="2" />

          {/* Plenum chamber */}
          <circle cx={cx} cy={cy} r={60} fill="oklch(0.16 0.020 240)" stroke="oklch(0.30 0.015 240)" strokeWidth="1.5" />
          <circle cx={cx} cy={cy} r={40} fill="none" stroke="oklch(0.25 0.015 240)" strokeWidth="1" strokeDasharray="4 4" />

          {/* Zone dividers */}
          {Array.from({ length: ZONES }).map((_, z) => {
            const angle = (z / ZONES) * 2 * Math.PI - Math.PI / 2;
            const x2 = cx + 148 * Math.cos(angle);
            const y2 = cy + 148 * Math.sin(angle);
            return (
              <line key={z} x1={cx} y1={cy} x2={x2} y2={y2}
                stroke="oklch(0.22 0.015 240)" strokeWidth="1" strokeDasharray="3 5" />
            );
          })}

          {/* Annular outlet ring */}
          <circle cx={cx} cy={cy} r={130}
            fill="none"
            stroke={`oklch(0.75 0.18 200 / ${0.3 + Math.sin(t * 1.2) * 0.15})`}
            strokeWidth="4"
          />

          {/* Fan modules */}
          {Array.from({ length: FANS }).map((_, i) => {
            const pos = getFanPos(i);
            const zone = getZone(i);
            const active = isActive(i);
            const hovered = hoveredFan === i;
            const pulseOffset = (i / FANS) * Math.PI * 2;
            const pulse = active ? 0.5 + Math.sin(t * 2 + pulseOffset) * 0.3 : 0.2;
            const color = ZONE_COLORS[zone];

            return (
              <g key={i}
                onMouseEnter={() => setHoveredFan(i)}
                onMouseLeave={() => setHoveredFan(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Fan glow */}
                {active && (
                  <circle cx={pos.x} cy={pos.y} r={14}
                    fill={`${color.replace(')', ' / 0.08)')}`}
                    style={{ filter: "blur(4px)" }}
                  />
                )}
                {/* Fan body */}
                <circle cx={pos.x} cy={pos.y} r={hovered ? 10 : 8}
                  fill={active ? `${color.replace(')', ` / ${pulse * 0.25})`)}` : "oklch(0.16 0.018 240)"}
                  stroke={active ? color : "oklch(0.28 0.015 240)"}
                  strokeWidth={hovered ? 2 : 1.5}
                  style={{ transition: "r 0.15s, stroke-width 0.15s" }}
                />
                {/* Fan number */}
                <text x={pos.x} y={pos.y + 1} textAnchor="middle" dominantBaseline="middle"
                  style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: active ? color : "oklch(0.40 0.015 240)" }}>
                  {i + 1}
                </text>
              </g>
            );
          })}

          {/* Center hub */}
          <circle cx={cx} cy={cy} r={18} fill="oklch(0.20 0.020 240)" stroke="oklch(0.35 0.015 240)" strokeWidth="2" />
          <circle cx={cx} cy={cy} r={8}
            fill={`oklch(0.75 0.18 200 / ${0.3 + Math.sin(t * 0.8) * 0.2})`}
            stroke="oklch(0.75 0.18 200)"
            strokeWidth="1"
          />

          {/* Hover tooltip */}
          {hoveredFan !== null && (() => {
            const pos = getFanPos(hoveredFan);
            const zone = getZone(hoveredFan);
            const tx = pos.x > cx ? pos.x - 60 : pos.x + 10;
            const ty = pos.y > cy ? pos.y - 30 : pos.y + 10;
            return (
              <g>
                <rect x={tx} y={ty} width={55} height={28} rx={2}
                  fill="oklch(0.14 0.020 240)" stroke={ZONE_COLORS[zone]} strokeWidth="1" />
                <text x={tx + 4} y={ty + 10} style={{ fontFamily: "'JetBrains Mono'", fontSize: 8, fill: ZONE_COLORS[zone] }}>
                  FAN {hoveredFan + 1}
                </text>
                <text x={tx + 4} y={ty + 21} style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: "oklch(0.55 0.015 240)" }}>
                  ZONE {String.fromCharCode(65 + zone)}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Zone controls + specs */}
      <div className="space-y-4">
        <div className="bg-navy-surface panel-border rounded-sm p-4">
          <div className="label-caps mb-3">Power Zone Control</div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: ZONES }).map((_, z) => {
              const active = activeFans.includes(z);
              return (
                <button
                  key={z}
                  onClick={() => toggleZone(z)}
                  className="rounded-sm p-3 text-left transition-all"
                  style={{
                    background: active ? `${ZONE_COLORS[z].replace(')', ' / 0.12)')}` : "oklch(0.12 0.022 240)",
                    border: `1px solid ${active ? ZONE_COLORS[z].replace(')', ' / 0.5)') : 'oklch(0.22 0.015 240)'}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: active ? ZONE_COLORS[z] : "oklch(0.30 0.015 240)",
                      boxShadow: active ? `0 0 6px ${ZONE_COLORS[z]}` : "none",
                    }} />
                    <span style={{ fontFamily: "'Rajdhani'", fontSize: 13, fontWeight: 600, color: active ? ZONE_COLORS[z] : "oklch(0.45 0.015 240)", letterSpacing: "0.1em" }}>
                      ZONE {String.fromCharCode(65 + z)}
                    </span>
                  </div>
                  <div className="label-caps" style={{ color: "oklch(0.40 0.012 240)" }}>
                    Fans {z * 4 + 1}–{z * 4 + 4}
                  </div>
                  <div className="data-value text-xs mt-1" style={{ color: active ? "oklch(0.75 0.005 240)" : "oklch(0.35 0.012 240)" }}>
                    {active ? "NOMINAL" : "STANDBY"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-navy-surface panel-border rounded-sm p-4">
          <div className="label-caps mb-3">Baseline Configuration</div>
          <div className="space-y-2">
            {[
              ["Fan count", "16 modules"],
              ["Power zones", "4 (4 fans each)"],
              ["Outlet type", "Plenum-fed annular"],
              ["Vector segments", "32 (2×/fan)"],
              ["Continuous power", "~220 kW"],
              ["Burst headroom", "~350 kW"],
              ["Battery", "55–60 kWh"],
              ["Control rate", "200–500 Hz"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center py-1.5" style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}>
                <span className="label-caps">{k}</span>
                <span className="data-value text-xs" style={{ color: "oklch(0.80 0.005 240)" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
