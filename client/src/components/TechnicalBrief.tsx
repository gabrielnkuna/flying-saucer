/* =============================================================
   COMPONENT: TechnicalBrief
   Design: Classified Aerospace Dossier
   Printable single-page technical brief consolidating all
   key specs, BOM totals, compliance summary, and performance
   envelope. Print button triggers window.print().
   ============================================================= */
import { useRef } from "react";

const BRIEF_DATE = "20 FEB 2026";
const VERSION = "v4.0";

const SPECS = [
  { label: "Configuration", value: "Annular ducted fan array" },
  { label: "Diameter", value: "4–8 m (scalable)" },
  { label: "Total Mass", value: "800 kg (design target)" },
  { label: "Fan Modules", value: "16 × 12″ ducted fans" },
  { label: "Vector Segments", value: "32 (2 per fan)" },
  { label: "Hover Power", value: "220 kW continuous" },
  { label: "Burst Power", value: "350 kW (< 30 s)" },
  { label: "Battery", value: "55 kWh LiPo/LiFePO₄" },
  { label: "Hover Endurance", value: "~15 min (hover only)" },
  { label: "Max Lateral Accel", value: "0.35 g (burst)" },
  { label: "Sustained Lateral", value: "0.15 g (flat glide)" },
  { label: "Snap-stop Decel", value: "0.25–0.35 g" },
  { label: "Control Rate", value: "500 Hz (inner loop)" },
  { label: "Fan Fault Tolerance", value: "Up to 4 fans (1 zone)" },
  { label: "Acoustic (damped)", value: "~72 dB SPL @ 1 m hover" },
  { label: "BPF Attenuation", value: "~14 dB (plenum damping)" },
];

const BOM_SUMMARY = [
  { subsystem: "Power (Battery + BMS)", mass: 282.5, cost: 40310, power: 15 },
  { subsystem: "Structure (Hull + Ring)", mass: 103, cost: 25500, power: 0 },
  { subsystem: "Propulsion (Fans + Plenum)", mass: 68.7, cost: 11480, power: 220000 },
  { subsystem: "Vectoring (Vanes + Actuators)", mass: 9.6, cost: 3040, power: 256 },
  { subsystem: "Avionics + Sensors", mass: 1.76, cost: 7628, power: 42 },
  { subsystem: "Landing Gear", mass: 13.5, cost: 1440, power: 36 },
];

const COMPLIANCE_SUMMARY = [
  { item: "Weight category", status: "FAIL", note: "Requires Type Certificate (14 CFR Part 21 / EASA CERTIFIED)" },
  { item: "Airspace (Class G < 400 ft)", status: "CONDITIONAL", note: "COA required for each operation" },
  { item: "Noise (Part 36 / CS-36)", status: "CONDITIONAL", note: "Likely pass with plenum damping; formal test required" },
  { item: "ADS-B Out", status: "FAIL", note: "Module not in BOM; required for controlled airspace" },
  { item: "Navigation lights", status: "FAIL", note: "Not in BOM; required for any operation" },
  { item: "ELT (406 MHz)", status: "FAIL", note: "Not in BOM; required for registered aircraft" },
  { item: "Dual flight controllers", status: "PASS", note: "Dual FPGA+ARM with triple IMU satisfies single-failure requirement" },
  { item: "Battery management system", status: "PASS", note: "BMS with cell balancing meets CS-23 electrical requirements" },
];

const PERFORMANCE_TABLE = [
  { manoeuvre: "Establishing hover", accel: "0 g", duration: "Continuous", notes: "Pinned in space, micro-stabilisation" },
  { manoeuvre: "Flat glide", accel: "0.15 g sustained", duration: "Continuous", notes: "Core UFO signature move, tilt < 5°" },
  { manoeuvre: "Burst lateral", accel: "0.30 g", duration: "2–3 s", notes: "Snap moves, jerk-limited onset" },
  { manoeuvre: "Snap stop", accel: "0.25–0.35 g decel", duration: "< 4 s", notes: "From 10 m/s to hover in ~19 m" },
  { manoeuvre: "Obstacle repulsion", accel: "0.15–0.25 g burst", duration: "< 2 s", notes: "Proximity-triggered, synthetic potential field" },
  { manoeuvre: "Yaw rotation", accel: "N/A", duration: "Continuous", notes: "Differential fan torque, no tilt coupling" },
];

