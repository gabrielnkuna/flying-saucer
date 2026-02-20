/* =============================================================
   COMPONENT: MaterialsComparison
   Design: Classified Aerospace Dossier
   Hull material + battery chemistry selectors → live mass,
   cost, and endurance updates across the BOM.
   ============================================================= */
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

// ── Material definitions ──────────────────────────────────────
interface HullMaterial {
  id: string;
  name: string;
  shortName: string;
  density: number;       // kg/m³
  tensileStrength: number; // MPa
  costPerKg: number;     // USD/kg
  thermalClass: string;
  notes: string;
  color: string;
}

const HULL_MATERIALS: HullMaterial[] = [
  {
    id: "cfrp",
    name: "Carbon Fibre Reinforced Polymer",
    shortName: "CFRP",
    density: 1600,
    tensileStrength: 1500,
    costPerKg: 220,
    thermalClass: "Good (< 200°C)",
    notes: "Reference material. Optimal strength-to-weight. Expensive tooling.",
    color: "oklch(0.75 0.18 200)",
  },
  {
    id: "al7075",
    name: "Aluminium 7075-T6",
    shortName: "Al 7075",
    density: 2810,
    tensileStrength: 572,
    costPerKg: 12,
    thermalClass: "Excellent (< 450°C)",
    notes: "Aerospace standard. Heavier than CFRP but far cheaper. Good machinability.",
    color: "oklch(0.72 0.16 80)",
  },
  {
    id: "titanium",
    name: "Titanium Ti-6Al-4V",
    shortName: "Ti-6Al-4V",
    density: 4430,
    tensileStrength: 1100,
    costPerKg: 85,
    thermalClass: "Excellent (< 600°C)",
    notes: "High strength, excellent corrosion resistance. Heavy and expensive to machine.",
    color: "oklch(0.65 0.18 145)",
  },
  {
    id: "fibreglass",
    name: "E-Glass Fibreglass",
    shortName: "Fibreglass",
    density: 1900,
    tensileStrength: 440,
    costPerKg: 18,
    thermalClass: "Moderate (< 120°C)",
    notes: "Cheapest composite option. Lower strength than CFRP. Suitable for prototype.",
    color: "oklch(0.60 0.15 280)",
  },
];

interface BatteryChem {
  id: string;
  name: string;
  shortName: string;
  energyDensity: number;  // Wh/kg
  powerDensity: number;   // W/kg
  costPerKwh: number;     // USD/kWh
  cycleLife: number;
  safetyRating: string;
  notes: string;
  color: string;
}

const BATTERY_CHEMS: BatteryChem[] = [
  {
    id: "lipo",
    name: "Lithium Polymer (LiPo)",
    shortName: "LiPo",
    energyDensity: 200,
    powerDensity: 1500,
    costPerKwh: 200,
    cycleLife: 500,
    safetyRating: "Moderate",
    notes: "Reference chemistry. High power density. Thermal runaway risk at high C-rate.",
    color: "oklch(0.75 0.18 200)",
  },
  {
    id: "lifepo4",
    name: "Lithium Iron Phosphate (LiFePO₄)",
    shortName: "LiFePO₄",
    energyDensity: 160,
    powerDensity: 800,
    costPerKwh: 180,
    cycleLife: 2000,
    safetyRating: "Excellent",
    notes: "Safer chemistry, longer cycle life. Lower energy density increases mass.",
    color: "oklch(0.65 0.18 145)",
  },
  {
    id: "solid_state",
    name: "Solid-State (projected 2027)",
    shortName: "Solid-State",
    energyDensity: 400,
    powerDensity: 1200,
    costPerKwh: 600,
    cycleLife: 1500,
    safetyRating: "Excellent",
    notes: "Near-future technology. Doubles endurance at same mass. High cost.",
    color: "oklch(0.72 0.16 80)",
  },
  {
    id: "nmc",
    name: "Lithium NMC (21700 cells)",
    shortName: "NMC 21700",
    energyDensity: 260,
    powerDensity: 1000,
    costPerKwh: 150,
    cycleLife: 1000,
    safetyRating: "Good",
    notes: "Higher energy density than LiPo at lower cost. Good balance of all properties.",
    color: "oklch(0.60 0.15 280)",
  },
];

// ── Reference design numbers ──────────────────────────────────
const REF_HULL_MASS = 103;    // kg (hull + ring)
const REF_HULL_COST = 25500;  // USD
const REF_BATT_MASS = 282.5;  // kg
const REF_BATT_KWH = 55;
const REF_BATT_COST = 40310;  // USD
const HOVER_KW = 220;
const REF_ENDURANCE = (REF_BATT_KWH * 0.85 / HOVER_KW) * 60; // min

