// Design: Classified Aerospace Dossier — dark navy, cyan/amber accents, Rajdhani + JetBrains Mono
// Page: Allocator Dashboard — tabbed view of V1–V4 thrust allocator runs with live JSON loading

import * as React from "react";
import V1Card from "@/components/allocator/V1Card";
import V2CompareCard from "@/components/allocator/V2CompareCard";
import V3StepCard from "@/components/allocator/V3StepCard";
import V3StepSnapCard from "@/components/allocator/V3StepSnapCard";
import V4RepelCard from "@/components/allocator/V4RepelCard";

const BASE = "/aurora/allocator";

const TABS = [
  { id: "v1",      label: "V1 — Omni Slide",       badge: "baseline",  color: "cyan" },
  { id: "v2",      label: "V2 — Yaw Trim",          badge: "compare",   color: "cyan" },
  { id: "v3step",  label: "V3 — Step",              badge: "reversal",  color: "cyan" },
  { id: "v3snap",  label: "V3 — Step-Snap",         badge: "signature", color: "amber" },
  { id: "v4",      label: "V4 — Repel Field",       badge: "gate-D",    color: "cyan" },
] as const;

type TabId = typeof TABS[number]["id"];

export default function Allocator() {
  const [active, setActive] = React.useState<TabId>("v1");

  return (
    <div className="min-h-screen bg-[#020817] text-white font-sans">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#020817]/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-widest">
                AURORA — ALLOCATOR
              </span>
              <span className="text-[10px] font-mono opacity-40 uppercase tracking-widest">SITL Run Data</span>
            </div>
            <h1 className="text-lg font-bold mt-1" style={{ fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em" }}>
              THRUST ALLOCATOR DASHBOARD
            </h1>
          </div>
          <div className="text-[10px] font-mono opacity-40 text-right hidden sm:block">
            <div>V1 → V4 PROGRESSION</div>
            <div>JSON: /aurora/allocator/*.json</div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto pb-0 scrollbar-none">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono whitespace-nowrap border-b-2 transition-all ${
                active === tab.id
                  ? tab.color === "amber"
                    ? "border-amber-400 text-amber-400"
                    : "border-cyan-400 text-cyan-400"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              {tab.label}
              <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest ${
                active === tab.id
                  ? tab.color === "amber"
                    ? "bg-amber-500/20 text-amber-400"
                    : "bg-cyan-500/20 text-cyan-400"
                  : "bg-white/5 text-white/30"
              }`}>
                {tab.badge}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Version progression banner */}
        <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-[10px] font-mono uppercase tracking-widest opacity-50 mb-2">Allocator Progression</div>
          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {[
              { v: "V1", desc: "Cosine distribution — no yaw trim" },
              { v: "V2", desc: "+ independent yaw torque channel" },
              { v: "V3", desc: "+ step reversal & snap-stop" },
              { v: "V4", desc: "+ repel field / Gate-D" },
            ].map((item, i, arr) => (
              <React.Fragment key={item.v}>
                <span className="flex items-center gap-1">
                  <span className="text-cyan-400">{item.v}</span>
                  <span className="opacity-50">{item.desc}</span>
                </span>
                {i < arr.length - 1 && <span className="opacity-30">→</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Drop-in JSON note */}
        <div className="mb-6 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs font-mono text-amber-300/70">
          <span className="text-amber-400 font-semibold">DROP-IN DATA:</span> Replace the sample JSON files under{" "}
          <code className="bg-white/10 px-1 rounded">client/public/aurora/allocator/</code> with your real SITL/HITL run outputs
          and the cards will update automatically on next load.
        </div>

        {/* Active tab content */}
        <div className="min-h-[400px]">
          {active === "v1" && (
            <V1Card url={`${BASE}/v1_demo.json`} />
          )}
          {active === "v2" && (
            <V2CompareCard
              urlMz0={`${BASE}/v2_demo_mz0.json`}
              urlMz2000={`${BASE}/v2_demo_mz2000.json`}
            />
          )}
          {active === "v3step" && (
            <V3StepCard url={`${BASE}/v3_step.json`} />
          )}
          {active === "v3snap" && (
            <V3StepSnapCard url={`${BASE}/v3_step_snap.json`} />
          )}
          {active === "v4" && (
            <V4RepelCard url={`${BASE}/v4_repel_wall.json`} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 border-t border-white/10 pt-4 flex items-center justify-between text-[10px] font-mono opacity-30">
          <span>PROJECT AURORA — ALLOCATOR DASHBOARD</span>
          <span>ENGINEERING REFERENCE v11.0</span>
        </div>
      </div>
    </div>
  );
}
