/* =============================================================
   COMPONENT: BillOfMaterials
   Design: Classified Aerospace Dossier
   Costed BOM with mass and power budget breakdowns
   from Steps 7–10 of the original design conversation
   ============================================================= */
import { useState } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

// ── BOM Data ──────────────────────────────────────────────────
interface BOMItem {
  id: string;
  subsystem: string;
  component: string;
  qty: number;
  unitMass: number;   // kg
  unitPower: number;  // W (continuous, 0 if passive)
  unitCost: number;   // USD estimate
  notes: string;
  category: "propulsion" | "power" | "structure" | "control" | "sensors" | "vectoring";
}

const BOM: BOMItem[] = [
  // Propulsion
  { id: "P1", subsystem: "Propulsion", component: "High-power ducted fan module (12\" impeller)", qty: 16, unitMass: 1.8, unitPower: 13750, unitCost: 420, notes: "Brushless, 6–8 kW each at peak", category: "propulsion" },
  { id: "P2", subsystem: "Propulsion", component: "Motor ESC (80A, 12S)", qty: 16, unitMass: 0.22, unitPower: 0, unitCost: 85, notes: "CAN-bus addressable", category: "propulsion" },
  { id: "P3", subsystem: "Propulsion", component: "Plenum chamber (carbon fibre)", qty: 1, unitMass: 4.5, unitPower: 0, unitCost: 1200, notes: "Central pressure equaliser", category: "propulsion" },
  { id: "P4", subsystem: "Propulsion", component: "Annular exhaust duct (CFRP)", qty: 1, unitMass: 6.0, unitPower: 0, unitCost: 2200, notes: "360° outlet ring, 4–8 m diameter", category: "propulsion" },
  // Vectoring
  { id: "V1", subsystem: "Vectoring", component: "Segmented vane actuator (servo + linkage)", qty: 32, unitMass: 0.18, unitPower: 8, unitCost: 65, notes: "2 per fan module", category: "vectoring" },
  { id: "V2", subsystem: "Vectoring", component: "Vane segment (CFRP)", qty: 32, unitMass: 0.12, unitPower: 0, unitCost: 30, notes: "Replaceable", category: "vectoring" },
  // Power
  { id: "E1", subsystem: "Power", component: "LiPo/LiFePO4 battery pack (55 kWh)", qty: 1, unitMass: 280, unitPower: 0, unitCost: 38500, notes: "~280 kg at 200 Wh/kg; main mass driver", category: "power" },
  { id: "E2", subsystem: "Power", component: "Power distribution board (400A)", qty: 2, unitMass: 1.2, unitPower: 0, unitCost: 340, notes: "Redundant pair", category: "power" },
  { id: "E3", subsystem: "Power", component: "BMS (battery management system)", qty: 1, unitMass: 0.8, unitPower: 15, unitCost: 650, notes: "Cell balancing + thermal protection", category: "power" },
  { id: "E4", subsystem: "Power", component: "DC-DC converters (48V → 12V/5V)", qty: 4, unitMass: 0.3, unitPower: 0, unitCost: 120, notes: "Avionics rail supply", category: "power" },
  // Structure
  { id: "S1", subsystem: "Structure", component: "Main hull (CFRP sandwich)", qty: 1, unitMass: 85, unitPower: 0, unitCost: 22000, notes: "Upper dome + lower disc", category: "structure" },
  { id: "S2", subsystem: "Structure", component: "Fan mounting ring (Al 7075)", qty: 1, unitMass: 18, unitPower: 0, unitCost: 3500, notes: "16-position precision ring", category: "structure" },
  { id: "S3", subsystem: "Structure", component: "Landing gear (retractable, 3-point)", qty: 3, unitMass: 4.5, unitPower: 12, unitCost: 480, notes: "Electric retract", category: "structure" },
  // Control
  { id: "C1", subsystem: "Control", component: "Flight controller (custom FPGA + ARM)", qty: 2, unitMass: 0.35, unitPower: 18, unitCost: 1800, notes: "Redundant pair, 500 Hz loop", category: "control" },
  { id: "C2", subsystem: "Control", component: "IMU (9-DOF, tactical grade)", qty: 3, unitMass: 0.08, unitPower: 2, unitCost: 420, notes: "Triple redundant", category: "control" },
  { id: "C3", subsystem: "Control", component: "Barometric altimeter", qty: 2, unitMass: 0.02, unitPower: 1, unitCost: 45, notes: "Redundant pair", category: "control" },
  { id: "C4", subsystem: "Control", component: "Optical flow sensor", qty: 2, unitMass: 0.06, unitPower: 3, unitCost: 180, notes: "Downward-facing, position hold", category: "control" },
  { id: "C5", subsystem: "Control", component: "GPS/GNSS module (RTK)", qty: 1, unitMass: 0.12, unitPower: 4, unitCost: 380, notes: "Centimetre-level positioning", category: "control" },
  // Sensors
  { id: "SR1", subsystem: "Sensors", component: "360° LiDAR (obstacle detection)", qty: 1, unitMass: 0.9, unitPower: 8, unitCost: 1200, notes: "Proximity field for repulsion controller", category: "sensors" },
  { id: "SR2", subsystem: "Sensors", component: "Ultrasonic rangefinder (ground)", qty: 4, unitMass: 0.05, unitPower: 1, unitCost: 22, notes: "Low-altitude terrain following", category: "sensors" },
  { id: "SR3", subsystem: "Sensors", component: "Thermal camera (hull monitoring)", qty: 1, unitMass: 0.18, unitPower: 5, unitCost: 650, notes: "Motor/ESC thermal watch", category: "sensors" },
];