const REF_HULL = HULL_MATERIALS.find(m => m.id === "cfrp")!;
const REF_BATT = BATTERY_CHEMS.find(b => b.id === "lipo")!;

function computeConfig(hull: HullMaterial, batt: BatteryChem) {
  // Hull mass scales with density ratio (same geometry)
  const hullMass = REF_HULL_MASS * (hull.density / REF_HULL.density);
  const hullCost = hullMass * hull.costPerKg;

  // Battery mass: same kWh, different energy density
  const battMass = (REF_BATT_KWH / batt.energyDensity) * 1000; // kg
  const battCost = REF_BATT_KWH * batt.costPerKwh;

  const totalMass = hullMass + battMass + (800 - REF_HULL_MASS - REF_BATT_MASS); // other subsystems unchanged
  const totalCost = hullCost + battCost + (89398 - REF_HULL_COST - REF_BATT_COST);

  const endurance = (REF_BATT_KWH * 0.85 / HOVER_KW) * 60; // same kWh, same endurance
  const enduranceMass = ((REF_BATT_KWH * 0.85) / HOVER_KW) * 60; // min

  return { hullMass, hullCost, battMass, battCost, totalMass, totalCost, endurance: enduranceMass };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "oklch(0.14 0.020 240)", border: "1px solid oklch(0.28 0.015 240)", padding: "8px 12px", borderRadius: 4 }}>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "oklch(0.55 0.015 240)", marginBottom: 4 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: p.color }}>{p.name}: {p.value.toFixed(0)}</div>
      ))}
    </div>
  );
};

