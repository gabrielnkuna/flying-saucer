/* =============================================================
   COMPONENT: GroundTestPlanner
   Design: Classified Aerospace Dossier
   12 pre-flight ground tests with pass/fail toggles,
   readiness score, and phase gating logic.
   ============================================================= */
import { useState } from "react";

type TestStatus = "pending" | "pass" | "fail" | "skip";

interface GroundTest {
  id: string;
  phase: number;
  phaseLabel: string;
  name: string;
  duration: string;
  desc: string;
  passCriteria: string;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  gates: string[]; // ids that must pass before this test
}

const TESTS: GroundTest[] = [
  // Phase 1 — Electrical
  {
    id: "t01", phase: 1, phaseLabel: "Electrical",
    name: "Battery Charge & Cell Balance",
    duration: "2 h",
    desc: "Charge all 55 kWh pack cells to 4.18 V. Verify cell voltage spread < 20 mV. Check BMS communication.",
    passCriteria: "All cells 4.15–4.20 V, spread < 20 mV, BMS telemetry nominal",
    risk: "HIGH",
    gates: [],
  },
  {
    id: "t02", phase: 1, phaseLabel: "Electrical",
    name: "ESC Calibration & Continuity",
    duration: "45 min",
    desc: "Calibrate all 16 ESCs to throttle range. Verify DSHOT600 telemetry from each. Check for ground faults.",
    passCriteria: "16/16 ESCs calibrated, telemetry active, no ground faults",
    risk: "MEDIUM",
    gates: ["t01"],
  },
  // Phase 2 — Mechanical
  {
    id: "t03", phase: 2, phaseLabel: "Mechanical",
    name: "Fan Spin-Up (10% Throttle)",
    duration: "20 min",
    desc: "Spin all 16 fans to 10% throttle. Check for vibration, bearing noise, and blade clearance.",
    passCriteria: "All fans spin, vibration < 0.5 g RMS, no abnormal noise",
    risk: "MEDIUM",
    gates: ["t02"],
  },
  {
    id: "t04", phase: 2, phaseLabel: "Mechanical",
    name: "Vectoring Vane Sweep",
    duration: "30 min",
    desc: "Command all 32 vane servos through ±25° sweep. Verify position feedback and check for binding.",
    passCriteria: "32/32 vanes reach ±25°, position error < 0.5°, no binding",
    risk: "MEDIUM",
    gates: ["t02"],
  },
  {
    id: "t05", phase: 2, phaseLabel: "Mechanical",
    name: "Structural Load Test (static)",
    duration: "1 h",
    desc: "Apply 1.5× design load to landing gear and hull attachment points. Check for deformation.",
    passCriteria: "No permanent deformation, strain gauge readings within FEA predictions ±10%",
    risk: "HIGH",
    gates: ["t03", "t04"],
  },
  // Phase 3 — Avionics
  {
    id: "t06", phase: 3, phaseLabel: "Avionics",
    name: "IMU Calibration & Alignment",
    duration: "30 min",
    desc: "Calibrate all three IMUs. Verify alignment to craft body frame. Check voting logic with induced offset.",
    passCriteria: "Gyro bias < 0.01 °/s, accel bias < 0.005 g, voting logic correct",
    risk: "MEDIUM",
    gates: ["t01"],
  },
  {
    id: "t07", phase: 3, phaseLabel: "Avionics",
    name: "GPS RTK Acquisition",
    duration: "20 min",
    desc: "Acquire RTK fix with base station. Verify 2 cm horizontal accuracy. Check GNSS health flags.",
    passCriteria: "RTK fix acquired, horizontal error < 2 cm, all health flags nominal",
    risk: "LOW",
    gates: ["t06"],
  },
  {
    id: "t08", phase: 3, phaseLabel: "Avionics",
    name: "Kalman Filter Convergence",
    duration: "15 min",
    desc: "Power up full sensor suite. Verify EKF state estimate converges within 60 s. Check covariance bounds.",
    passCriteria: "EKF converged in < 60 s, position covariance < 0.01 m², attitude < 0.1°",
    risk: "MEDIUM",
    gates: ["t06", "t07"],
  },
  // Phase 4 — Control
  {
    id: "t09", phase: 4, phaseLabel: "Control",
    name: "Attitude Hold (tethered hover)",
    duration: "1 h",
    desc: "Tethered hover at 0.5 m. Verify attitude hold within ±1° over 10 min. Apply 5 N lateral impulse.",
    passCriteria: "Attitude hold ±1°, position drift < 5 cm/min, impulse recovery < 2 s",
    risk: "CRITICAL",
    gates: ["t05", "t08"],
  },
  {
    id: "t10", phase: 4, phaseLabel: "Control",
    name: "Fault Injection — Fan Failure",
    duration: "45 min",
    desc: "Disable fans 1, 5, 9 (120° spacing) during tethered hover. Verify control stack compensates.",
    passCriteria: "Attitude hold maintained within ±3° with 3 fans disabled, no uncontrolled drift",
    risk: "CRITICAL",
    gates: ["t09"],
  },
  // Phase 5 — Signature
  {
    id: "t11", phase: 5, phaseLabel: "Acoustic",
    name: "Acoustic Baseline Measurement",
    duration: "1 h",
    desc: "Measure SPL at 10 m in anechoic conditions at 50%, 75%, 100% throttle. Compare to plenum model.",
    passCriteria: "SPL at 10 m < 65 dB(A) at 75% throttle, BPF harmonics < model +3 dB",
    risk: "LOW",
    gates: ["t09"],
  },
  {
    id: "t12", phase: 5, phaseLabel: "Thermal",
    name: "Thermal Soak (30 min full power)",
    duration: "1.5 h",
    desc: "Run all fans at 100% for 30 min. Monitor motor/ESC temperatures. Verify cooling airflow paths.",
    passCriteria: "Motor temp < 80°C, ESC temp < 70°C, no thermal runaway events",
    risk: "HIGH",
    gates: ["t09"],
  },
];