const CATEGORY_COLORS: Record<string, string> = {
  propulsion: "oklch(0.75 0.18 200)",
  power: "oklch(0.72 0.16 80)",
  structure: "oklch(0.65 0.18 145)",
  control: "oklch(0.60 0.15 280)",
  sensors: "oklch(0.65 0.22 25)",
  vectoring: "oklch(0.68 0.18 170)",
};

type BudgetTab = "cost" | "mass" | "power";

function sumBy(items: BOMItem[], field: "cost" | "mass" | "power") {
  return items.reduce((s, item) => {
    if (field === "cost") return s + item.qty * item.unitCost;
    if (field === "mass") return s + item.qty * item.unitMass;
    return s + item.qty * item.unitPower;
  }, 0);
}

function getBudgetByCategory(field: BudgetTab) {
  const cats = Array.from(new Set(BOM.map(i => i.category)));
  return cats.map(cat => {
    const items = BOM.filter(i => i.category === cat);
    return {
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: sumBy(items, field),
      color: CATEGORY_COLORS[cat],
    };
  }).filter(d => d.value > 0).sort((a, b) => b.value - a.value);
}

function fmt(n: number, field: BudgetTab) {
  if (field === "cost") return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;
  if (field === "mass") return n >= 1000 ? `${(n / 1000).toFixed(2)} t` : `${n.toFixed(1)} kg`;
  return n >= 1000 ? `${(n / 1000).toFixed(1)} kW` : `${n.toFixed(0)} W`;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "oklch(0.14 0.020 240)", border: "1px solid oklch(0.28 0.015 240)", padding: "8px 12px", borderRadius: 4 }}>
      <div style={{ fontFamily: "'Rajdhani'", fontSize: 12, color: payload[0].payload.color, fontWeight: 700 }}>{payload[0].name}</div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "oklch(0.88 0.005 240)" }}>{payload[0].value?.toFixed ? payload[0].value.toFixed(0) : payload[0].value}</div>
    </div>
  );
};

