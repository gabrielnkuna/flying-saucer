/* =============================================================
   COMPONENT: ScaleConfigurator
   Design: Classified Aerospace Dossier
   Diameter slider (2–12 m) → recalculates all specs, mass,
   power, fan count, battery, cost, and regulatory thresholds.
   ============================================================= */
import { useState, useMemo } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from "recharts";

// ── Scaling model ─────────────────────────────────────────────
// Reference design: 8 m diameter, 800 kg, 16 fans, 220 kW hover
const REF_D = 8;          // m
const REF_MASS = 800;     // kg
const REF_FANS = 16;
const REF_HOVER_KW = 220;
const REF_BATTERY_KWH = 55;
const REF_COST = 89398;   // USD BOM total
const REF_FAN_RING_R = 3.5; // m

// Scaling laws:
// Mass ∝ D^2.5 (disc structure + battery scales with volume)
// Hover power ∝ D^2 (disc area, induced velocity)
// Fan count: nearest even number ≥ 8 that fits ring
// Battery ∝ hover power (fixed endurance target)
// Cost ∝ mass^0.8 * power^0.3

function computeScale(d: number) {
  const ratio = d / REF_D;
  const mass = REF_MASS * Math.pow(ratio, 2.5);
  const hoverKw = REF_HOVER_KW * Math.pow(ratio, 2);
  const battKwh = REF_BATTERY_KWH * Math.pow(ratio, 2);
  // Fan count: fit fans around ring, min spacing ~0.35 m per fan
  const ringCirc = 2 * Math.PI * (d * 0.44);
  const rawFans = Math.floor(ringCirc / 0.35);
  const fans = Math.max(8, Math.min(64, rawFans - (rawFans % 4)));
  const cost = REF_COST * Math.pow(ratio, 2.2);
  const endurance = (battKwh * 0.85) / hoverKw * 60; // min
  const maxLateral = 0.35 * Math.pow(ratio, -0.3); // g — larger craft less agile
  const snapStop = 0.25 * Math.pow(ratio, -0.2); // g
  const burstPower = hoverKw * 1.6;
  const vaneCount = fans * 2;

  return { mass, hoverKw, battKwh, fans, cost, endurance, maxLateral, snapStop, burstPower, vaneCount };
}

// Regulatory thresholds
const REG_THRESHOLDS = [
  { label: "Part 107 (sUAS)", maxMass: 25, maxD: 2.5, note: "FAA small UAS rule — no type cert required" },
  { label: "Part 91 (General Aviation)", maxMass: null, maxD: null, note: "Requires type certificate (14 CFR Part 21)" },
  { label: "EASA Open Category", maxMass: 25, maxD: 2.5, note: "No individual authorisation needed" },
  { label: "EASA Specific Category", maxMass: 900, maxD: 8, note: "Operational authorisation required" },
  { label: "EASA Certified Category", maxMass: null, maxD: null, note: "Full type certification required" },
];

function getRegStatus(d: number, mass: number) {
  if (mass <= 25 && d <= 2.5) return { label: "Part 107 / EASA Open", color: "oklch(0.65 0.18 145)", note: "Lightest regulatory burden — no type cert" };
  if (mass <= 900 && d <= 8) return { label: "EASA Specific Category", color: "oklch(0.72 0.16 80)", note: "Operational authorisation required; no full type cert" };
  return { label: "Certified Category (Type Cert)", color: "oklch(0.65 0.22 25)", note: "Full type certification required — multi-year process" };
}

const SCALE_PRESETS = [
  { label: "MICRO 2m", d: 2 },
  { label: "DEMO 4m", d: 4 },
  { label: "REFERENCE 8m", d: 8 },
  { label: "LARGE 10m", d: 10 },
  { label: "MAX 12m", d: 12 },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "oklch(0.14 0.020 240)", border: "1px solid oklch(0.28 0.015 240)", padding: "6px 10px", borderRadius: 4 }}>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "oklch(0.75 0.18 200)" }}>{payload[0]?.subject}: {payload[0]?.value?.toFixed(0)}%</div>
    </div>
  );
};

