/* =============================================================
   COMPONENT: DemoGates
   Design: Classified Aerospace Dossier
   Four sequential demo gates — the "hit demo fast" backbone.
   Gate A: Pinned Hover
   Gate B: Flat Glide
   Gate C: Snap-Stop
   Gate D: Repelled Approach
   Each gate: pass criteria, editable metrics, radar chart,
   manual pass/fail toggle, gate-unlock logic.
   ============================================================= */
import { useState } from "react";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from "recharts";

type GateStatus = "PASS" | "FAIL" | "PENDING" | "LOCKED";

interface Metric {
  name: string;
  target: string;
  unit: string;
  latest: number | null;
  limit: number;
  lowerIsBetter: boolean;
}

interface Gate {
  id: string;
  label: string;
  name: string;
  description: string;
  status: GateStatus;
  prerequisite: string | null;
  metrics: Metric[];
  runDate: string | null;
  notes: string;
  color: string;
}

const INITIAL_GATES: Gate[] = [
  {
    id: "A", label: "Gate A", name: "Pinned Hover",
    description: "Craft maintains stable hover at 3 m AGL for 60 s with no manual correction. Attitude hold must suppress all external disturbances within spec.",
    status: "PENDING", prerequisite: null, runDate: "2026-02-20",
    notes: "First gate — all subsequent gates depend on this. Must be demonstrated in calm conditions before wind testing.",
    color: "oklch(0.65 0.18 145)",
    metrics: [
      { name: "Tilt RMS",       target: "< 1.5°",    unit: "°",      latest: 1.1,  limit: 1.5,  lowerIsBetter: true },
      { name: "Lateral Drift",  target: "< 0.3 m/min", unit: "m/min", latest: 0.18, limit: 0.3,  lowerIsBetter: true },
      { name: "Alt Jitter",     target: "< ±0.1 m",  unit: "m",      latest: 0.07, limit: 0.1,  lowerIsBetter: true },
      { name: "Hover Duration", target: "≥ 60 s",    unit: "s",      latest: 72,   limit: 60,   lowerIsBetter: false },
      { name: "Fan Faults",     target: "0",         unit: "events", latest: 0,    limit: 0,    lowerIsBetter: true },
      { name: "Voltage Sag",    target: "< 3 V",     unit: "V",      latest: 1.8,  limit: 3,    lowerIsBetter: true },
    ],
  },
  {
    id: "B", label: "Gate B", name: "Flat Glide",
    description: "Craft executes a 20 m lateral translation at 0.15 g sustained acceleration while maintaining body tilt < 5°. The core UFO signature move.",
    status: "LOCKED", prerequisite: "A", runDate: null,
    notes: "Requires Gate A pass. The yaw–velocity coupling check is critical — any yaw rotation during translation breaks the UFO illusion.",
    color: "oklch(0.75 0.18 200)",
    metrics: [
      { name: "Body Tilt",      target: "< 5°",       unit: "°",    latest: null, limit: 5,    lowerIsBetter: true },
      { name: "Yaw Coupling",   target: "< 2°/m",     unit: "°/m",  latest: null, limit: 2,    lowerIsBetter: true },
      { name: "Lateral Accel",  target: "0.10–0.20 g", unit: "g",   latest: null, limit: 0.20, lowerIsBetter: false },
      { name: "Glide Distance", target: "≥ 20 m",     unit: "m",    latest: null, limit: 20,   lowerIsBetter: false },
      { name: "Settle Time",    target: "< 3 s",      unit: "s",    latest: null, limit: 3,    lowerIsBetter: true },
      { name: "Alt Hold",       target: "< ±0.2 m",   unit: "m",    latest: null, limit: 0.2,  lowerIsBetter: true },
    ],
  },
  {
    id: "C", label: "Gate C", name: "Snap-Stop",
    description: "Craft decelerates from 10 m/s to stationary hover in < 4 s with < 0.35 g peak decel, no altitude drop > 0.5 m, and bus voltage sag within limits.",
    status: "LOCKED", prerequisite: "B", runDate: null,
    notes: "Requires Gate B pass. Bus voltage sag during snap-stop is the hardest constraint — peak current from all fans braking simultaneously can exceed BMS limits.",
    color: "oklch(0.72 0.16 80)",
    metrics: [
      { name: "Decel Time",     target: "< 4 s",        unit: "s",    latest: null, limit: 4,    lowerIsBetter: true },
      { name: "Peak Decel",     target: "0.25–0.35 g",  unit: "g",    latest: null, limit: 0.35, lowerIsBetter: false },
      { name: "Alt Drop",       target: "< 0.5 m",      unit: "m",    latest: null, limit: 0.5,  lowerIsBetter: true },
      { name: "Voltage Sag",    target: "< 5 V",        unit: "V",    latest: null, limit: 5,    lowerIsBetter: true },
      { name: "Jerk Onset",     target: "< 2 m/s³",     unit: "m/s³", latest: null, limit: 2,    lowerIsBetter: true },
      { name: "Overshoot",      target: "< 0.5 m",      unit: "m",    latest: null, limit: 0.5,  lowerIsBetter: true },
    ],
  },
  {
    id: "D", label: "Gate D", name: "Repelled Approach",
    description: "Craft autonomously maintains minimum separation from an approaching object using the synthetic potential field controller. No manual intervention.",
    status: "LOCKED", prerequisite: "C", runDate: null,
    notes: "Requires Gate C pass. This is the headline demo — the repulsion illusion that motivates the entire design. Sensor latency and false-positive rate are the key risks.",
    color: "oklch(0.60 0.15 280)",
    metrics: [
      { name: "Min Separation", target: "≥ 2 m",        unit: "m",      latest: null, limit: 2,   lowerIsBetter: false },
      { name: "Latency",        target: "< 200 ms",      unit: "ms",     latest: null, limit: 200, lowerIsBetter: true },
      { name: "False Positives",target: "0 / 10 runs",   unit: "events", latest: null, limit: 0,   lowerIsBetter: true },
      { name: "Tilt (evade)",   target: "< 8°",          unit: "°",      latest: null, limit: 8,   lowerIsBetter: true },
      { name: "Recovery Time",  target: "< 5 s",         unit: "s",      latest: null, limit: 5,   lowerIsBetter: true },
      { name: "Hover Held",     target: "Yes (1 = pass)", unit: "",       latest: null, limit: 1,   lowerIsBetter: false },
    ],
  },
];

