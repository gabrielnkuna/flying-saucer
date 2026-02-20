/* =============================================================
   COMPONENT: ConfigComparison
   Design: Classified Aerospace Dossier
   Side-by-side configuration comparison: pin a baseline and
   compare with a modified config. Shows deltas for mass, cost,
   endurance, power, regulatory status.
   ============================================================= */
import { useState, useMemo } from "react";

// ── Types ──────────────────────────────────────────────────────
interface Config {
  diameter: number;        // metres
  hull: string;
  battery: string;
}

// ── Data tables ────────────────────────────────────────────────
const HULL_DATA: Record<string, { label: string; density: number; costPerKg: number; color: string }> = {
  cfrp:  { label: "CFRP",        density: 1.55, costPerKg: 120, color: "oklch(0.75 0.18 200)" },
  al7075:{ label: "Al 7075",     density: 2.81, costPerKg: 18,  color: "oklch(0.72 0.16 80)"  },
  ti6al4v:{ label: "Ti-6Al-4V",  density: 4.43, costPerKg: 210, color: "oklch(0.65 0.22 25)"  },
  fibreglass:{ label: "Fibreglass", density: 1.85, costPerKg: 12, color: "oklch(0.65 0.18 145)" },
};

const BATTERY_DATA: Record<string, { label: string; energyDensity: number; costPerKwh: number; color: string }> = {
  lipo:      { label: "LiPo",        energyDensity: 200, costPerKwh: 300, color: "oklch(0.75 0.18 200)" },
  lifepo4:   { label: "LiFePO₄",     energyDensity: 150, costPerKwh: 250, color: "oklch(0.72 0.16 80)"  },
  solidstate:{ label: "Solid-State",  energyDensity: 350, costPerKwh: 900, color: "oklch(0.65 0.22 25)"  },
  nmc:       { label: "NMC",          energyDensity: 250, costPerKwh: 350, color: "oklch(0.65 0.18 145)" },
};

// ── Derived specs ──────────────────────────────────────────────
function deriveSpecs(cfg: Config) {
  const r = cfg.diameter / 2;
  const hullArea = 2 * Math.PI * r * r * 0.6; // m² (approx disc shell)
  const hullThickness = 0.012; // m
  const hullVol = hullArea * hullThickness;
  const hull = HULL_DATA[cfg.hull];
  const bat  = BATTERY_DATA[cfg.battery];

  const hullMass = hullVol * hull.density * 1000; // kg
  const fanCount = Math.round(cfg.diameter * 2);
  const hoverPower = fanCount * 13.75; // kW
  const burstPower  = hoverPower * 1.6;
  const batteryKwh  = hoverPower * 0.25; // 15 min hover
  const batteryMass = (batteryKwh * 1000) / bat.energyDensity; // kg
  const totalMass   = hullMass + batteryMass + fanCount * 8 + 60; // +avionics
  const hoverTime   = (batteryKwh / hoverPower) * 60; // minutes
  const hullCost    = hullMass * hull.costPerKg;
  const batCost     = batteryKwh * bat.costPerKwh;
  const totalCost   = hullCost + batCost + fanCount * 2200 + 45000; // fans + avionics

  // Regulatory
  const regFlags: string[] = [];
  if (cfg.diameter > 2) regFlags.push("Part 107 waiver required");
  if (totalMass > 25)   regFlags.push("MTOW > 25 kg — type cert");
  if (hoverPower > 100) regFlags.push("High-power RF/EMI review");
  if (cfg.diameter > 6) regFlags.push("Airspace class B/C/D restriction");

  return { hullMass, batteryMass, totalMass, hoverPower, burstPower, batteryKwh, hoverTime, totalCost, fanCount, regFlags };
}

const METRICS = [
  { key: "totalMass",   label: "Total Mass",    unit: "kg",  fmt: (v: number) => v.toFixed(0), higherIsBetter: false },
  { key: "hoverPower",  label: "Hover Power",   unit: "kW",  fmt: (v: number) => v.toFixed(1), higherIsBetter: false },
  { key: "burstPower",  label: "Burst Power",   unit: "kW",  fmt: (v: number) => v.toFixed(1), higherIsBetter: false },
  { key: "batteryKwh",  label: "Battery",       unit: "kWh", fmt: (v: number) => v.toFixed(1), higherIsBetter: true  },
  { key: "hoverTime",   label: "Hover Time",    unit: "min", fmt: (v: number) => v.toFixed(1), higherIsBetter: true  },
  { key: "totalCost",   label: "Est. Cost",     unit: "k$",  fmt: (v: number) => (v/1000).toFixed(0), higherIsBetter: false },
  { key: "fanCount",    label: "Fan Modules",   unit: "",    fmt: (v: number) => v.toFixed(0), higherIsBetter: null  },
];