export default function ScaleConfigurator() {
  const [diameter, setDiameter] = useState(8);
  const ref = useMemo(() => computeScale(REF_D), []);
  const s = useMemo(() => computeScale(diameter), [diameter]);
  const reg = useMemo(() => getRegStatus(diameter, s.mass), [diameter, s.mass]);

  const radarData = [
    { subject: "Mass", A: (s.mass / ref.mass) * 100, fullMark: 400 },
    { subject: "Power", A: (s.hoverKw / ref.hoverKw) * 100, fullMark: 400 },
    { subject: "Agility", A: (s.maxLateral / ref.maxLateral) * 100, fullMark: 200 },
    { subject: "Endurance", A: (s.endurance / (ref.battKwh * 0.85 / ref.hoverKw * 60)) * 100, fullMark: 200 },
    { subject: "Cost", A: (s.cost / ref.cost) * 100, fullMark: 400 },
    { subject: "Fan Count", A: (s.fans / ref.fans) * 100, fullMark: 400 },
  ];

  return (
    <div className="space-y-6">
      {/* Diameter slider */}
      <div className="bg-navy-surface panel-border rounded-sm p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="label-caps">Craft Diameter</div>
          <div className="data-value text-2xl" style={{ color: "oklch(0.75 0.18 200)" }}>{diameter.toFixed(1)} m</div>
        </div>
        <input type="range" min={2} max={12} step={0.5} value={diameter}
          onChange={e => setDiameter(parseFloat(e.target.value))}
          className="w-full mb-3" style={{ accentColor: "oklch(0.75 0.18 200)" }} />
        <div className="flex gap-2 flex-wrap">
          {SCALE_PRESETS.map(p => (
            <button key={p.label} onClick={() => setDiameter(p.d)}
              className="px-3 py-1.5 rounded-sm text-xs transition-all"
              style={{
                fontFamily: "'JetBrains Mono'",
                background: diameter === p.d ? "oklch(0.75 0.18 200 / 0.15)" : "oklch(0.18 0.018 240)",
                border: `1px solid ${diameter === p.d ? "oklch(0.75 0.18 200 / 0.5)" : "oklch(0.25 0.015 240)"}`,
                color: diameter === p.d ? "oklch(0.75 0.18 200)" : "oklch(0.50 0.015 240)",
              }}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* Regulatory status */}
      <div className="rounded-sm px-5 py-3 flex items-center justify-between" style={{
        background: `${reg.color.replace(")", " / 0.08)")}`,
        border: `1px solid ${reg.color.replace(")", " / 0.35)")}`,
      }}>
        <div>
          <div className="label-caps" style={{ color: reg.color }}>Regulatory Category: {reg.label}</div>
          <div className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.010 240)", fontFamily: "'Inter'" }}>{reg.note}</div>
        </div>
        <div className="data-value text-lg" style={{ color: reg.color }}>{diameter.toFixed(1)} m</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scaled specs table */}
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="label-caps mb-3">Scaled Specifications vs Reference (8 m)</div>
          <div className="space-y-0">
            {[
              { label: "Diameter", cur: `${diameter.toFixed(1)} m`, ref: `${REF_D} m`, ratio: diameter / REF_D, color: "oklch(0.75 0.18 200)" },
              { label: "Total Mass", cur: `${s.mass.toFixed(0)} kg`, ref: `${ref.mass.toFixed(0)} kg`, ratio: s.mass / ref.mass, color: "oklch(0.72 0.16 80)" },
              { label: "Fan Modules", cur: `${s.fans}`, ref: `${ref.fans}`, ratio: s.fans / ref.fans, color: "oklch(0.75 0.18 200)" },
              { label: "Vector Segments", cur: `${s.vaneCount}`, ref: `${ref.vaneCount}`, ratio: s.vaneCount / ref.vaneCount, color: "oklch(0.65 0.18 145)" },
              { label: "Hover Power", cur: `${s.hoverKw.toFixed(0)} kW`, ref: `${ref.hoverKw.toFixed(0)} kW`, ratio: s.hoverKw / ref.hoverKw, color: "oklch(0.72 0.16 80)" },
              { label: "Burst Power", cur: `${s.burstPower.toFixed(0)} kW`, ref: `${ref.burstPower.toFixed(0)} kW`, ratio: s.burstPower / ref.burstPower, color: "oklch(0.65 0.22 25)" },
              { label: "Battery", cur: `${s.battKwh.toFixed(1)} kWh`, ref: `${ref.battKwh.toFixed(1)} kWh`, ratio: s.battKwh / ref.battKwh, color: "oklch(0.72 0.16 80)" },
              { label: "Hover Endurance", cur: `${s.endurance.toFixed(0)} min`, ref: `${(ref.battKwh * 0.85 / ref.hoverKw * 60).toFixed(0)} min`, ratio: s.endurance / (ref.battKwh * 0.85 / ref.hoverKw * 60), color: "oklch(0.65 0.18 145)" },
              { label: "Max Lateral Accel", cur: `${s.maxLateral.toFixed(3)} g`, ref: `${ref.maxLateral.toFixed(3)} g`, ratio: s.maxLateral / ref.maxLateral, color: "oklch(0.65 0.18 145)" },
              { label: "Snap-stop Decel", cur: `${s.snapStop.toFixed(3)} g`, ref: `${ref.snapStop.toFixed(3)} g`, ratio: s.snapStop / ref.snapStop, color: "oklch(0.65 0.18 145)" },
              { label: "BOM Cost (est.)", cur: `$${s.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, ref: `$${ref.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, ratio: s.cost / ref.cost, color: "oklch(0.72 0.16 80)" },
            ].map(({ label, cur, ref: refVal, ratio, color }) => (
              <div key={label} className="flex items-center py-2" style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}>
                <span className="label-caps w-36 shrink-0">{label}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="h-1.5 rounded-full overflow-hidden flex-1" style={{ background: "oklch(0.18 0.018 240)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, ratio * 50)}%`, background: color }} />
                  </div>
                </div>
                <span className="data-value text-xs w-20 text-right" style={{ color }}>{cur}</span>
                <span className="label-caps text-xs w-20 text-right" style={{ color: "oklch(0.38 0.012 240)" }}>{refVal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Radar chart + silhouette */}
        <div className="space-y-4">
          <div className="bg-navy-surface panel-border rounded-sm p-5">
            <div className="label-caps mb-3">Capability Profile (% of reference)</div>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                <PolarGrid stroke="oklch(0.22 0.015 240)" />
                <PolarAngleAxis dataKey="subject"
                  tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.50 0.015 240)" }} />
                <Tooltip content={<CustomTooltip />} />
                <Radar dataKey="A" name="Scaled"
                  stroke="oklch(0.75 0.18 200)"
                  fill="oklch(0.75 0.18 200 / 0.15)"
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Silhouette scale comparison */}
          <div className="bg-navy-surface panel-border rounded-sm p-5">
            <div className="label-caps mb-3">Scale Comparison</div>
            <svg viewBox="0 0 300 120" className="w-full">
              {/* Ground line */}
              <line x1={10} y1={100} x2={290} y2={100} stroke="oklch(0.25 0.015 240)" strokeWidth="1" />

              {/* Human silhouette at 1.8 m */}
              {[60, 150, 240].map((x, i) => (
                <g key={x}>
                  <rect x={x - 4} y={64} width={8} height={36} rx={2} fill="oklch(0.28 0.015 240)" />
                  <circle cx={x} cy={60} r={6} fill="oklch(0.28 0.015 240)" />
                  <text x={x} y={112} textAnchor="middle" style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: "oklch(0.35 0.012 240)" }}>1.8 m</text>
                </g>
              ))}

              {/* Craft silhouette */}
              {(() => {
                const scale = diameter / 12;
                const w = 260 * scale;
                const h = 30 * scale;
                const cx2 = 150;
                const cy2 = 100 - h * 0.6;
                return (
                  <g>
                    <ellipse cx={cx2} cy={cy2} rx={w / 2} ry={h / 2}
                      fill="oklch(0.75 0.18 200 / 0.12)"
                      stroke="oklch(0.75 0.18 200 / 0.6)"
                      strokeWidth="1.5"
                    />
                    <ellipse cx={cx2} cy={cy2 - h * 0.25} rx={w * 0.25} ry={h * 0.4}
                      fill="oklch(0.75 0.18 200 / 0.08)"
                      stroke="oklch(0.75 0.18 200 / 0.4)"
                      strokeWidth="1"
                    />
                    {/* Dimension arrow */}
                    <line x1={cx2 - w / 2} y1={cy2 + h / 2 + 8} x2={cx2 + w / 2} y2={cy2 + h / 2 + 8}
                      stroke="oklch(0.75 0.18 200 / 0.5)" strokeWidth="1" />
                    <text x={cx2} y={cy2 + h / 2 + 17} textAnchor="middle"
                      style={{ fontFamily: "'JetBrains Mono'", fontSize: 8, fill: "oklch(0.75 0.18 200 / 0.8)" }}>
                      {diameter.toFixed(1)} m
                    </text>
                  </g>
                );
              })()}
            </svg>
          </div>

          {/* Regulatory threshold markers */}
          <div className="bg-navy-surface panel-border rounded-sm p-5">
            <div className="label-caps mb-3">Regulatory Thresholds</div>
            <div className="space-y-0">
              {REG_THRESHOLDS.map(t => {
                const crossed = (t.maxMass !== null && s.mass > t.maxMass) || (t.maxD !== null && diameter > t.maxD);
                const applicable = t.maxMass === null && t.maxD === null;
                const status = applicable ? "APPLIES" : crossed ? "EXCEEDED" : "WITHIN";
                const color = applicable ? "oklch(0.60 0.15 280)" : crossed ? "oklch(0.65 0.22 25)" : "oklch(0.65 0.18 145)";
                return (
                  <div key={t.label} className="flex items-start justify-between py-2" style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
                    <div>
                      <div className="label-caps" style={{ color: "oklch(0.70 0.005 240)" }}>{t.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: "oklch(0.40 0.010 240)", fontFamily: "'Inter'" }}>{t.note}</div>
                    </div>
                    <span className="label-caps px-2 py-0.5 rounded-sm shrink-0 ml-3" style={{
                      background: `${color.replace(")", " / 0.10)")}`,
                      color, border: `1px solid ${color.replace(")", " / 0.3)")}`,
                    }}>{status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