const STATUS_CONFIG: Record<GateStatus, { label: string; color: string; bg: string }> = {
  PASS:    { label: "PASS",    color: "oklch(0.65 0.18 145)",  bg: "oklch(0.65 0.18 145 / 0.08)"  },
  FAIL:    { label: "FAIL",    color: "oklch(0.65 0.22 25)",   bg: "oklch(0.65 0.22 25 / 0.08)"   },
  PENDING: { label: "PENDING", color: "oklch(0.72 0.16 80)",   bg: "oklch(0.72 0.16 80 / 0.08)"   },
  LOCKED:  { label: "LOCKED",  color: "oklch(0.35 0.012 240)", bg: "oklch(0.35 0.012 240 / 0.08)" },
};

export default function DemoGates() {
  const [gates, setGates] = useState<Gate[]>(INITIAL_GATES);
  const [expanded, setExpanded] = useState<string | null>("A");

  const setGateStatus = (id: string, status: GateStatus) => {
    setGates(prev => prev.map(g => {
      if (g.id === id) return { ...g, status };
      if (g.prerequisite === id && status === "PASS" && g.status === "LOCKED")
        return { ...g, status: "PENDING" };
      if (g.prerequisite === id && (status === "FAIL" || status === "PENDING"))
        return { ...g, status: "LOCKED" };
      return g;
    }));
  };

  const setMetricValue = (gateId: string, idx: number, value: string) => {
    const num = parseFloat(value);
    if (isNaN(num) && value !== "") return;
    setGates(prev => prev.map(g => {
      if (g.id !== gateId) return g;
      const metrics = g.metrics.map((m, i) =>
        i === idx ? { ...m, latest: value === "" ? null : num } : m
      );
      return { ...g, metrics };
    }));
  };

  const overallPct = Math.round(
    (gates.filter(g => g.status === "PASS").length / gates.length) * 100
  );

  return (
    <div className="space-y-6">

      {/* Readiness banner */}
      <div className="rounded-sm px-5 py-4" style={{ background: "oklch(0.13 0.020 240)", border: "1px solid oklch(0.25 0.015 240)" }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="label-caps mb-1" style={{ color: "oklch(0.75 0.18 200)" }}>DEMO FLIGHT READINESS</div>
            <p className="text-xs" style={{ color: "oklch(0.50 0.010 240)", fontFamily: "'Inter'" }}>
              Gates must be passed in order. Gate D is the headline repulsion-illusion demonstration.
            </p>
          </div>
          <div className="text-right">
            <div style={{ fontSize: 32, color: overallPct === 100 ? "oklch(0.65 0.18 145)" : "oklch(0.75 0.18 200)", fontFamily: "'Rajdhani'", fontWeight: 900 }}>
              {overallPct}%
            </div>
            <div className="label-caps" style={{ color: "oklch(0.40 0.012 240)" }}>gates passed</div>
          </div>
        </div>
        <div className="flex gap-2">
          {gates.map(gate => (
            <div key={gate.id} className="flex-1 rounded-sm overflow-hidden" style={{ height: 6, background: "oklch(0.18 0.015 240)" }}>
              <div className="h-full transition-all duration-500" style={{
                width: gate.status === "PASS" ? "100%" : gate.status === "PENDING" ? "50%" : "0%",
                background: STATUS_CONFIG[gate.status].color,
              }} />
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-1">
          {gates.map(gate => (
            <div key={gate.id} className="flex-1 label-caps text-center" style={{ fontSize: 7, color: STATUS_CONFIG[gate.status].color }}>
              {gate.label}
            </div>
          ))}
        </div>
      </div>

      {/* Gate cards */}
      <div className="space-y-3">
        {gates.map(gate => {
          const sc = STATUS_CONFIG[gate.status];
          const isOpen = expanded === gate.id;
          const isLocked = gate.status === "LOCKED";
          const allMetricsPass = gate.metrics.every(m =>
            m.latest !== null && (m.lowerIsBetter ? m.latest <= m.limit : m.latest >= m.limit)
          );
          const radarData = gate.metrics.map(m => ({
            metric: m.name.split(" ")[0],
            score: (() => {
              if (m.latest === null) return 0;
              if (m.lowerIsBetter) {
                // Special case: limit=0 means "must be exactly 0" → score 100 if latest=0, else 0
                if (m.limit === 0) return m.latest === 0 ? 100 : 0;
                return Math.min(100, Math.max(0, (1 - m.latest / (m.limit * 1.5)) * 100));
              } else {
                if (m.limit === 0) return 0;
                return Math.min(100, Math.max(0, (m.latest / (m.limit * 1.2)) * 100));
              }
            })(),
          }));

          return (
            <div key={gate.id} className="rounded-sm overflow-hidden"
              style={{
                border: `1px solid ${isOpen ? gate.color.replace(")", " / 0.45)") : "oklch(0.20 0.015 240)"}`,
                opacity: isLocked ? 0.55 : 1,
                transition: "border-color 0.2s, opacity 0.2s",
              }}>
              {/* Header */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left"
                style={{ background: isOpen ? `${gate.color.replace(")", " / 0.06)")}` : "oklch(0.14 0.020 240)" }}
                onClick={() => !isLocked && setExpanded(isOpen ? null : gate.id)}
                disabled={isLocked}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-sm flex items-center justify-center"
                  style={{ background: `${gate.color.replace(")", " / 0.12)")}`, border: `1px solid ${gate.color.replace(")", " / 0.4)")}` }}>
                  <span style={{ fontFamily: "'Rajdhani'", fontWeight: 900, fontSize: 16, color: gate.color }}>{gate.id}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="label-caps" style={{ color: gate.color }}>{gate.label}</span>
                    {gate.prerequisite && (
                      <span className="label-caps" style={{ fontSize: 8, color: "oklch(0.35 0.012 240)" }}>requires Gate {gate.prerequisite}</span>
                    )}
                  </div>
                  <div style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 15, color: "oklch(0.88 0.005 240)", letterSpacing: "0.05em" }}>
                    {gate.name}
                  </div>
                </div>
                {gate.runDate && (
                  <div className="hidden sm:block label-caps text-right" style={{ color: "oklch(0.40 0.012 240)", fontSize: 8 }}>
                    Last run<br />{gate.runDate}
                  </div>
                )}
                <span className="label-caps px-3 py-1 rounded-sm shrink-0"
                  style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color.replace(")", " / 0.3)")}` }}>
                  {sc.label}
                </span>
                <span style={{ color: "oklch(0.40 0.012 240)", fontSize: 10, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
              </button>

              {/* Expanded */}
              {isOpen && (
                <div className="px-5 pb-5 pt-4 space-y-5"
                  style={{ background: "oklch(0.12 0.018 240)", borderTop: `1px solid ${gate.color.replace(")", " / 0.15)")}` }}>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="label-caps mb-1" style={{ color: "oklch(0.45 0.015 240)" }}>PASS CRITERIA</div>
                      <p className="text-xs leading-relaxed" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'" }}>{gate.description}</p>
                    </div>
                    <div>
                      <div className="label-caps mb-1" style={{ color: "oklch(0.45 0.015 240)" }}>ENGINEERING NOTES</div>
                      <p className="text-xs leading-relaxed" style={{ color: "oklch(0.55 0.008 240)", fontFamily: "'Inter'" }}>{gate.notes}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Metrics table */}
                    <div className="lg:col-span-2">
                      <div className="label-caps mb-2" style={{ color: "oklch(0.45 0.015 240)" }}>METRICS — LATEST RUN (editable)</div>
                      <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid oklch(0.20 0.015 240)" }}>
                            {["Metric", "Target", "Latest", "Status"].map(h => (
                              <th key={h} className="py-1.5 label-caps text-left" style={{ color: "oklch(0.40 0.015 240)" }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {gate.metrics.map((m, idx) => {
                            const pass = m.latest !== null && (m.lowerIsBetter ? m.latest <= m.limit : m.latest >= m.limit);
                            const mColor = m.latest === null ? "oklch(0.40 0.012 240)" : pass ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)";
                            return (
                              <tr key={m.name} style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
                                <td className="py-2" style={{ color: "oklch(0.70 0.005 240)", fontFamily: "'Inter'" }}>{m.name}</td>
                                <td className="py-2 data-value" style={{ color: "oklch(0.55 0.015 240)", fontFamily: "'JetBrains Mono'", fontSize: 10 }}>{m.target}</td>
                                <td className="py-2">
                                  <input
                                    type="number" step="0.01"
                                    value={m.latest ?? ""}
                                    placeholder="—"
                                    onChange={e => setMetricValue(gate.id, idx, e.target.value)}
                                    className="w-20 px-2 py-0.5 rounded-sm outline-none"
                                    style={{
                                      background: "oklch(0.14 0.018 240)",
                                      border: `1px solid ${mColor.replace(")", " / 0.4)")}`,
                                      color: mColor,
                                      fontFamily: "'JetBrains Mono'", fontSize: 11,
                                    }}
                                  />
                                </td>
                                <td className="py-2">
                                  {m.latest === null ? (
                                    <span className="label-caps" style={{ color: "oklch(0.35 0.012 240)", fontSize: 8 }}>NO DATA</span>
                                  ) : (
                                    <span className="label-caps px-2 py-0.5 rounded-sm"
                                      style={{ background: `${mColor.replace(")", " / 0.10)")}`, color: mColor, border: `1px solid ${mColor.replace(")", " / 0.3)")}`, fontSize: 8 }}>
                                      {pass ? "PASS" : "FAIL"}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Radar */}
                    <div>
                      <div className="label-caps mb-2" style={{ color: "oklch(0.45 0.015 240)" }}>METRIC RADAR</div>
                      <ResponsiveContainer width="100%" height={180}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="oklch(0.22 0.015 240)" />
                          <PolarAngleAxis dataKey="metric" tick={{ fontFamily: "'JetBrains Mono'", fontSize: 8, fill: "oklch(0.45 0.015 240)" }} />
                          <Radar dataKey="score" stroke={gate.color} fill={gate.color} fillOpacity={0.15} strokeWidth={1.5} />
                          <Tooltip
                            contentStyle={{ background: "oklch(0.14 0.020 240)", border: `1px solid ${gate.color.replace(")", " / 0.4)")}`, fontFamily: "'JetBrains Mono'", fontSize: 10 }}
                            labelStyle={{ color: "oklch(0.75 0.005 240)" }}
                            itemStyle={{ color: gate.color }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Mark gate */}
                  <div className="flex items-center gap-3 pt-2" style={{ borderTop: "1px solid oklch(0.18 0.015 240)" }}>
                    <div className="label-caps" style={{ color: "oklch(0.40 0.012 240)" }}>MARK GATE:</div>
                    {(["PASS", "FAIL", "PENDING"] as GateStatus[]).map(s => (
                      <button key={s} onClick={() => setGateStatus(gate.id, s)}
                        className="px-3 py-1.5 rounded-sm label-caps transition-all"
                        style={{
                          background: gate.status === s ? STATUS_CONFIG[s].bg : "oklch(0.14 0.018 240)",
                          border: `1px solid ${gate.status === s ? STATUS_CONFIG[s].color.replace(")", " / 0.5)") : "oklch(0.22 0.015 240)"}`,
                          color: gate.status === s ? STATUS_CONFIG[s].color : "oklch(0.40 0.012 240)",
                          fontSize: 9,
                        }}>
                        {s}
                      </button>
                    ))}
                    {allMetricsPass && gate.status !== "PASS" && (
                      <span className="label-caps ml-2" style={{ color: "oklch(0.65 0.18 145)", fontSize: 8 }}>
                        ✓ All metrics pass — ready to mark PASS
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-sm px-4 py-3" style={{ background: "oklch(0.13 0.018 240)", border: "1px solid oklch(0.20 0.015 240)" }}>
        <div className="label-caps mb-1" style={{ color: "oklch(0.40 0.012 240)" }}>USAGE NOTE</div>
        <p className="text-xs leading-relaxed" style={{ color: "oklch(0.40 0.010 240)", fontFamily: "'Inter'" }}>
          Enter latest run values directly into the metric fields. Mark gates manually with the PASS / FAIL / PENDING buttons. Passing Gate A automatically unlocks Gate B, and so on. Gate D (Repelled Approach) is the headline demo and requires all prior gates to be passed first.
        </p>
      </div>
    </div>
  );
}