const STATUS_COLORS: Record<string, string> = {
  PASS: "oklch(0.65 0.18 145)",
  FAIL: "oklch(0.65 0.22 25)",
  CONDITIONAL: "oklch(0.72 0.16 80)",
};

export default function TechnicalBrief() {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const totalMass = BOM_SUMMARY.reduce((s, r) => s + r.mass, 0);
  const totalCost = BOM_SUMMARY.reduce((s, r) => s + r.cost, 0);
  const totalPower = BOM_SUMMARY.reduce((s, r) => s + r.power, 0);

  return (
    <div className="space-y-6">
      {/* Print button */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "oklch(0.55 0.010 240)", fontFamily: "'Inter'" }}>
          This brief consolidates all key data from the 16 dashboard sections into a single printable page.
        </p>
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-sm label-caps transition-all"
          style={{
            background: "oklch(0.75 0.18 200 / 0.15)",
            border: "1px solid oklch(0.75 0.18 200 / 0.4)",
            color: "oklch(0.75 0.18 200)",
            fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 13, letterSpacing: "0.08em",
          }}
        >
          ⎙ PRINT / EXPORT PDF
        </button>
      </div>

      {/* Brief content */}
      <div ref={printRef} id="technical-brief" className="space-y-6 print:space-y-4">

        {/* Header */}
        <div className="rounded-sm p-6" style={{ background: "oklch(0.12 0.022 240)", border: "1px solid oklch(0.25 0.015 240)" }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="classified-stamp">TOP SECRET</span>
                <span className="classified-stamp" style={{ color: "oklch(0.75 0.18 200 / 0.7)", borderColor: "oklch(0.75 0.18 200 / 0.4)" }}>AURORA</span>
              </div>
              <h1 style={{ fontFamily: "'Rajdhani'", fontSize: 28, fontWeight: 900, color: "oklch(0.95 0 0)", letterSpacing: "0.04em", lineHeight: 1 }}>
                PROJECT AURORA
              </h1>
              <h2 style={{ fontFamily: "'Rajdhani'", fontSize: 18, fontWeight: 700, color: "oklch(0.75 0.18 200)", letterSpacing: "0.06em" }}>
                NEGATIVE MASS REPULSION SYSTEM — TECHNICAL BRIEF
              </h2>
            </div>
            <div className="text-right">
              <div className="label-caps" style={{ color: "oklch(0.40 0.012 240)" }}>Engineering Reference {VERSION}</div>
              <div className="label-caps mt-1" style={{ color: "oklch(0.40 0.012 240)" }}>{BRIEF_DATE}</div>
              <div className="label-caps mt-1" style={{ color: "oklch(0.40 0.012 240)" }}>CLEARANCE LEVEL 5</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 700 }}>
            A flying saucer-scale craft engineered to produce a convincing negative-mass repulsion illusion through distributed ducted propulsion, segmented thrust vectoring, and a four-layer control architecture — without requiring exotic matter. This brief summarises the design specification, bill of materials, regulatory status, and performance envelope as of Engineering Reference v4.0.
          </p>
        </div>

        {/* Two-column: specs + BOM */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key specifications */}
          <div className="rounded-sm p-5" style={{ background: "oklch(0.13 0.020 240)", border: "1px solid oklch(0.22 0.015 240)" }}>
            <div className="label-caps mb-3" style={{ color: "oklch(0.75 0.18 200)" }}>KEY SPECIFICATIONS</div>
            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
              <tbody>
                {SPECS.map(({ label, value }) => (
                  <tr key={label} style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}>
                    <td className="py-1.5 label-caps" style={{ color: "oklch(0.50 0.015 240)", width: "45%" }}>{label}</td>
                    <td className="py-1.5 data-value" style={{ color: "oklch(0.85 0.005 240)", fontFamily: "'JetBrains Mono'", fontSize: 11 }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* BOM summary */}
          <div className="rounded-sm p-5" style={{ background: "oklch(0.13 0.020 240)", border: "1px solid oklch(0.22 0.015 240)" }}>
            <div className="label-caps mb-3" style={{ color: "oklch(0.72 0.16 80)" }}>BILL OF MATERIALS — SUMMARY</div>
            <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid oklch(0.22 0.015 240)" }}>
                  {["Subsystem", "Mass (kg)", "Power (W)", "Cost (USD)"].map(h => (
                    <th key={h} className="py-1.5 label-caps text-left" style={{ color: "oklch(0.45 0.015 240)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BOM_SUMMARY.map(row => (
                  <tr key={row.subsystem} style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
                    <td className="py-1.5" style={{ color: "oklch(0.75 0.005 240)", fontFamily: "'Inter'", fontSize: 11 }}>{row.subsystem}</td>
                    <td className="py-1.5 data-value" style={{ color: "oklch(0.75 0.18 200)", fontFamily: "'JetBrains Mono'", fontSize: 11 }}>{row.mass.toFixed(1)}</td>
                    <td className="py-1.5 data-value" style={{ color: "oklch(0.65 0.015 240)", fontFamily: "'JetBrains Mono'", fontSize: 11 }}>{row.power > 0 ? row.power.toLocaleString() : "—"}</td>
                    <td className="py-1.5 data-value" style={{ color: "oklch(0.72 0.16 80)", fontFamily: "'JetBrains Mono'", fontSize: 11 }}>${row.cost.toLocaleString()}</td>
                  </tr>
                ))}
                <tr style={{ borderTop: "1px solid oklch(0.28 0.015 240)" }}>
                  <td className="py-2 label-caps" style={{ color: "oklch(0.85 0.005 240)" }}>TOTAL</td>
                  <td className="py-2 data-value" style={{ color: "oklch(0.75 0.18 200)", fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 700 }}>{totalMass.toFixed(1)}</td>
                  <td className="py-2 data-value" style={{ color: "oklch(0.65 0.015 240)", fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 700 }}>{(totalPower / 1000).toFixed(0)} kW</td>
                  <td className="py-2 data-value" style={{ color: "oklch(0.72 0.16 80)", fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 700 }}>${totalCost.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Performance envelope */}
        <div className="rounded-sm p-5" style={{ background: "oklch(0.13 0.020 240)", border: "1px solid oklch(0.22 0.015 240)" }}>
          <div className="label-caps mb-3" style={{ color: "oklch(0.65 0.18 145)" }}>PERFORMANCE ENVELOPE — UFO MOTION PRIMITIVES</div>
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid oklch(0.22 0.015 240)" }}>
                {["Manoeuvre", "Acceleration", "Duration", "Notes"].map(h => (
                  <th key={h} className="py-1.5 label-caps text-left" style={{ color: "oklch(0.45 0.015 240)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERFORMANCE_TABLE.map(row => (
                <tr key={row.manoeuvre} style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
                  <td className="py-1.5 label-caps" style={{ color: "oklch(0.75 0.005 240)" }}>{row.manoeuvre}</td>
                  <td className="py-1.5 data-value" style={{ color: "oklch(0.75 0.18 200)", fontFamily: "'JetBrains Mono'", fontSize: 11 }}>{row.accel}</td>
                  <td className="py-1.5" style={{ color: "oklch(0.65 0.015 240)", fontFamily: "'JetBrains Mono'", fontSize: 11 }}>{row.duration}</td>
                  <td className="py-1.5" style={{ color: "oklch(0.55 0.010 240)", fontFamily: "'Inter'" }}>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Regulatory compliance summary */}
        <div className="rounded-sm p-5" style={{ background: "oklch(0.13 0.020 240)", border: "1px solid oklch(0.22 0.015 240)" }}>
          <div className="label-caps mb-3" style={{ color: "oklch(0.60 0.15 280)" }}>REGULATORY COMPLIANCE SUMMARY — FAA / EASA / ICAO</div>
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid oklch(0.22 0.015 240)" }}>
                {["Compliance Item", "Status", "Action Required"].map(h => (
                  <th key={h} className="py-1.5 label-caps text-left" style={{ color: "oklch(0.45 0.015 240)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPLIANCE_SUMMARY.map(row => (
                <tr key={row.item} style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
                  <td className="py-1.5" style={{ color: "oklch(0.75 0.005 240)", fontFamily: "'Inter'" }}>{row.item}</td>
                  <td className="py-1.5">
                    <span className="label-caps px-2 py-0.5 rounded-sm" style={{
                      background: `${STATUS_COLORS[row.status].replace(")", " / 0.10)")}`,
                      color: STATUS_COLORS[row.status],
                      border: `1px solid ${STATUS_COLORS[row.status].replace(")", " / 0.3)")}`,
                    }}>{row.status}</span>
                  </td>
                  <td className="py-1.5" style={{ color: "oklch(0.55 0.010 240)", fontFamily: "'Inter'" }}>{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs mt-3 leading-relaxed" style={{ color: "oklch(0.38 0.010 240)", fontFamily: "'Inter'" }}>
            Compliance matrix is a preliminary engineering assessment only. All certification activities must be conducted with the relevant national aviation authority and qualified aviation legal counsel.
          </p>
        </div>

        {/* Control architecture summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-sm p-5" style={{ background: "oklch(0.13 0.020 240)", border: "1px solid oklch(0.22 0.015 240)" }}>
            <div className="label-caps mb-3" style={{ color: "oklch(0.72 0.16 80)" }}>CONTROL ARCHITECTURE</div>
            <div className="space-y-2">
              {[
                { layer: "L3 · 10–30 Hz", name: "Repulsion Field Navigation", desc: "Synthetic potential field, obstacle avoidance, UFO aesthetic constraints" },
                { layer: "L2 · 50–100 Hz", name: "Velocity / Accel Shaping", desc: "Jerk-limited trajectory, wind compensation, flat-glide enforcement" },
                { layer: "L1 · 200–500 Hz", name: "Attitude / Thrust Stabilisation", desc: "IMU-based attitude hold, per-fan throttle allocation" },
                { layer: "L0 · Always-on", name: "Safety & Limits", desc: "Tilt limits, thermal cutoffs, fault detection, emergency descent" },
              ].map(row => (
                <div key={row.layer} className="flex items-start gap-3 py-1.5" style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
                  <span className="data-value text-xs w-24 shrink-0" style={{ color: "oklch(0.75 0.18 200)", fontFamily: "'JetBrains Mono'" }}>{row.layer}</span>
                  <div>
                    <div className="label-caps" style={{ color: "oklch(0.75 0.005 240)" }}>{row.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "oklch(0.45 0.010 240)", fontFamily: "'Inter'" }}>{row.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-sm p-5" style={{ background: "oklch(0.13 0.020 240)", border: "1px solid oklch(0.22 0.015 240)" }}>
            <div className="label-caps mb-3" style={{ color: "oklch(0.65 0.22 25)" }}>OPEN RISKS & NEXT STEPS</div>
            <div className="space-y-2">
              {[
                { risk: "Battery energy density", note: "200 Wh/kg limits endurance to ~15 min hover. Solid-state cells (400+ Wh/kg) would double endurance." },
                { risk: "Type certification path", note: "No existing standard covers this configuration. Special Conditions development is a multi-year process." },
                { risk: "ADS-B / transponder", note: "Must be added to BOM before any controlled airspace operation." },
                { risk: "Acoustic testing", note: "Plenum damping model is analytical. Physical test required for Part 36 certification." },
                { risk: "Thermal validation", note: "Motor temps at burst throttle in desert ambient approach limits. Physical test required." },
                { risk: "Vane actuator bandwidth", note: "32 vane servos at 500 Hz control rate — actuator latency must be characterised." },
              ].map(row => (
                <div key={row.risk} className="flex items-start gap-2 py-1.5" style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: "oklch(0.65 0.22 25)", marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <div className="label-caps" style={{ color: "oklch(0.72 0.16 80)" }}>{row.risk}</div>
                    <div className="text-xs mt-0.5" style={{ color: "oklch(0.45 0.010 240)", fontFamily: "'Inter'" }}>{row.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between py-4" style={{ borderTop: "1px solid oklch(0.20 0.015 240)" }}>
          <div className="label-caps" style={{ color: "oklch(0.30 0.012 240)" }}>
            Project Aurora · Negative Mass Repulsion System · Engineering Reference {VERSION} · {BRIEF_DATE}
          </div>
          <div className="flex gap-3">
            <span className="classified-stamp">TOP SECRET</span>
            <span className="classified-stamp" style={{ color: "oklch(0.75 0.18 200 / 0.7)", borderColor: "oklch(0.75 0.18 200 / 0.4)", transform: "rotate(1deg)" }}>AURORA</span>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #technical-brief, #technical-brief * { visibility: visible; }
          #technical-brief { position: fixed; top: 0; left: 0; width: 100%; background: white !important; color: black !important; padding: 20px; }
          .classified-stamp { border: 2px solid #cc0000 !important; color: #cc0000 !important; }
          [style*="oklch"] { color: #111 !important; }
        }
      `}</style>
    </div>
  );
}
