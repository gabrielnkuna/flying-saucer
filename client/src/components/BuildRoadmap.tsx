/* =============================================================
   COMPONENT: BuildRoadmap
   Design: Classified Aerospace Dossier
   Gantt-style horizontal timeline of 6 development phases
   with milestones, dependency arrows, and status tracking.
   ============================================================= */
import { useState } from "react";

interface Milestone {
  id: string;
  label: string;
  week: number; // relative to phase start
  critical: boolean;
}

interface Phase {
  id: string;
  number: number;
  name: string;
  shortName: string;
  start: number; // weeks from project start
  duration: number; // weeks
  color: string;
  status: "complete" | "active" | "planned";
  description: string;
  deliverables: string[];
  milestones: Milestone[];
  dependencies: string[]; // phase ids
}

const PHASES: Phase[] = [
  {
    id: "concept",
    number: 1,
    name: "Concept & Requirements",
    shortName: "Concept",
    start: 0,
    duration: 8,
    color: "oklch(0.65 0.18 145)",
    status: "complete",
    description: "Define mission requirements, performance envelope, and technology selection. Establish the negative-mass illusion flight model and select ducted-fan propulsion.",
    deliverables: ["Mission Requirements Document", "Technology Readiness Assessment", "Propulsion Trade-off Report", "Preliminary Mass Budget"],
    milestones: [
      { id: "m1-1", label: "Concept Freeze", week: 6, critical: true },
      { id: "m1-2", label: "TRL Assessment", week: 8, critical: false },
    ],
    dependencies: [],
  },
  {
    id: "pdr",
    number: 2,
    name: "Preliminary Design Review",
    shortName: "PDR",
    start: 8,
    duration: 10,
    color: "oklch(0.75 0.18 200)",
    status: "complete",
    description: "Develop preliminary structural, propulsion, and avionics architectures. Conduct CFD on plenum geometry. Establish control law baseline.",
    deliverables: ["Preliminary Design Package", "CFD Analysis Report", "Control Law Baseline", "Risk Register v1"],
    milestones: [
      { id: "m2-1", label: "CFD Complete", week: 6, critical: false },
      { id: "m2-2", label: "PDR Gate", week: 10, critical: true },
    ],
    dependencies: ["concept"],
  },
  {
    id: "cdr",
    number: 3,
    name: "Critical Design Review",
    shortName: "CDR",
    start: 18,
    duration: 12,
    color: "oklch(0.72 0.16 80)",
    status: "active",
    description: "Finalise all engineering drawings, FEA structural analysis, and avionics architecture. Complete software design. Procure long-lead items.",
    deliverables: ["Final Engineering Drawings", "FEA Structural Report", "Software Design Document", "Long-lead Procurement"],
    milestones: [
      { id: "m3-1", label: "FEA Sign-off", week: 7, critical: true },
      { id: "m3-2", label: "CDR Gate", week: 12, critical: true },
    ],
    dependencies: ["pdr"],
  },
  {
    id: "manufacturing",
    number: 4,
    name: "Manufacturing & Assembly",
    shortName: "Mfg",
    start: 30,
    duration: 16,
    color: "oklch(0.60 0.15 280)",
    status: "planned",
    description: "Fabricate CFRP hull, fan ring assembly, vectoring vane system, and avionics bay. Integrate all subsystems. Conduct subsystem acceptance tests.",
    deliverables: ["Hull Assembly", "Fan Ring Module", "Avionics Integration", "Subsystem Test Reports"],
    milestones: [
      { id: "m4-1", label: "Hull Complete", week: 8, critical: true },
      { id: "m4-2", label: "Full Integration", week: 14, critical: true },
      { id: "m4-3", label: "Acceptance Tests", week: 16, critical: false },
    ],
    dependencies: ["cdr"],
  },
  {
    id: "integration",
    number: 5,
    name: "System Integration & Test",
    shortName: "SIT",
    start: 46,
    duration: 10,
    color: "oklch(0.65 0.22 25)",
    status: "planned",
    description: "Execute the 12-test ground test sequence. Conduct tethered hover trials. Validate control laws and fault-tolerance modes. Obtain airworthiness clearance.",
    deliverables: ["Ground Test Report", "Tethered Hover Data", "Control Law Validation", "Airworthiness Clearance"],
    milestones: [
      { id: "m5-1", label: "Ground Tests Pass", week: 6, critical: true },
      { id: "m5-2", label: "Tethered Hover", week: 8, critical: true },
      { id: "m5-3", label: "Clearance", week: 10, critical: true },
    ],
    dependencies: ["manufacturing"],
  },
  {
    id: "flight",
    number: 6,
    name: "Flight Test Campaign",
    shortName: "Flight",
    start: 56,
    duration: 12,
    color: "oklch(0.62 0.25 20)",
    status: "planned",
    description: "Execute 8-shot demo storyboard flight test campaign. Collect performance data across all motion primitives. Produce demonstration video and final report.",
    deliverables: ["Flight Test Data Package", "Demo Video", "Performance Report", "Lessons Learned"],
    milestones: [
      { id: "m6-1", label: "First Free Flight", week: 2, critical: true },
      { id: "m6-2", label: "All 8 Shots", week: 8, critical: true },
      { id: "m6-3", label: "Final Report", week: 12, critical: false },
    ],
    dependencies: ["integration"],
  },
];

