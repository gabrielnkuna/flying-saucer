/* =============================================================
   COMPONENT: ExplodedView
   Design: Classified Aerospace Dossier
   SVG interactive exploded cross-section of the craft layers.
   Hover/click a layer → highlights BOM entries, shows
   mass/cost contribution.
   ============================================================= */
import { useState } from "react";

interface Layer {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  yOffset: number;       // exploded Y offset in px
  svgPath: string;       // SVG path for the layer shape
  bomIds: string[];
  mass: number;          // kg
  cost: number;          // USD
  power: number;         // W continuous
  description: string;
}

// Layers from bottom (highest yOffset) to top (lowest yOffset)
// Each layer is an ellipse/rect cross-section shape
const LAYERS: Layer[] = [
  {
    id: "landing",
    label: "Landing Gear",
    sublabel: "3× retractable legs",
    color: "oklch(0.60 0.15 280)",
    yOffset: 320,
    svgPath: "", // rendered separately as legs
    bomIds: ["S3"],
    mass: 13.5,
    cost: 1440,
    power: 36,
    description: "Three retractable electric landing legs arranged at 120° intervals on the lower hull perimeter. Carbon fibre struts with electric actuators, 12W each.",
  },
  {
    id: "battery",
    label: "Battery Bay",
    sublabel: "55 kWh LiPo/LiFePO₄",
    color: "oklch(0.72 0.16 80)",
    yOffset: 260,
    svgPath: "M 60 0 L 240 0 L 230 20 L 70 20 Z",
    bomIds: ["E1", "E2", "E3", "E4"],
    mass: 282.5,
    cost: 40310,
    power: 15,
    description: "Main energy storage occupying the lower disc volume. 55 kWh at 200 Wh/kg gives 280 kg. Phase-change thermal wrap + BMS with cell balancing and thermal runaway protection.",
  },
  {
    id: "structure",
    label: "Main Hull",
    sublabel: "CFRP sandwich + Al ring",
    color: "oklch(0.55 0.015 240)",
    yOffset: 200,
    svgPath: "M 40 0 L 260 0 L 250 22 L 50 22 Z",
    bomIds: ["S1", "S2"],
    mass: 103,
    cost: 25500,
    power: 0,
    description: "Upper dome and lower disc in carbon fibre sandwich construction. The precision-machined Al 7075 fan mounting ring provides the structural backbone for all 16 fan modules.",
  },
  {
    id: "fans",
    label: "Fan Ring",
    sublabel: "16× ducted fans + plenum",
    color: "oklch(0.75 0.18 200)",
    yOffset: 140,
    svgPath: "M 30 0 L 270 0 L 265 18 L 35 18 Z",
    bomIds: ["P1", "P2", "P3", "P4"],
    mass: 68.7,
    cost: 11480,
    power: 220000,
    description: "16 high-power 12\" ducted fans arranged in an annular ring, fed through a central CFRP plenum chamber and exhausted through a 360° annular slit. The plenum equalises pressure and damps BPF tonal noise by ~14 dB.",
  },
  {
    id: "vectoring",
    label: "Vectoring Ring",
    sublabel: "32× segmented vanes",
    color: "oklch(0.65 0.18 145)",
    yOffset: 80,
    svgPath: "M 45 0 L 255 0 L 250 14 L 50 14 Z",
    bomIds: ["V1", "V2"],
    mass: 9.6,
    cost: 3040,
    power: 256,
    description: "32 independently actuated CFRP vane segments (2 per fan module) in the annular exhaust slit. Each pair can deflect ±25° to produce lateral thrust components for the flat-glide and snap-stop motion primitives.",
  },
  {
    id: "avionics",
    label: "Avionics Bay",
    sublabel: "Flight controllers + sensors",
    color: "oklch(0.60 0.15 280)",
    yOffset: 20,
    svgPath: "M 80 0 L 220 0 L 215 16 L 85 16 Z",
    bomIds: ["C1", "C2", "C3", "C4", "C5", "SR1", "SR2", "SR3"],
    mass: 1.76,
    cost: 7628,
    power: 42,
    description: "Dual redundant FPGA+ARM flight controllers running the four-layer repulsion control stack at 500 Hz. Triple IMUs, RTK GPS, optical flow, barometric altimeters, 360° LiDAR, and thermal camera.",
  },
];