export default function BillOfMaterials() {
  const [activeTab, setActiveTab] = useState<BudgetTab>("cost");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const totalCost = sumBy(BOM, "cost");
  const totalMass = sumBy(BOM, "mass");
  const totalPower = sumBy(BOM, "power");

  const budgetData = getBudgetByCategory(activeTab);
  const filteredBOM = filterCat ? BOM.filter(i => i.category === filterCat) : BOM;

  const tabLabel = activeTab === "cost" ? "USD" : activeTab === "mass" ? "kg" : "W";
  const tabTotal = activeTab === "cost" ? totalCost : activeTab === "mass" ? totalMass : totalPower;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total BOM Cost", value: fmt(totalCost, "cost"), sub: "USD estimate", color: "oklch(0.72 0.16 80)" },
          { label: "Total Mass", value: fmt(totalMass, "mass"), sub: "incl. 55 kWh battery", color: "oklch(0.75 0.18 200)" },
          { label: "Continuous Power", value: fmt(totalPower, "power"), sub: "hover + avionics", color: "oklch(0.65 0.18 145)" },
        ].map(card => (
          <div key={card.label} className="rounded-sm p-4" style={{ background: "oklch(0.14 0.020 240)", border: `1px solid ${card.color.replace(")", " / 0.3)")}` }}>
            <div className="label-caps mb-1">{card.label}</div>
            <div style={{ fontFamily: "'JetBrains Mono'", fontSize: "clamp(1.1rem, 2vw, 1.5rem)", fontWeight: 600, color: card.color }}>{card.value}</div>
            <div className="label-caps mt-1" style={{ color: "oklch(0.40 0.012 240)" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Budget breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="label-caps">Budget Breakdown</div>
            <div className="flex gap-1 ml-auto">
              {(["cost", "mass", "power"] as BudgetTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="px-2 py-1 rounded-sm text-xs transition-all"
                  style={{
                    fontFamily: "'JetBrains Mono'",
                    background: activeTab === tab ? "oklch(0.75 0.18 200 / 0.15)" : "oklch(0.18 0.018 240)",
                    border: `1px solid ${activeTab === tab ? "oklch(0.75 0.18 200 / 0.5)" : "oklch(0.25 0.015 240)"}`,
                    color: activeTab === tab ? "oklch(0.75 0.18 200)" : "oklch(0.50 0.015 240)",
                  }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={budgetData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="value"
                onClick={(d) => setFilterCat(filterCat === d.name.toLowerCase() ? null : d.name.toLowerCase())}
                style={{ cursor: "pointer" }}
              >
                {budgetData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} opacity={filterCat && filterCat !== entry.name.toLowerCase() ? 0.3 : 1} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            {budgetData.map(d => (
              <button
                key={d.name}
                onClick={() => setFilterCat(filterCat === d.name.toLowerCase() ? null : d.name.toLowerCase())}
                className="flex items-center gap-2 text-left"
              >
                <div style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                <span className="label-caps" style={{ color: filterCat === d.name.toLowerCase() ? d.color : "oklch(0.55 0.015 240)" }}>
                  {d.name}
                </span>
                <span className="data-value text-xs ml-auto" style={{ color: "oklch(0.65 0.008 240)" }}>
                  {((d.value / tabTotal) * 100).toFixed(0)}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Bar chart */}
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="label-caps mb-4">By Subsystem ({tabLabel})</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={budgetData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.20 0.015 240)" horizontal={false} />
              <XAxis type="number" tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.45 0.015 240)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontFamily: "'Rajdhani'", fontSize: 11, fill: "oklch(0.60 0.015 240)" }} axisLine={false} tickLine={false} width={72} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                {budgetData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} opacity={filterCat && filterCat !== entry.name.toLowerCase() ? 0.25 : 0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* BOM Table */}
      <div className="bg-navy-surface panel-border rounded-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid oklch(0.20 0.015 240)" }}>
          <div className="label-caps">
            Bill of Materials
            {filterCat && <span style={{ color: CATEGORY_COLORS[filterCat], marginLeft: 8 }}>· {filterCat.toUpperCase()}</span>}
          </div>
          {filterCat && (
            <button onClick={() => setFilterCat(null)} className="label-caps" style={{ color: "oklch(0.65 0.22 25)" }}>
              CLEAR FILTER ×
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "oklch(0.12 0.022 240)" }}>
                {["ID", "Component", "Qty", "Unit Mass", "Unit Power", "Unit Cost", "Total Cost", "Notes"].map(h => (
                  <th key={h} className="label-caps text-left px-4 py-2.5" style={{ whiteSpace: "nowrap", borderBottom: "1px solid oklch(0.22 0.015 240)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBOM.map(item => {
                const isExp = expandedItem === item.id;
                const color = CATEGORY_COLORS[item.category];
                return (
                  <tr
                    key={item.id}
                    onClick={() => setExpandedItem(isExp ? null : item.id)}
                    style={{
                      borderBottom: "1px solid oklch(0.17 0.015 240)",
                      background: isExp ? `${color.replace(")", " / 0.06)")}` : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    <td className="px-4 py-2.5">
                      <span className="data-value" style={{ color }}>{item.id}</span>
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "oklch(0.82 0.005 240)", fontFamily: "'Inter'", maxWidth: 220 }}>
                      {item.component}
                    </td>
                    <td className="px-4 py-2.5 data-value" style={{ color: "oklch(0.65 0.008 240)" }}>{item.qty}</td>
                    <td className="px-4 py-2.5 data-value" style={{ color: "oklch(0.65 0.008 240)" }}>{item.unitMass} kg</td>
                    <td className="px-4 py-2.5 data-value" style={{ color: item.unitPower > 0 ? "oklch(0.65 0.18 145)" : "oklch(0.35 0.012 240)" }}>
                      {item.unitPower > 0 ? `${item.unitPower} W` : "—"}
                    </td>
                    <td className="px-4 py-2.5 data-value" style={{ color: "oklch(0.72 0.16 80)" }}>
                      ${item.unitCost.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 data-value" style={{ color: "oklch(0.72 0.16 80)", fontWeight: 600 }}>
                      ${(item.qty * item.unitCost).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: "oklch(0.50 0.010 240)", fontFamily: "'Inter'", maxWidth: 200 }}>
                      {item.notes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "oklch(0.12 0.022 240)", borderTop: "2px solid oklch(0.25 0.015 240)" }}>
                <td colSpan={2} className="px-4 py-3 label-caps" style={{ color: "oklch(0.75 0.18 200)" }}>TOTALS</td>
                <td className="px-4 py-3 data-value" style={{ color: "oklch(0.88 0.005 240)" }}>
                  {filteredBOM.reduce((s, i) => s + i.qty, 0)}
                </td>
                <td className="px-4 py-3 data-value" style={{ color: "oklch(0.75 0.18 200)" }}>
                  {sumBy(filteredBOM, "mass").toFixed(1)} kg
                </td>
                <td className="px-4 py-3 data-value" style={{ color: "oklch(0.65 0.18 145)" }}>
                  {(sumBy(filteredBOM, "power") / 1000).toFixed(1)} kW
                </td>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 data-value" style={{ color: "oklch(0.72 0.16 80)", fontWeight: 700 }}>
                  ${sumBy(filteredBOM, "cost").toLocaleString()}
                </td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="px-5 py-2 label-caps" style={{ color: "oklch(0.35 0.012 240)", borderTop: "1px solid oklch(0.17 0.015 240)" }}>
          Click any row to highlight · Click category in chart to filter · All costs are USD estimates (2025 component pricing)
        </div>
      </div>

      {/* Mass budget note */}
      <div className="rounded-sm p-4" style={{ background: "oklch(0.72 0.16 80 / 0.06)", border: "1px solid oklch(0.72 0.16 80 / 0.25)" }}>
        <div className="label-caps mb-2" style={{ color: "oklch(0.72 0.16 80)" }}>Mass Budget Note</div>
        <p className="text-xs leading-relaxed" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'" }}>
          The battery pack (55 kWh at 200 Wh/kg) accounts for approximately 35% of the total 800 kg target mass. Improving energy density to 300 Wh/kg (near-term solid-state) reduces battery mass to ~183 kg, freeing ~97 kg for additional payload or structural margin. The hull and fan ring together represent ~13% of total mass and are the primary structural cost drivers.
        </p>
      </div>
    </div>
  );
}