function ConfigPanel({ label, cfg, onChange, color }: {
  label: string; cfg: Config;
  onChange: (cfg: Config) => void;
  color: string;
}) {
  return (
    <div className="rounded-sm p-5 flex flex-col gap-4" style={{ background: "oklch(0.13 0.020 240)", border: `1px solid ${color.replace(")", " / 0.35)")}` }}>
      <div className="label-caps" style={{ color }}>{label}</div>

      {/* Diameter */}
      <div>
        <div className="flex justify-between mb-1">
          <span className="label-caps" style={{ fontSize: 9, color: "oklch(0.45 0.015 240)" }}>DIAMETER</span>
          <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, color }}>{cfg.diameter} m</span>
        </div>
        <input type="range" min={2} max={12} step={0.5} value={cfg.diameter}
          onChange={e => onChange({ ...cfg, diameter: +e.target.value })}
          className="w-full h-1 rounded-full appearance-none"
          style={{ accentColor: color }} />
        <div className="flex justify-between mt-0.5">
          <span className="label-caps" style={{ fontSize: 7, color: "oklch(0.30 0.012 240)" }}>2 m</span>
          <span className="label-caps" style={{ fontSize: 7, color: "oklch(0.30 0.012 240)" }}>12 m</span>
        </div>
      </div>

      {/* Hull */}
      <div>
        <div className="label-caps mb-1.5" style={{ fontSize: 9, color: "oklch(0.45 0.015 240)" }}>HULL MATERIAL</div>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(HULL_DATA).map(([k, v]) => (
            <button key={k} onClick={() => onChange({ ...cfg, hull: k })}
              className="px-2 py-1 rounded-sm text-left transition-all"
              style={{
                background: cfg.hull === k ? `${v.color.replace(")", " / 0.12)")}` : "oklch(0.11 0.018 240)",
                border: `1px solid ${cfg.hull === k ? v.color.replace(")", " / 0.50)") : "oklch(0.20 0.015 240)"}`,
              }}>
              <span className="label-caps" style={{ fontSize: 8, color: cfg.hull === k ? v.color : "oklch(0.42 0.012 240)" }}>{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Battery */}
      <div>
        <div className="label-caps mb-1.5" style={{ fontSize: 9, color: "oklch(0.45 0.015 240)" }}>BATTERY CHEMISTRY</div>
        <div className="grid grid-cols-2 gap-1.5">
          {Object.entries(BATTERY_DATA).map(([k, v]) => (
            <button key={k} onClick={() => onChange({ ...cfg, battery: k })}
              className="px-2 py-1 rounded-sm text-left transition-all"
              style={{
                background: cfg.battery === k ? `${v.color.replace(")", " / 0.12)")}` : "oklch(0.11 0.018 240)",
                border: `1px solid ${cfg.battery === k ? v.color.replace(")", " / 0.50)") : "oklch(0.20 0.015 240)"}`,
              }}>
              <span className="label-caps" style={{ fontSize: 8, color: cfg.battery === k ? v.color : "oklch(0.42 0.012 240)" }}>{v.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ConfigComparison() {
  const [baselineCfg, setBaselineCfg] = useState<Config>({ diameter: 6, hull: "cfrp", battery: "lipo" });
  const [compareCfg,  setCompareCfg]  = useState<Config>({ diameter: 6, hull: "al7075", battery: "solidstate" });

  const baseSpecs = useMemo(() => deriveSpecs(baselineCfg), [baselineCfg]);
  const cmpSpecs  = useMemo(() => deriveSpecs(compareCfg),  [compareCfg]);

  type NumericKey = "hullMass" | "batteryMass" | "totalMass" | "hoverPower" | "burstPower" | "batteryKwh" | "hoverTime" | "totalCost" | "fanCount";

  const getNum = (specs: ReturnType<typeof deriveSpecs>, key: string): number =>
    specs[key as NumericKey] as number;

  const getDelta = (key: string) => getNum(cmpSpecs, key) - getNum(baseSpecs, key);

  const getDeltaColor = (key: string, higherIsBetter: boolean | null) => {
    const d = getDelta(key);
    if (Math.abs(d) < 0.01 || higherIsBetter === null) return "oklch(0.50 0.010 240)";
    if (d > 0) return higherIsBetter ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)";
    return higherIsBetter ? "oklch(0.65 0.22 25)" : "oklch(0.65 0.18 145)";
  };

  return (
    <div>
      {/* Config panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
        <ConfigPanel label="BASELINE CONFIG" cfg={baselineCfg} onChange={setBaselineCfg} color="oklch(0.75 0.18 200)" />
        <ConfigPanel label="COMPARE CONFIG"  cfg={compareCfg}  onChange={setCompareCfg}  color="oklch(0.72 0.16 80)"  />
      </div>

      {/* Delta table */}
      <div className="rounded-sm overflow-hidden" style={{ border: "1px solid oklch(0.20 0.015 240)" }}>
        <div className="px-4 py-2" style={{ background: "oklch(0.13 0.020 240)", borderBottom: "1px solid oklch(0.20 0.015 240)" }}>
          <span className="label-caps" style={{ fontSize: 9, color: "oklch(0.50 0.015 240)" }}>DELTA ANALYSIS — COMPARE vs. BASELINE</span>
        </div>
        <div>
          {METRICS.map((m, i) => {
            const delta   = getDelta(m.key);
            const baseVal = getNum(baseSpecs, m.key);
            const pct     = baseVal !== 0 ? (delta / baseVal) * 100 : 0;
            const dColor  = getDeltaColor(m.key, m.higherIsBetter);
            return (
              <div key={m.key} className="grid grid-cols-4 items-center px-4 py-2.5"
                style={{ background: i % 2 === 0 ? "oklch(0.11 0.018 240)" : "oklch(0.12 0.020 240)", borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
                <span className="label-caps" style={{ fontSize: 9, color: "oklch(0.50 0.015 240)" }}>{m.label}</span>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "oklch(0.75 0.18 200)" }}>
                  {m.fmt(getNum(baseSpecs, m.key))}{m.unit && <span style={{ fontSize: 9, color: "oklch(0.40 0.012 240)" }}> {m.unit}</span>}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "oklch(0.72 0.16 80)" }}>
                  {m.fmt(getNum(cmpSpecs, m.key))}{m.unit && <span style={{ fontSize: 9, color: "oklch(0.40 0.012 240)" }}> {m.unit}</span>}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: dColor }}>
                  {delta >= 0 ? "+" : ""}{m.fmt(delta)}{m.unit && <span style={{ fontSize: 9 }}> {m.unit}</span>}
                  <span style={{ fontSize: 9, color: `${dColor.replace(")", " / 0.60)")}`, marginLeft: 4 }}>
                    ({pct >= 0 ? "+" : ""}{pct.toFixed(1)}%)
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-4 px-4 py-1.5" style={{ background: "oklch(0.10 0.018 240)", borderTop: "1px solid oklch(0.16 0.015 240)" }}>
          {["METRIC", "BASELINE", "COMPARE", "DELTA"].map(h => (
            <span key={h} className="label-caps" style={{ fontSize: 7, color: "oklch(0.30 0.012 240)" }}>{h}</span>
          ))}
        </div>
      </div>

      {/* Regulatory comparison */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "BASELINE REGULATORY FLAGS", flags: baseSpecs.regFlags, color: "oklch(0.75 0.18 200)" },
          { label: "COMPARE REGULATORY FLAGS",  flags: cmpSpecs.regFlags,  color: "oklch(0.72 0.16 80)"  },
        ].map(col => (
          <div key={col.label} className="rounded-sm p-4" style={{ background: "oklch(0.13 0.020 240)", border: `1px solid ${col.color.replace(")", " / 0.25)")}` }}>
            <div className="label-caps mb-2" style={{ fontSize: 9, color: col.color }}>{col.label}</div>
            {col.flags.length === 0 ? (
              <div className="flex items-center gap-2">
                <span style={{ color: "oklch(0.65 0.18 145)", fontSize: 10 }}>✓</span>
                <span className="text-xs" style={{ color: "oklch(0.65 0.18 145)", fontFamily: "'Inter'" }}>No additional regulatory flags</span>
              </div>
            ) : (
              <ul className="space-y-1">
                {col.flags.map(f => (
                  <li key={f} className="flex items-start gap-2">
                    <span style={{ color: "oklch(0.65 0.22 25)", fontSize: 8, marginTop: 2, flexShrink: 0 }}>▶</span>
                    <span className="text-xs" style={{ color: "oklch(0.58 0.008 240)", fontFamily: "'Inter'" }}>{f}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
