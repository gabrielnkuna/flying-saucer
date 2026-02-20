/* =============================================================
   COMPONENT: ChangelogModal
   Design: Classified Aerospace Dossier
   Version history modal. Triggered by clicking the
   "Engineering Reference vX.0" text in any footer bar.
   ============================================================= */
import { useEffect } from "react";

interface ChangelogEntry {
  version: string;
  date: string;
  status: "CURRENT" | "SUPERSEDED";
  changes: { type: "ADD" | "FIX" | "CHANGE" | "REMOVE"; text: string }[];
}

const CHANGELOG: ChangelogEntry[] = [
  {
    version: "v9.0",
    date: "20 Feb 2026",
    status: "CURRENT",
    changes: [
      { type: "FIX", text: "Reframed all 'Negative Mass Repulsion System' language to 'Repulsion-Illusion Flight System' throughout dashboard and Technical Brief" },
      { type: "ADD", text: "Burst Power KPI card (350 kW, 10–30 s max) added to hero overview" },
      { type: "ADD", text: "Battery KPI card (55 kWh, ≈15 min hover) added to hero overview — both highlighted in amber as killer constraints" },
      { type: "ADD", text: "Section 28: R&D Speculation — 6 true negative-mass physics approaches with TRL bars, physics basis, experimental evidence, engineering gaps, and key references" },
      { type: "ADD", text: "Hero subtitle clarified: 'Implementation: repulsion-illusion via distributed lift + segmented vectoring + control' with inline link to R&D section" },
    ],
  },
  {
    version: "v8.0",
    date: "20 Feb 2026",
    status: "SUPERSEDED",
    changes: [
      { type: "ADD", text: "Section 25: Vibration Signature Analyser — structural spectrum 10–2000 Hz, BPF harmonic markers, modal analysis table with 5 resonance modes" },
      { type: "ADD", text: "Section 26: Prototype Build Roadmap — 68-week Gantt chart, 6 phases, critical/non-critical milestones, current-week marker, dependency tracking" },
      { type: "ADD", text: "Sidebar search/filter — live keyword filter with result count and clear button" },
    ],
  },
  {
    version: "v7.0",
    date: "20 Feb 2026",
    status: "SUPERSEDED",
    changes: [
      { type: "ADD", text: "Section 22: Propulsion Trade-off Matrix — adjustable weighting sliders, radar chart, ranked tier cards" },
      { type: "ADD", text: "Section 23: Ground Test Sequence Planner — 12 tests, 5 phases, gate logic, pass/fail/skip toggles, flight readiness score" },
      { type: "ADD", text: "Section 24: Live Telemetry HUD — animated arc gauges, attitude indicator, 16-fan RPM ring, scrolling log" },
    ],
  },
  {
    version: "v6.0",
    date: "20 Feb 2026",
    status: "SUPERSEDED",
    changes: [
      { type: "ADD", text: "Section 19: Scale Configurator — diameter slider 2–12 m, live spec/cost/regulatory recalculation, radar chart, regulatory threshold markers" },
      { type: "ADD", text: "Section 20: Materials Comparison — hull material and battery chemistry selectors with live BOM delta readouts and bar charts" },
      { type: "ADD", text: "Section 21: Sensor Fusion Diagram — interactive SVG block diagram, click-to-inspect with latency and connection navigation" },
    ],
  },
  {
    version: "v5.0",
    date: "20 Feb 2026",
    status: "SUPERSEDED",
    changes: [
      { type: "ADD", text: "Section 16: Mission Energy Planner — flight profile builder, SoC curve, energy budget bar chart, hover reserve warning" },
      { type: "ADD", text: "Section 17: Wind Disturbance Simulator — wind vector input, per-fan throttle compensation ring, residual drift and control authority notes" },
      { type: "ADD", text: "Section 18: Technical Brief — printable consolidated summary with print/export PDF button" },
    ],
  },
  {
    version: "v4.0",
    date: "20 Feb 2026",
    status: "SUPERSEDED",
    changes: [
      { type: "ADD", text: "Section 13: Thermal Management — fan ring heat map, cooling airflow paths, thermal runaway warning, throttle/ambient sliders" },
      { type: "ADD", text: "Section 14: Regulatory Compliance — 18-item FAA/EASA/ICAO matrix, pass/fail/conditional/pending status, expandable analysis panels" },
      { type: "ADD", text: "Section 15: Cross-Section Exploded View — SVG interactive diagram, 6 structural layers, BOM entry linking" },
    ],
  },
  {
    version: "v3.0",
    date: "20 Feb 2026",
    status: "SUPERSEDED",
    changes: [
      { type: "ADD", text: "Section 10: Fault-Tolerance Simulator — click-to-fail fan modules, compensation recalculation, 6 quick scenarios" },
      { type: "ADD", text: "Section 11: Acoustic Noise Signature Analyser — log-scale SPL chart, BPF harmonic markers, attenuation area chart" },
      { type: "ADD", text: "BOM CSV Export — download button generates filtered or full spreadsheet" },
    ],
  },
  {
    version: "v2.0",
    date: "20 Feb 2026",
    status: "SUPERSEDED",
    changes: [
      { type: "ADD", text: "Section 08: Thrust Vectoring Simulator — dual joystick, 16-fan throttle ring, tilt-warning" },
      { type: "ADD", text: "Section 09: Flight Timeline — 48-second scrubber, 8 demo shots, animated saucer, play/pause, speed control" },
      { type: "ADD", text: "Section 10: Bill of Materials — 21-item costed BOM, pie/bar charts, category filtering, data table" },
    ],
  },
  {
    version: "v1.0",
    date: "20 Feb 2026",
    status: "SUPERSEDED",
    changes: [
      { type: "ADD", text: "Initial dashboard: Overview, Propulsion Architectures, Fan Layout, Control Stack, Motion Primitives, Performance Calculator, Demo Storyboard, Physics Basis" },
      { type: "ADD", text: "Classified Aerospace Dossier design: dark navy, electric cyan, amber-gold, Rajdhani + JetBrains Mono" },
      { type: "ADD", text: "Animated CSS 3D flying saucer hero with live telemetry overlay" },
    ],
  },
];