export default function MaterialsComparison() {
  const [hullId, setHullId] = useState("cfrp");
  const [battId, setBattId] = useState("lipo");

  const hull = HULL_MATERIALS.find(m => m.id === hullId)!;
  const batt = BATTERY_CHEMS.find(b => b.id === battId)!;
  const config = useMemo(() => computeConfig(hull, batt), [hull, batt]);
  const refConfig = useMemo(() => computeConfig(REF_HULL, REF_BATT), []);

  // Comparison chart data — all 4 hull + 4 battery combos for mass
  const chartData = HULL_MATERIALS.map(h => {
    const c = computeConfig(h, batt);
    return { name: h.shortName, Mass: Math.round(c.totalMass), Cost: Math.round(c.totalCost / 1000) };
  });

  const battChartData = BATTERY_CHEMS.map(b => {
    const c = computeConfig(hull, b);
    return { name: b.shortName, Mass: Math.round(c.battMass), "Energy Density": b.energyDensity };
  });

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Hull material */}
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="label-caps mb-3">Hull Material</div>
          <div className="space-y-2">
            {HULL_MATERIALS.map(m => (
              <button key={m.id} onClick={() => setHullId(m.id)}
                className="w-full text-left px-4 py-3 rounded-sm transition-all"
                style={{
                  background: hullId === m.id ? `${m.color.replace(")", " / 0.10)")}` : "oklch(0.12 0.018 240)",
                  border: `1px solid ${hullId === m.id ? m.color.replace(")", " / 0.45)") : "oklch(0.20 0.015 240)"}`,
                }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: m.color, flexShrink: 0 }} />
                    <span className="label-caps" style={{ color: hullId === m.id ? m.color : "oklch(0.70 0.005 240)" }}>{m.shortName}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="data-value text-xs" style={{ color: "oklch(0.55 0.015 240)" }}>{m.density} kg/m³</span>
                    <span className="data-value text-xs" style={{ color: "oklch(0.72 0.16 80)" }}>${m.costPerKg}/kg</span>
                  </div>
                </div>
                {hullId === m.id && (
                  <div className="text-xs mt-1.5" style={{ color: "oklch(0.50 0.010 240)", fontFamily: "'Inter'" }}>{m.notes}</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Battery chemistry */}
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="label-caps mb-3">Battery Chemistry</div>
          <div className="space-y-2">
            {BATTERY_CHEMS.map(b => (
              <button key={b.id} onClick={() => setBattId(b.id)}
                className="w-full text-left px-4 py-3 rounded-sm transition-all"
                style={{
                  background: battId === b.id ? `${b.color.replace(")", " / 0.10)")}` : "oklch(0.12 0.018 240)",
                  border: `1px solid ${battId === b.id ? b.color.replace(")", " / 0.45)") : "oklch(0.20 0.015 240)"}`,
                }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: b.color, flexShrink: 0 }} />
                    <span className="label-caps" style={{ color: battId === b.id ? b.color : "oklch(0.70 0.005 240)" }}>{b.shortName}</span>
                  </div>
                  <div className="flex gap-3">
                    <span className="data-value text-xs" style={{ color: "oklch(0.65 0.18 145)" }}>{b.energyDensity} Wh/kg</span>
                    <span className="data-value text-xs" style={{ color: "oklch(0.72 0.16 80)" }}>${b.costPerKwh}/kWh</span>
                  </div>
                </div>
                {battId === b.id && (
                  <div className="text-xs mt-1.5" style={{ color: "oklch(0.50 0.010 240)", fontFamily: "'Inter'" }}>{b.notes}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live results */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Mass", cur: `${config.totalMass.toFixed(0)} kg`, delta: config.totalMass - refConfig.totalMass, unit: "kg", color: "oklch(0.75 0.18 200)" },
          { label: "Hull Mass", cur: `${config.hullMass.toFixed(0)} kg`, delta: config.hullMass - refConfig.hullMass, unit: "kg", color: "oklch(0.72 0.16 80)" },
          { label: "Battery Mass", cur: `${config.battMass.toFixed(0)} kg`, delta: config.battMass - refConfig.battMass, unit: "kg", color: "oklch(0.65 0.18 145)" },
          { label: "Total BOM Cost", cur: `$${config.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, delta: config.totalCost - refConfig.totalCost, unit: "USD", color: "oklch(0.72 0.16 80)" },
        ].map(({ label, cur, delta, unit, color }) => {
          const sign = delta >= 0 ? "+" : "";
          const deltaColor = delta > 0 ? "oklch(0.65 0.22 25)" : delta < 0 ? "oklch(0.65 0.18 145)" : "oklch(0.45 0.015 240)";
          return (
            <div key={label} className="bg-navy-surface panel-border rounded-sm p-4 text-center">
              <div className="label-caps mb-1">{label}</div>
              <div className="data-value text-xl" style={{ color }}>{cur}</div>
              <div className="label-caps mt-1" style={{ color: deltaColor, fontSize: 10 }}>
                {sign}{unit === "USD" ? "$" : ""}{Math.abs(delta).toLocaleString(undefined, { maximumFractionDigits: 0 })}{unit !== "USD" ? ` ${unit}` : ""} vs ref
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="label-caps mb-3">Total Mass by Hull Material (current battery)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.015 240)" />
              <XAxis dataKey="name" tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.45 0.015 240)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.45 0.015 240)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Mass" fill="oklch(0.75 0.18 200 / 0.7)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="label-caps mb-3">Battery Mass vs Energy Density (current hull)</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={battChartData} margin={{ left: -10, right: 10, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.015 240)" />
              <XAxis dataKey="name" tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.45 0.015 240)" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.45 0.015 240)" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.45 0.015 240)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "oklch(0.50 0.015 240)" }} />
              <Bar yAxisId="left" dataKey="Mass" fill="oklch(0.72 0.16 80 / 0.7)" radius={[2, 2, 0, 0]} />
              <Bar yAxisId="right" dataKey="Energy Density" fill="oklch(0.65 0.18 145 / 0.7)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Material property comparison table */}
      <div className="bg-navy-surface panel-border rounded-sm p-5">
        <div className="label-caps mb-3">Full Material Property Comparison</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid oklch(0.22 0.015 240)" }}>
                {["Property", ...HULL_MATERIALS.map(m => m.shortName)].map(h => (
                  <th key={h} className="py-2 label-caps text-left pr-4" style={{ color: "oklch(0.45 0.015 240)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { prop: "Density (kg/m³)", vals: HULL_MATERIALS.map(m => m.density.toString()) },
                { prop: "Tensile Str. (MPa)", vals: HULL_MATERIALS.map(m => m.tensileStrength.toString()) },
                { prop: "Cost (USD/kg)", vals: HULL_MATERIALS.map(m => `$${m.costPerKg}`) },
                { prop: "Hull Mass (kg)", vals: HULL_MATERIALS.map(m => computeConfig(m, batt).hullMass.toFixed(0)) },
                { prop: "Hull Cost (USD)", vals: HULL_MATERIALS.map(m => `$${computeConfig(m, batt).hullCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`) },
                { prop: "Thermal Class", vals: HULL_MATERIALS.map(m => m.thermalClass) },
              ].map(row => (
                <tr key={row.prop} style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
                  <td className="py-2 label-caps pr-4" style={{ color: "oklch(0.55 0.015 240)" }}>{row.prop}</td>
                  {row.vals.map((v, i) => (
                    <td key={i} className="py-2 pr-4 data-value" style={{
                      color: HULL_MATERIALS[i].id === hullId ? HULL_MATERIALS[i].color : "oklch(0.65 0.005 240)",
                      fontFamily: "'JetBrains Mono'", fontSize: 11,
                      fontWeight: HULL_MATERIALS[i].id === hullId ? 700 : 400,
                    }}>{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