// Simplified BOM for cross-reference
const BOM_LABELS: Record<string, { name: string; mass: number; cost: number }> = {
  P1: { name: "Ducted fan module (×16)", mass: 28.8, cost: 6720 },
  P2: { name: "Motor ESC 80A (×16)", mass: 3.52, cost: 1360 },
  P3: { name: "Plenum chamber (CFRP)", mass: 4.5, cost: 1200 },
  P4: { name: "Annular exhaust duct", mass: 6, cost: 2200 },
  V1: { name: "Vane actuator (×32)", mass: 5.76, cost: 2080 },
  V2: { name: "Vane segment CFRP (×32)", mass: 3.84, cost: 960 },
  E1: { name: "Battery pack 55 kWh", mass: 280, cost: 38500 },
  E2: { name: "Power distribution board (×2)", mass: 2.4, cost: 680 },
  E3: { name: "Battery management system", mass: 0.8, cost: 650 },
  E4: { name: "DC-DC converters (×4)", mass: 1.2, cost: 480 },
  S1: { name: "Main hull CFRP sandwich", mass: 85, cost: 22000 },
  S2: { name: "Fan mounting ring Al 7075", mass: 18, cost: 3500 },
  S3: { name: "Landing gear (×3)", mass: 13.5, cost: 1440 },
  C1: { name: "Flight controller (×2)", mass: 0.7, cost: 3600 },
  C2: { name: "IMU 9-DOF (×3)", mass: 0.24, cost: 1260 },
  C3: { name: "Barometric altimeter (×2)", mass: 0.04, cost: 90 },
  C4: { name: "Optical flow sensor (×2)", mass: 0.12, cost: 360 },
  C5: { name: "GPS/GNSS RTK", mass: 0.12, cost: 380 },
  SR1: { name: "360° LiDAR", mass: 0.9, cost: 1200 },
  SR2: { name: "Ultrasonic rangefinder (×4)", mass: 0.2, cost: 88 },
  SR3: { name: "Thermal camera", mass: 0.18, cost: 650 },
};

const TOTAL_MASS = LAYERS.reduce((s, l) => s + l.mass, 0);
const TOTAL_COST = LAYERS.reduce((s, l) => s + l.cost, 0);