const PHASE_COLORS: Record<number, string> = {
  1: "oklch(0.75 0.18 200)",
  2: "oklch(0.65 0.18 145)",
  3: "oklch(0.60 0.15 280)",
  4: "oklch(0.65 0.22 25)",
  5: "oklch(0.72 0.16 80)",
};

const RISK_COLORS: Record<string, string> = {
  LOW: "oklch(0.65 0.18 145)",
  MEDIUM: "oklch(0.72 0.16 80)",
  HIGH: "oklch(0.65 0.22 25)",
  CRITICAL: "oklch(0.62 0.25 20)",
};

const STATUS_LABELS: Record<TestStatus, string> = {
  pending: "PENDING",
  pass: "PASS",
  fail: "FAIL",
  skip: "SKIP",
};

const STATUS_COLORS: Record<TestStatus, string> = {
  pending: "oklch(0.45 0.015 240)",
  pass: "oklch(0.65 0.18 145)",
  fail: "oklch(0.65 0.22 25)",
  skip: "oklch(0.50 0.015 240)",
};

function isGated(test: GroundTest, statuses: Record<string, TestStatus>): boolean {
  return test.gates.some(gid => statuses[gid] !== "pass");
}

export default function GroundTestPlanner() {
  const [statuses, setStatuses] = useState<Record<string, TestStatus>>(
    Object.fromEntries(TESTS.map(t => [t.id, "pending"]))
  );
  const [expanded, setExpanded] = useState<string | null>(null);

  const passCount = TESTS.filter(t => statuses[t.id] === "pass").length;
  const failCount = TESTS.filter(t => statuses[t.id] === "fail").length;
  const readiness = Math.round((passCount / TESTS.length) * 100);

  const readinessColor = readiness === 100 ? "oklch(0.65 0.18 145)"
    : readiness >= 75 ? "oklch(0.72 0.16 80)"
    : readiness >= 50 ? "oklch(0.65 0.22 25)"
    : "oklch(0.62 0.25 20)";

  const phases = Array.from(new Set(TESTS.map(t => t.phase)));

  const cycleStatus = (id: string) => {
    const order: TestStatus[] = ["pending", "pass", "fail", "skip"];
    const cur = statuses[id];
    const next = order[(order.indexOf(cur) + 1) % order.length];
    setStatuses(s => ({ ...s, [id]: next }));
  };

  const resetAll = () => setStatuses(Object.fromEntries(TESTS.map(t => [t.id, "pending"])));
  const passAll = () => setStatuses(Object.fromEntries(TESTS.map(t => [t.id, "pass"])));

  return (
    <div className="space-y-6">
      {/* Readiness header */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-navy-surface panel-border rounded-sm p-4 text-center lg:col-span-1">
          <div className="label-caps mb-1">Flight Readiness</div>
          <div className="data-value text-4xl" style={{ color: readinessColor }}>{readiness}%</div>
          <div className="label-caps mt-1" style={{ color: "oklch(0.40 0.015 240)", fontSize: 9 }}>
            {readiness === 100 ? "CLEARED FOR FLIGHT" : readiness >= 75 ? "NEARLY READY" : "NOT READY"}
          </div>
        </div>
        <div className="bg-navy-surface panel-border rounded-sm p-4 text-center">
          <div className="label-caps mb-1">Tests Passed</div>
          <div className="data-value text-3xl" style={{ color: "oklch(0.65 0.18 145)" }}>{passCount}</div>
          <div className="label-caps mt-1" style={{ color: "oklch(0.40 0.015 240)", fontSize: 9 }}>of {TESTS.length}</div>
        </div>
        <div className="bg-navy-surface panel-border rounded-sm p-4 text-center">
          <div className="label-caps mb-1">Tests Failed</div>
          <div className="data-value text-3xl" style={{ color: failCount > 0 ? "oklch(0.65 0.22 25)" : "oklch(0.40 0.015 240)" }}>{failCount}</div>
          <div className="label-caps mt-1" style={{ color: "oklch(0.40 0.015 240)", fontSize: 9 }}>blocking flight</div>
        </div>
        <div className="bg-navy-surface panel-border rounded-sm p-4 flex flex-col justify-center gap-2">
          <button onClick={passAll} className="w-full py-1.5 rounded-sm label-caps text-xs transition-all"
            style={{ background: "oklch(0.65 0.18 145 / 0.12)", color: "oklch(0.65 0.18 145)", border: "1px solid oklch(0.65 0.18 145 / 0.35)" }}>
            PASS ALL
          </button>
          <button onClick={resetAll} className="w-full py-1.5 rounded-sm label-caps text-xs transition-all"
            style={{ background: "oklch(0.18 0.018 240)", color: "oklch(0.50 0.015 240)", border: "1px solid oklch(0.25 0.015 240)" }}>
            RESET
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-navy-surface panel-border rounded-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="label-caps">Overall Progress</div>
          <div className="label-caps" style={{ color: readinessColor }}>{passCount}/{TESTS.length} tests passed</div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.018 240)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${readiness}%`, background: readinessColor }} />
        </div>
        <div className="flex gap-1 mt-2">
          {TESTS.map(t => (
            <div key={t.id} className="flex-1 h-1 rounded-full transition-all"
              style={{ background: STATUS_COLORS[statuses[t.id]] }} />
          ))}
        </div>
      </div>

      {/* Tests by phase */}
      {phases.map(phase => {
        const phaseTests = TESTS.filter(t => t.phase === phase);
        const phaseLabel = phaseTests[0].phaseLabel;
        const phaseColor = PHASE_COLORS[phase];
        const phasePassed = phaseTests.filter(t => statuses[t.id] === "pass").length;
        return (
          <div key={phase} className="bg-navy-surface panel-border rounded-sm overflow-hidden">
            {/* Phase header */}
            <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid oklch(0.18 0.015 240)", background: `${phaseColor.replace(")", " / 0.06)")}` }}>
              <div className="flex items-center gap-3">
                <div className="label-caps" style={{ color: phaseColor }}>Phase {phase} · {phaseLabel}</div>
              </div>
              <div className="label-caps" style={{ color: phasePassed === phaseTests.length ? "oklch(0.65 0.18 145)" : "oklch(0.45 0.015 240)", fontSize: 9 }}>
                {phasePassed}/{phaseTests.length} passed
              </div>
            </div>

            {/* Tests */}
            <div className="divide-y" style={{ borderColor: "oklch(0.16 0.015 240)" }}>
              {phaseTests.map(test => {
                const gated = isGated(test, statuses);
                const status = statuses[test.id];
                const isExpanded = expanded === test.id;
                return (
                  <div key={test.id} style={{ opacity: gated ? 0.45 : 1, transition: "opacity 0.2s" }}>
                    <div className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                      onClick={() => setExpanded(isExpanded ? null : test.id)}>
                      {/* Status toggle */}
                      <button
                        onClick={e => { e.stopPropagation(); if (!gated) cycleStatus(test.id); }}
                        disabled={gated}
                        className="shrink-0 w-16 py-1 rounded-sm label-caps text-center transition-all"
                        style={{
                          fontSize: 9,
                          background: `${STATUS_COLORS[status].replace(")", " / 0.12)")}`,
                          color: STATUS_COLORS[status],
                          border: `1px solid ${STATUS_COLORS[status].replace(")", " / 0.35)")}`,
                          cursor: gated ? "not-allowed" : "pointer",
                        }}>
                        {STATUS_LABELS[status]}
                      </button>

                      {/* Test ID */}
                      <span className="data-value shrink-0" style={{ fontSize: 10, color: "oklch(0.35 0.015 240)", width: 28 }}>{test.id.toUpperCase()}</span>

                      {/* Name */}
                      <span className="flex-1 label-caps" style={{ color: status === "pass" ? "oklch(0.65 0.18 145)" : status === "fail" ? "oklch(0.65 0.22 25)" : "oklch(0.70 0.005 240)" }}>
                        {test.name}
                        {gated && <span className="ml-2" style={{ color: "oklch(0.35 0.015 240)", fontSize: 9 }}>— GATED</span>}
                      </span>

                      {/* Duration */}
                      <span className="data-value shrink-0" style={{ fontSize: 10, color: "oklch(0.45 0.015 240)" }}>{test.duration}</span>

                      {/* Risk */}
                      <span className="label-caps shrink-0 px-2 py-0.5 rounded-sm" style={{
                        fontSize: 8,
                        background: `${RISK_COLORS[test.risk].replace(")", " / 0.10)")}`,
                        color: RISK_COLORS[test.risk],
                        border: `1px solid ${RISK_COLORS[test.risk].replace(")", " / 0.30)")}`,
                      }}>{test.risk}</span>

                      {/* Expand chevron */}
                      <span style={{ color: "oklch(0.35 0.015 240)", fontSize: 10, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                    </div>

                    {/* Expanded detail */}
                    {isExpanded && (
                      <div className="px-5 pb-4 space-y-2" style={{ borderTop: "1px solid oklch(0.14 0.015 240)", paddingTop: 12 }}>
                        <p className="text-xs leading-relaxed" style={{ color: "oklch(0.55 0.008 240)", fontFamily: "'Inter'" }}>{test.desc}</p>
                        <div className="flex items-start gap-2">
                          <span className="label-caps shrink-0" style={{ color: "oklch(0.75 0.18 200)", fontSize: 9 }}>PASS CRITERIA:</span>
                          <span className="text-xs" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'" }}>{test.passCriteria}</span>
                        </div>
                        {test.gates.length > 0 && (
                          <div className="flex items-center gap-2">
                            <span className="label-caps shrink-0" style={{ color: "oklch(0.45 0.015 240)", fontSize: 9 }}>GATES:</span>
                            <div className="flex gap-1.5 flex-wrap">
                              {test.gates.map(gid => {
                                const gt = TESTS.find(t => t.id === gid);
                                const gs = statuses[gid];
                                return (
                                  <span key={gid} className="label-caps px-2 py-0.5 rounded-sm" style={{
                                    fontSize: 8,
                                    background: `${STATUS_COLORS[gs].replace(")", " / 0.10)")}`,
                                    color: STATUS_COLORS[gs],
                                    border: `1px solid ${STATUS_COLORS[gs].replace(")", " / 0.30)")}`,
                                  }}>{gid.toUpperCase()} · {gt?.name}</span>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