const TOTAL_WEEKS = 68;

const STATUS_LABELS: Record<string, string> = {
  complete: "COMPLETE",
  active: "IN PROGRESS",
  planned: "PLANNED",
};

const STATUS_COLORS: Record<string, string> = {
  complete: "oklch(0.65 0.18 145)",
  active: "oklch(0.75 0.18 200)",
  planned: "oklch(0.40 0.015 240)",
};

export default function BuildRoadmap() {
  const [selected, setSelected] = useState<string | null>("cdr");
  const selectedPhase = PHASES.find(p => p.id === selected);

  // Current week marker (simulated — CDR week 5)
  const currentWeek = 23;

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        {PHASES.map(p => (
          <button key={p.id} onClick={() => setSelected(p.id === selected ? null : p.id)}
            className="rounded-sm p-3 text-center transition-all"
            style={{
              background: selected === p.id ? `${p.color.replace(")", " / 0.12)")}` : "oklch(0.12 0.018 240)",
              border: `1px solid ${selected === p.id ? p.color.replace(")", " / 0.50)") : "oklch(0.20 0.015 240)"}`,
            }}>
            <div className="label-caps mb-1" style={{ fontSize: 8, color: p.color }}>Phase {p.number}</div>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, fontWeight: 700, color: selected === p.id ? p.color : "oklch(0.60 0.005 240)" }}>{p.shortName}</div>
            <div className="label-caps mt-1" style={{ fontSize: 8, color: STATUS_COLORS[p.status] }}>{STATUS_LABELS[p.status]}</div>
          </button>
        ))}
      </div>

      {/* Gantt chart */}
      <div className="bg-navy-surface panel-border rounded-sm p-5 overflow-x-auto">
        <div className="label-caps mb-4">Programme Timeline (weeks from project start)</div>
        <div style={{ minWidth: 700 }}>
          {/* Week ruler */}
          <div className="flex mb-3" style={{ paddingLeft: 100 }}>
            {Array.from({ length: Math.ceil(TOTAL_WEEKS / 4) + 1 }, (_, i) => i * 4).map(w => (
              <div key={w} style={{ width: `${(4 / TOTAL_WEEKS) * 100}%`, flexShrink: 0 }}>
                <div className="label-caps" style={{ fontSize: 8, color: "oklch(0.35 0.015 240)" }}>W{w}</div>
              </div>
            ))}
          </div>

          {/* Phase rows */}
          <div className="space-y-2 relative">
            {/* Current week line */}
            <div className="absolute top-0 bottom-0 pointer-events-none" style={{
              left: `calc(100px + ${(currentWeek / TOTAL_WEEKS) * (100)}%)`,
              width: 1,
              background: "oklch(0.75 0.18 200 / 0.6)",
              zIndex: 10,
            }}>
              <div className="label-caps px-1" style={{ fontSize: 8, color: "oklch(0.75 0.18 200)", background: "oklch(0.10 0.020 240)", whiteSpace: "nowrap", transform: "translateX(-50%)" }}>NOW</div>
            </div>

            {PHASES.map(phase => {
              const barLeft = (phase.start / TOTAL_WEEKS) * 100;
              const barWidth = (phase.duration / TOTAL_WEEKS) * 100;
              const isSelected = selected === phase.id;
              return (
                <div key={phase.id} className="flex items-center gap-0 cursor-pointer" onClick={() => setSelected(phase.id === selected ? null : phase.id)}>
                  {/* Phase label */}
                  <div style={{ width: 100, flexShrink: 0, paddingRight: 8 }}>
                    <div className="label-caps text-right" style={{ fontSize: 9, color: isSelected ? phase.color : "oklch(0.45 0.015 240)" }}>{phase.shortName}</div>
                  </div>

                  {/* Bar track */}
                  <div className="flex-1 relative h-7 rounded-sm" style={{ background: "oklch(0.14 0.018 240)" }}>
                    {/* Phase bar */}
                    <div className="absolute top-1 bottom-1 rounded-sm transition-all" style={{
                      left: `${barLeft}%`,
                      width: `${barWidth}%`,
                      background: isSelected
                        ? `${phase.color.replace(")", " / 0.35)")}`
                        : phase.status === "complete"
                          ? `${phase.color.replace(")", " / 0.20)")}`
                          : phase.status === "active"
                            ? `${phase.color.replace(")", " / 0.25)")}`
                            : `${phase.color.replace(")", " / 0.10)")}`,
                      border: `1px solid ${phase.color.replace(")", isSelected ? " / 0.70)" : " / 0.35)")}`,
                    }}>
                      {/* Phase name inside bar */}
                      <div className="absolute inset-0 flex items-center px-2 overflow-hidden">
                        <span className="label-caps truncate" style={{ fontSize: 8, color: phase.color }}>{phase.name}</span>
                      </div>
                    </div>

                    {/* Milestones */}
                    {phase.milestones.map(ms => {
                      const msLeft = ((phase.start + ms.week) / TOTAL_WEEKS) * 100;
                      return (
                        <div key={ms.id} className="absolute top-0 bottom-0 flex items-center" style={{ left: `${msLeft}%`, transform: "translateX(-50%)", zIndex: 5 }}>
                          <div title={ms.label} style={{
                            width: 8, height: 8,
                            background: ms.critical ? "oklch(0.65 0.22 25)" : phase.color,
                            transform: "rotate(45deg)",
                            border: `1px solid oklch(0.10 0.020 240)`,
                          }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4" style={{ paddingLeft: 100 }}>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 8, height: 8, background: "oklch(0.65 0.22 25)", transform: "rotate(45deg)" }} />
              <span className="label-caps" style={{ fontSize: 8, color: "oklch(0.40 0.015 240)" }}>Critical milestone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 8, height: 8, background: "oklch(0.75 0.18 200)", transform: "rotate(45deg)" }} />
              <span className="label-caps" style={{ fontSize: 8, color: "oklch(0.40 0.015 240)" }}>Milestone</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div style={{ width: 16, height: 2, background: "oklch(0.75 0.18 200 / 0.6)" }} />
              <span className="label-caps" style={{ fontSize: 8, color: "oklch(0.40 0.015 240)" }}>Current week (W{currentWeek})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Selected phase detail */}
      {selectedPhase && (
        <div className="rounded-sm p-5 space-y-4" style={{
          background: `${selectedPhase.color.replace(")", " / 0.06)")}`,
          border: `1px solid ${selectedPhase.color.replace(")", " / 0.35)")}`,
        }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="label-caps mb-1" style={{ color: selectedPhase.color }}>Phase {selectedPhase.number} · {STATUS_LABELS[selectedPhase.status]}</div>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 20, fontWeight: 700, color: selectedPhase.color }}>{selectedPhase.name}</div>
              <div className="label-caps mt-1" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>
                W{selectedPhase.start} – W{selectedPhase.start + selectedPhase.duration} · {selectedPhase.duration} weeks
              </div>
            </div>
            {selectedPhase.dependencies.length > 0 && (
              <div className="text-right">
                <div className="label-caps mb-1" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>Depends on</div>
                <div className="flex flex-col gap-1">
                  {selectedPhase.dependencies.map(dep => {
                    const depPhase = PHASES.find(p => p.id === dep);
                    return depPhase ? (
                      <span key={dep} className="label-caps px-2 py-0.5 rounded-sm" style={{
                        fontSize: 8,
                        background: `${depPhase.color.replace(")", " / 0.12)")}`,
                        color: depPhase.color,
                        border: `1px solid ${depPhase.color.replace(")", " / 0.35)")}`,
                      }}>{depPhase.shortName}</span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>

          <p className="text-sm leading-relaxed" style={{ color: "oklch(0.60 0.008 240)", fontFamily: "'Inter'" }}>{selectedPhase.description}</p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="label-caps mb-2" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>Key Deliverables</div>
              <div className="space-y-1">
                {selectedPhase.deliverables.map((d, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full shrink-0" style={{ background: selectedPhase.color }} />
                    <span className="text-xs" style={{ color: "oklch(0.60 0.008 240)", fontFamily: "'Inter'" }}>{d}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="label-caps mb-2" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>Milestones</div>
              <div className="space-y-1">
                {selectedPhase.milestones.map(ms => (
                  <div key={ms.id} className="flex items-center gap-2">
                    <div style={{ width: 6, height: 6, background: ms.critical ? "oklch(0.65 0.22 25)" : selectedPhase.color, transform: "rotate(45deg)", flexShrink: 0 }} />
                    <span className="text-xs" style={{ color: "oklch(0.60 0.008 240)", fontFamily: "'Inter'" }}>W{selectedPhase.start + ms.week} · {ms.label}</span>
                    {ms.critical && <span className="label-caps" style={{ fontSize: 8, color: "oklch(0.65 0.22 25)" }}>CRITICAL</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
