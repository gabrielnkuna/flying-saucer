// Design: Classified Aerospace Dossier — dark navy, cyan/amber accents
// Page: Flight Gates A–D — stub ready for gate_a_report.json etc.

import * as React from "react";

const GATES = [
  {
    id: "A",
    name: "Hover Hold",
    description: "Stable hover at 2 m AGL for 60 s. Position error < 0.3 m RMS. No oscillation.",
    status: "pending",
    metrics: ["Alt error RMS (m)", "Pos drift (m/min)", "Roll/Pitch RMS (°)", "Power (kW)"],
    file: "/aurora/gates/gate_a_report.json",
  },
  {
    id: "B",
    name: "Flat Glide",
    description: "Translate 20 m at 1.5 m/s with yaw locked. Heading deviation < 3°.",
    status: "pending",
    metrics: ["Lateral speed (m/s)", "Yaw deviation (°)", "Coupling (°)", "Stop overshoot (m)"],
    file: "/aurora/gates/gate_b_report.json",
  },
  {
    id: "C",
    name: "Snap Stop",
    description: "Full-speed snap stop from 2 m/s. Stop distance < 0.6 m. Settle < 1 s.",
    status: "pending",
    metrics: ["Stop distance (m)", "Stop time (s)", "Residual speed (m/s)", "Settle time (s)"],
    file: "/aurora/gates/gate_c_report.json",
  },
  {
    id: "D",
    name: "Repel Field",
    description: "Approach obstacle at 1.5 m/s. Repel field deflects craft. Recede latency < 0.5 s.",
    status: "pending",
    metrics: ["Response latency (s)", "Recede latency (s)", "Peak kick (m/s²)", "Away in (s)"],
    file: "/aurora/gates/gate_d_report.json",
  },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pass: "text-green-400 bg-green-500/10 border-green-500/30",
  fail: "text-red-400 bg-red-500/10 border-red-500/30",
  pending: "text-white/40 bg-white/5 border-white/10",
  running: "text-amber-400 bg-amber-500/10 border-amber-500/30",
};

export default function Gates() {
  return (
    <div className="min-h-screen bg-[#020817] text-white font-sans">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#020817]/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest">
              AURORA — GATES
            </span>
            <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest">SITL / HITL / Hardware</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-lg font-bold" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em" }}>
              FLIGHT GATES A–D
            </h1>
            <a
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-all hover:opacity-80 shrink-0"
              style={{ background: "oklch(0.14 0.018 240)", border: "1px solid oklch(0.55 0.18 200 / 0.35)", color: "oklch(0.55 0.18 200)" }}
            >
              <span style={{ fontSize: 11 }}>◀</span>
              <span className="uppercase tracking-widest" style={{ fontSize: 9 }}>Main Dashboard</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Info banner */}
        <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-xs font-mono text-amber-300/70">
          <span className="text-amber-400 font-semibold">AWAITING RUN DATA:</span> Drop gate report JSON files into{" "}
          <code className="bg-white/10 px-1 rounded">client/public/aurora/gates/</code> (e.g.{" "}
          <code className="bg-white/10 px-1 rounded">gate_a_report.json</code>) and the cards will load live results.
          Gate progression is sequential — later gates are locked until earlier ones pass.
        </div>

        {/* Gate cards */}
        <div className="grid gap-4">
          {GATES.map((gate, gateIdx) => (
            <div
              key={gate.id}
              className={`rounded-lg border p-5 transition-all ${STATUS_COLORS[gate.status]}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg border border-current flex items-center justify-center text-lg font-bold opacity-80"
                    style={{ fontFamily: "'Rajdhani', sans-serif" }}>
                    {gate.id}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Gate {gate.id} — {gate.name}</div>
                    <div className="text-xs opacity-60 font-mono mt-0.5">{gate.description}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-mono px-2 py-1 rounded uppercase tracking-widest border shrink-0 ${STATUS_COLORS[gate.status]}`}>
                  {gate.status}
                </span>
              </div>

              {/* Metric placeholders */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                {gate.metrics.map((metric) => (
                  <div key={metric} className="rounded border border-white/5 bg-white/5 p-2">
                    <div className="text-[9px] font-mono uppercase tracking-widest opacity-40">{metric}</div>
                    <div className="text-base font-mono mt-1 opacity-30">--</div>
                  </div>
                ))}
              </div>

              {/* Gate lock indicator */}
              {gateIdx > 0 && (
                <div className="mt-3 text-[10px] font-mono opacity-30 flex items-center gap-1">
                  <span>⊘</span>
                  <span>Locked until Gate {GATES[gateIdx - 1].id} passes</span>
                </div>
              )}

              <div className="mt-3 text-[10px] font-mono opacity-30">
                Data source: <code>{gate.file}</code>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-white/10 pt-4 flex items-center justify-between text-[10px] font-mono opacity-30">
          <span>PROJECT AURORA — FLIGHT GATES</span>
          <span>ENGINEERING REFERENCE v11.0</span>
        </div>
      </div>
    </div>
  );
}