const TYPE_COLORS: Record<string, string> = {
  ADD: "oklch(0.65 0.18 145)",
  FIX: "oklch(0.75 0.18 200)",
  CHANGE: "oklch(0.72 0.16 80)",
  REMOVE: "oklch(0.65 0.22 25)",
};

interface Props {
  onClose: () => void;
}

export default function ChangelogModal({ onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "oklch(0 0 0 / 0.70)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-sm flex flex-col"
        style={{
          width: "min(680px, 95vw)",
          maxHeight: "80vh",
          background: "oklch(0.12 0.022 240)",
          border: "1px solid oklch(0.25 0.015 240)",
          boxShadow: "0 24px 64px oklch(0 0 0 / 0.60)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid oklch(0.20 0.015 240)" }}>
          <div>
            <div className="label-caps mb-0.5" style={{ color: "oklch(0.75 0.18 200)" }}>PROJECT AURORA</div>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 18, fontWeight: 700, color: "oklch(0.90 0.005 240)", letterSpacing: "0.06em" }}>
              ENGINEERING REFERENCE — CHANGELOG
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-sm transition-colors"
            style={{ color: "oklch(0.45 0.015 240)", border: "1px solid oklch(0.22 0.015 240)" }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {CHANGELOG.map(entry => (
            <div key={entry.version} className="rounded-sm overflow-hidden" style={{
              border: `1px solid ${entry.status === "CURRENT" ? "oklch(0.75 0.18 200 / 0.40)" : "oklch(0.20 0.015 240)"}`,
            }}>
              {/* Version header */}
              <div className="flex items-center justify-between px-4 py-3" style={{
                background: entry.status === "CURRENT" ? "oklch(0.75 0.18 200 / 0.08)" : "oklch(0.13 0.018 240)",
              }}>
                <div className="flex items-center gap-3">
                  <span style={{ fontFamily: "'Rajdhani'", fontSize: 16, fontWeight: 700, color: entry.status === "CURRENT" ? "oklch(0.75 0.18 200)" : "oklch(0.55 0.010 240)" }}>
                    {entry.version}
                  </span>
                  {entry.status === "CURRENT" && (
                    <span className="label-caps px-2 py-0.5 rounded-sm" style={{
                      fontSize: 8,
                      background: "oklch(0.75 0.18 200 / 0.15)",
                      color: "oklch(0.75 0.18 200)",
                      border: "1px solid oklch(0.75 0.18 200 / 0.35)",
                    }}>CURRENT</span>
                  )}
                </div>
                <span className="label-caps" style={{ fontSize: 9, color: "oklch(0.38 0.012 240)" }}>{entry.date}</span>
              </div>

              {/* Change list */}
              <div className="px-4 py-3 space-y-1.5">
                {entry.changes.map((c, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="label-caps px-1.5 py-0.5 rounded-sm shrink-0 mt-0.5" style={{
                      fontSize: 7,
                      background: `${TYPE_COLORS[c.type].replace(")", " / 0.12)")}`,
                      color: TYPE_COLORS[c.type],
                      border: `1px solid ${TYPE_COLORS[c.type].replace(")", " / 0.30)")}`,
                      minWidth: 44, textAlign: "center",
                    }}>{c.type}</span>
                    <span className="text-xs leading-relaxed" style={{ color: "oklch(0.62 0.008 240)", fontFamily: "'Inter'" }}>{c.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: "1px solid oklch(0.18 0.015 240)" }}>
          <span className="label-caps" style={{ fontSize: 8, color: "oklch(0.30 0.012 240)" }}>Project Aurora · Repulsion-Illusion Flight System · 9 versions</span>
          <button onClick={onClose} className="label-caps px-4 py-1.5 rounded-sm transition-colors"
            style={{ fontSize: 10, background: "oklch(0.75 0.18 200 / 0.10)", color: "oklch(0.75 0.18 200)", border: "1px solid oklch(0.75 0.18 200 / 0.35)" }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