export default function ExplodedView() {
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [isExploded, setIsExploded] = useState(true);

  const active = LAYERS.find(l => l.id === activeLayer);

  const SVG_W = 300;
  const SVG_H = isExploded ? 420 : 220;
  const BASE_Y = isExploded ? 380 : 200;
  const LAYER_BASE_Y = 180; // collapsed position

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsExploded(v => !v)}
          className="px-4 py-2 rounded-sm transition-all"
          style={{
            fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em",
            background: isExploded ? "oklch(0.75 0.18 200 / 0.15)" : "oklch(0.18 0.018 240)",
            border: `1px solid ${isExploded ? "oklch(0.75 0.18 200 / 0.5)" : "oklch(0.25 0.015 240)"}`,
            color: isExploded ? "oklch(0.75 0.18 200)" : "oklch(0.50 0.015 240)",
          }}
        >
          {isExploded ? "⊟ COLLAPSE VIEW" : "⊞ EXPLODE VIEW"}
        </button>
        <span className="label-caps" style={{ color: "oklch(0.40 0.012 240)" }}>
          Click a layer to inspect its BOM entries
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SVG exploded diagram */}
        <div className="bg-navy-surface panel-border rounded-sm p-4">
          <div className="label-caps mb-3">Cross-Section Exploded View</div>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="w-full"
            style={{ transition: "height 0.5s", maxHeight: 480 }}
          >
            <defs>
              <radialGradient id="ev-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="oklch(0.16 0.018 240)" />
                <stop offset="100%" stopColor="oklch(0.10 0.020 240)" />
              </radialGradient>
              {LAYERS.map(layer => (
                <linearGradient key={layer.id} id={`grad-${layer.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={`${layer.color.replace(")", " / 0.6)")}`} />
                  <stop offset="50%" stopColor={`${layer.color.replace(")", " / 0.9)")}`} />
                  <stop offset="100%" stopColor={`${layer.color.replace(")", " / 0.6)")}`} />
                </linearGradient>
              ))}
            </defs>
            <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="url(#ev-bg)" />

            {/* Centre axis line */}
            <line x1={SVG_W / 2} y1={20} x2={SVG_W / 2} y2={BASE_Y - 10}
              stroke="oklch(0.25 0.015 240)"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            {/* Landing gear legs (special rendering) */}
            {isExploded && [0, 1, 2].map(i => {
              const angle = (i / 3) * 2 * Math.PI + Math.PI / 6;
              const x = SVG_W / 2 + 70 * Math.cos(angle);
              const y = BASE_Y - 10;
              return (
                <g key={i} onClick={() => setActiveLayer(activeLayer === "landing" ? null : "landing")} style={{ cursor: "pointer" }}>
                  <line
                    x1={x} y1={y - 20}
                    x2={x + 8 * Math.cos(angle)} y2={y + 15}
                    stroke={activeLayer === "landing" ? "oklch(0.60 0.15 280)" : "oklch(0.40 0.12 280)"}
                    strokeWidth={activeLayer === "landing" ? 3 : 2}
                  />
                  <circle cx={x + 8 * Math.cos(angle)} cy={y + 15} r={4}
                    fill={activeLayer === "landing" ? "oklch(0.60 0.15 280 / 0.3)" : "oklch(0.30 0.12 280 / 0.3)"}
                    stroke={activeLayer === "landing" ? "oklch(0.60 0.15 280)" : "oklch(0.40 0.12 280)"}
                    strokeWidth="1.5"
                  />
                </g>
              );
            })}

            {/* Layer slabs */}
            {LAYERS.filter(l => l.id !== "landing").map((layer, idx) => {
              const yPos = isExploded
                ? BASE_Y - layer.yOffset * 0.75
                : LAYER_BASE_Y + (LAYERS.filter(l => l.id !== "landing").length - 1 - idx) * 22;

              const isActive = activeLayer === layer.id;
              const w = 200 - idx * 8;
              const x0 = (SVG_W - w) / 2;
              const h = 18;

              return (
                <g key={layer.id}
                  onClick={() => setActiveLayer(isActive ? null : layer.id)}
                  style={{ cursor: "pointer", transition: "all 0.4s" }}
                >
                  {/* Glow */}
                  {isActive && (
                    <rect x={x0 - 4} y={yPos - 4} width={w + 8} height={h + 8} rx={4}
                      fill={`${layer.color.replace(")", " / 0.15)")}`}
                      style={{ filter: "blur(6px)" }}
                    />
                  )}

                  {/* Main slab */}
                  <rect x={x0} y={yPos} width={w} height={h} rx={2}
                    fill={`url(#grad-${layer.id})`}
                    opacity={isActive ? 1 : 0.7}
                    stroke={isActive ? layer.color : `${layer.color.replace(")", " / 0.4)")}`}
                    strokeWidth={isActive ? 1.5 : 1}
                  />

                  {/* Top edge highlight */}
                  <rect x={x0 + 2} y={yPos + 1} width={w - 4} height={3} rx={1}
                    fill="oklch(1 0 0 / 0.15)"
                  />

                  {/* Label */}
                  <text x={SVG_W / 2} y={yPos + h / 2 + 1}
                    textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: "'Rajdhani'", fontSize: 9, fontWeight: 700, fill: isActive ? "oklch(0.95 0 0)" : "oklch(0.80 0 0)", letterSpacing: "0.06em", pointerEvents: "none" }}>
                    {layer.label.toUpperCase()}
                  </text>

                  {/* Side label */}
                  {isExploded && (
                    <text x={x0 - 6} y={yPos + h / 2 + 1}
                      textAnchor="end" dominantBaseline="middle"
                      style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: isActive ? layer.color : `${layer.color.replace(")", " / 0.6)")}`, pointerEvents: "none" }}>
                      {layer.mass.toFixed(0)} kg
                    </text>
                  )}

                  {/* Connector line to axis */}
                  {isExploded && (
                    <line
                      x1={SVG_W / 2} y1={yPos + h}
                      x2={SVG_W / 2} y2={yPos + h + 8}
                      stroke={`${layer.color.replace(")", " / 0.3)")}`}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                  )}
                </g>
              );
            })}

            {/* Dimension arrows */}
            {isExploded && (
              <g>
                <line x1={260} y1={BASE_Y - 0.75 * 20} x2={260} y2={BASE_Y - 0.75 * 320}
                  stroke="oklch(0.30 0.015 240)" strokeWidth="1" />
                <text x={268} y={BASE_Y - 0.75 * 170}
                  textAnchor="start" dominantBaseline="middle"
                  style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: "oklch(0.40 0.012 240)" }}>
                  ~0.8 m
                </text>
                <text x={268} y={BASE_Y - 0.75 * 155}
                  textAnchor="start" dominantBaseline="middle"
                  style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: "oklch(0.40 0.012 240)" }}>
                  total height
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Layer detail panel */}
        <div className="space-y-4">
          {active ? (
            <>
              <div className="bg-navy-surface panel-border rounded-sm p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: active.color, flexShrink: 0 }} />
                  <div>
                    <div className="label-caps" style={{ color: active.color }}>{active.label}</div>
                    <div className="text-xs" style={{ color: "oklch(0.50 0.015 240)", fontFamily: "'Inter'" }}>{active.sublabel}</div>
                  </div>
                </div>
                <p className="text-xs leading-relaxed mb-4" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'" }}>{active.description}</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Mass", value: `${active.mass.toFixed(1)} kg`, pct: (active.mass / TOTAL_MASS * 100).toFixed(0), color: active.color },
                    { label: "Cost", value: `$${active.cost.toLocaleString()}`, pct: (active.cost / TOTAL_COST * 100).toFixed(0), color: active.color },
                    { label: "Power", value: active.power > 1000 ? `${(active.power / 1000).toFixed(0)} kW` : `${active.power} W`, pct: null, color: active.color },
                  ].map(({ label, value, pct, color }) => (
                    <div key={label} className="rounded-sm p-3 text-center" style={{ background: `${color.replace(")", " / 0.08)")}`, border: `1px solid ${color.replace(")", " / 0.2)")}` }}>
                      <div className="label-caps mb-1">{label}</div>
                      <div className="data-value text-sm" style={{ color }}>{value}</div>
                      {pct && <div className="label-caps mt-0.5" style={{ color: "oklch(0.45 0.015 240)" }}>{pct}% of total</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* BOM entries */}
              <div className="bg-navy-surface panel-border rounded-sm p-5">
                <div className="label-caps mb-3">BOM Entries — {active.label}</div>
                <div className="space-y-0">
                  {active.bomIds.map(id => {
                    const item = BOM_LABELS[id];
                    if (!item) return null;
                    return (
                      <div key={id} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}>
                        <div className="flex items-center gap-2">
                          <span className="data-value text-xs w-8" style={{ color: "oklch(0.45 0.015 240)" }}>{id}</span>
                          <span className="text-xs" style={{ color: "oklch(0.70 0.005 240)", fontFamily: "'Inter'" }}>{item.name}</span>
                        </div>
                        <div className="flex gap-4">
                          <span className="data-value text-xs" style={{ color: "oklch(0.65 0.008 240)" }}>{item.mass.toFixed(2)} kg</span>
                          <span className="data-value text-xs" style={{ color: "oklch(0.72 0.16 80)" }}>${item.cost.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Overall summary when nothing selected */}
              <div className="bg-navy-surface panel-border rounded-sm p-5">
                <div className="label-caps mb-4">Layer Summary</div>
                <div className="space-y-0">
                  {LAYERS.map(layer => (
                    <button key={layer.id}
                      onClick={() => setActiveLayer(layer.id)}
                      className="w-full flex items-center justify-between py-2.5 transition-all"
                      style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div style={{ width: 8, height: 8, borderRadius: 2, background: layer.color, flexShrink: 0 }} />
                        <span className="label-caps text-left" style={{ color: "oklch(0.75 0.005 240)" }}>{layer.label}</span>
                      </div>
                      <div className="flex gap-4 items-center">
                        <span className="data-value text-xs" style={{ color: "oklch(0.65 0.008 240)" }}>{layer.mass.toFixed(0)} kg</span>
                        <span className="data-value text-xs" style={{ color: "oklch(0.72 0.16 80)" }}>${layer.cost.toLocaleString()}</span>
                        <span style={{ color: "oklch(0.35 0.012 240)", fontSize: 9 }}>▶</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-navy-surface panel-border rounded-sm p-4 text-center">
                  <div className="label-caps mb-1">Total Mass</div>
                  <div className="data-value text-xl" style={{ color: "oklch(0.75 0.18 200)" }}>{TOTAL_MASS.toFixed(0)} kg</div>
                  <div className="label-caps mt-1" style={{ color: "oklch(0.40 0.012 240)" }}>design target 800 kg</div>
                </div>
                <div className="bg-navy-surface panel-border rounded-sm p-4 text-center">
                  <div className="label-caps mb-1">Total BOM Cost</div>
                  <div className="data-value text-xl" style={{ color: "oklch(0.72 0.16 80)" }}>${TOTAL_COST.toLocaleString()}</div>
                  <div className="label-caps mt-1" style={{ color: "oklch(0.40 0.012 240)" }}>excl. labour & NRE</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
