/* =============================================================
   PAGE: Home — Project Aurora Dashboard
   Design: Classified Aerospace Dossier
   Dark navy · Electric cyan · Amber-gold · Rajdhani + JetBrains Mono
   ============================================================= */
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SaucerCanvas from "@/components/SaucerCanvas";
import PerformanceCalculator from "@/components/PerformanceCalculator";
import FanLayout from "@/components/FanLayout";
import ControlStack from "@/components/ControlStack";
import MotionPrimitives from "@/components/MotionPrimitives";
import Storyboard from "@/components/Storyboard";
import ThrustVectoringSimulator from "@/components/ThrustVectoringSimulator";
import FlightTimeline from "@/components/FlightTimeline";
import BillOfMaterials from "@/components/BillOfMaterials";
import FaultToleranceSimulator from "@/components/FaultToleranceSimulator";
import AcousticAnalyser from "@/components/AcousticAnalyser";
import ThermalManagement from "@/components/ThermalManagement";
import RegulatoryCompliance from "@/components/RegulatoryCompliance";
import ExplodedView from "@/components/ExplodedView";
import MissionEnergyPlanner from "@/components/MissionEnergyPlanner";
import WindDisturbanceSimulator from "@/components/WindDisturbanceSimulator";
import TechnicalBrief from "@/components/TechnicalBrief";
import ScaleConfigurator from "@/components/ScaleConfigurator";
import MaterialsComparison from "@/components/MaterialsComparison";
import SensorFusionDiagram from "@/components/SensorFusionDiagram";
import PropulsionTradeoff from "@/components/PropulsionTradeoff";
import GroundTestPlanner from "@/components/GroundTestPlanner";
import TelemetryHUD from "@/components/TelemetryHUD";
import VibrationAnalyser from "@/components/VibrationAnalyser";
import BuildRoadmap from "@/components/BuildRoadmap";
import RnDSpeculation from "@/components/RnDSpeculation";

const HERO_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/6YEWa6XfHa3mfksXDACJN4/sandbox/BF8Qe8UjwgOqOT96SxE286-img-1_1771597400000_na1fn_c2F1Y2VyLWhlcm8.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNllFV2E2WGZIYTNtZmtzWERBQ0pONC9zYW5kYm94L0JGOFFlOFVqd2dPcU9UOTZTeEUyODYtaW1nLTFfMTc3MTU5NzQwMDAwMF9uYTFmbl9jMkYxWTJWeUxXaGxjbTgucG5nP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=IxnRXrwQL8z6VRSai-YPL1f8RGISpZF5L5A5DnBz5zbwis6P4n4yh20HDcVPt3F3b0f3KjWngrGLKDxWH07HJ2C8RlQa7PzHXb~c7aej~-vVzz9sGuU2d3OtwYvnkoekmO9TZXnNBEUXsRps6jNhAPJ8qMkDJG8FMtOgr9xHwozzjRkZlW3PKQCEnTNH4ffk~EBuYzjsi7cIArXqLlyjTOfj3xBmnoHQyJv-ZPFWrWSSmMru2nP52w~vGHyrHuI6PhMMvEhbFFE7lrW9VqLN78v3tFRSAqfme9oyjWP1w5AR4~Ip5oll5befoicK9j6MZiXpqw2jnp50o2ltEAqy-Q__";
const UNDERSIDE_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/6YEWa6XfHa3mfksXDACJN4/sandbox/BF8Qe8UjwgOqOT96SxE286-img-2_1771597409000_na1fn_c2F1Y2VyLXVuZGVyc2lkZQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNllFV2E2WGZIYTNtZmtzWERBQ0pONC9zYW5kYm94L0JGOFFlOFVqd2dPcU9UOTZTeEUyODYtaW1nLTJfMTc3MTU5NzQwOTAwMF9uYTFmbl9jMkYxWTJWeUxYVnVaR1Z5YzJsa1pRLnBuZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=IY~HdLtYjwKCJhN912VmeiQi8RG5Rp1C8OT0zJwaGnHNskxLStqG~j7I2pFzwiWMBQKDZpV11EN2DaP-KBl59rjCttXZLvtsbzmTQK5pOxcoI5Pg1XeOgOJsdMrXCR-KydFMAnmb2aei-hMS~iWjlVDAkVj6RD8EfDyAwTQhjgzD~q9nlCKAZPPMXmg7DsWgUcj4HficEBsCfZuaExrQ5kb8RmbOSaMcD3-3Y4i6hSPMlDtaC-74eR4IeNkASFsXMkaiyx~fnONtk1xGYjJr2amYu6L~ld7TLb~pUZco6wyh9tTStlD1JZHXZRmWfMOm1Z2ZbnysCQhKBFDv0hmDgA__";
const SIDE_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/6YEWa6XfHa3mfksXDACJN4/sandbox/BF8Qe8UjwgOqOT96SxE286-img-4_1771597406000_na1fn_c2F1Y2VyLXNpZGUtcHJvZmlsZQ.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvNllFV2E2WGZIYTNtZmtzWERBQ0pONC9zYW5kYm94L0JGOFFlOFVqd2dPcU9UOTZTeEUyODYtaW1nLTRfMTc3MTU5NzQwNjAwMF9uYTFmbl9jMkYxWTJWeUxYTnBaR1V0Y0hKdlptbHNaUS5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=fbCQXj4gNDrbTV0cI7QHCLkUzXQMI2sP8HYKpmmeTsV~HSfjclY36IvZFb3zwQcAmkmT6Pyv7CISg8X29Oc9brOFYJ0Wo67uShyfm6mPGFOHXc2m1RoqPIKZh~z3Z6QWSOzfYyVRLTOnwNsc4SSQAUaiEGSk8UP~wf~3ayBzbDi38P0uDZ0XX5y9lA~yoB~BRc83KXvlg68jnZlaFofq72CcRYgHaoSjtLHGElESBclDChOFcVe4Jkj2tg4pehcQZ2RQxFfhjXFUQjQoECC9PFzoSZJWa6GV9tyskssuTnBIhXUTSpgdc-J6EGuyE9J1dXb0cT6IqTolI6cgMg1KNg__";

const NAV_SECTIONS = [
  { id: "overview", label: "Overview", icon: "◉" },
  { id: "propulsion", label: "Propulsion", icon: "⊕" },
  { id: "fan-layout", label: "Fan Layout", icon: "⊗" },
  { id: "control-stack", label: "Control Stack", icon: "≡" },
  { id: "motion", label: "Motion Primitives", icon: "→" },
  { id: "performance", label: "Performance Calc", icon: "∫" },
  { id: "storyboard", label: "Demo Storyboard", icon: "▶" },
  { id: "physics", label: "Physics Basis", icon: "ψ" },
  { id: "vectoring", label: "Vectoring Sim", icon: "⊛" },
  { id: "timeline", label: "Flight Timeline", icon: "⏵" },
  { id: "bom", label: "Bill of Materials", icon: "⊞" },
  { id: "fault", label: "Fault Tolerance", icon: "⚠" },
  { id: "acoustic", label: "Acoustic Analyser", icon: "∿" },
  { id: "thermal", label: "Thermal Mgmt", icon: "☀" },
  { id: "regulatory", label: "Regulatory", icon: "⚖" },
  { id: "exploded", label: "Exploded View", icon: "⦿" },
  { id: "energy", label: "Energy Planner", icon: "⚡" },
  { id: "wind", label: "Wind Sim", icon: "≋" },
  { id: "brief", label: "Technical Brief", icon: "⎙" },
  { id: "scale", label: "Scale Config", icon: "◎" },
  { id: "materials", label: "Materials", icon: "⧉" },
  { id: "sensor-fusion", label: "Sensor Fusion", icon: "⨂" },
  { id: "propulsion-tradeoff", label: "Propulsion Matrix", icon: "△" },
  { id: "ground-test", label: "Ground Tests", icon: "✓" },
  { id: "telemetry", label: "Telemetry HUD", icon: "●" },
  { id: "vibration", label: "Vibration", icon: "∿" },
  { id: "roadmap", label: "Build Roadmap", icon: "◫" },
  { id: "rnd-speculation", label: "R\u0026D Speculation", icon: "Ψ" },
];

function SectionHeader({ label, title, accent = "cyan" }: { label: string; title: string; accent?: "cyan" | "amber" }) {
  const color = accent === "cyan" ? "oklch(0.75 0.18 200)" : "oklch(0.72 0.16 80)";
  return (
    <div className="mb-8">
      <div className="label-caps mb-2" style={{ color }}>{label}</div>
      <h2 style={{ fontFamily: "'Rajdhani'", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 700, color: "oklch(0.92 0.005 240)", letterSpacing: "0.05em", lineHeight: 1.1 }}>
        {title}
      </h2>
      <div className="ring-glow-divider mt-3" style={{ background: `radial-gradient(ellipse at left, ${color.replace(')', ' / 0.5)')} 0%, transparent 60%)` }} />
    </div>
  );
}

function PropulsionArchCard({ title, tier, color, items }: { title: string; tier: string; color: string; items: string[] }) {
  return (
    <div className="rounded-sm p-5 h-full" style={{ background: "oklch(0.14 0.020 240)", border: `1px solid ${color.replace(')', ' / 0.3)')}` }}>
      <div className="flex items-center justify-between mb-3">
        <span className="label-caps" style={{ color }}>{tier}</span>
        <div className="classified-stamp" style={{ color: `${color.replace(')', ' / 0.6)')}`, borderColor: `${color.replace(')', ' / 0.3)')}` }}>
          {tier === "Current Tech" ? "FEASIBLE" : tier === "Emerging" ? "NEAR-TERM" : "SPECULATIVE"}
        </div>
      </div>
      <h3 style={{ fontFamily: "'Rajdhani'", fontSize: "1rem", fontWeight: 700, color: "oklch(0.88 0.005 240)", letterSpacing: "0.05em", marginBottom: 12 }}>
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item} className="flex gap-2 items-start">
            <span style={{ color, fontSize: 10, marginTop: 3, flexShrink: 0 }}>▶</span>
            <span className="text-xs leading-relaxed" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'" }}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [navSearch, setNavSearch] = useState("");
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const filteredNav = navSearch.trim()
    ? NAV_SECTIONS.filter(s => s.label.toLowerCase().includes(navSearch.toLowerCase()))
    : NAV_SECTIONS;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px" }
    );
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex" style={{ background: "oklch(0.10 0.025 240)" }}>

      {/* ── Sidebar ── */}
      <aside
        className="fixed left-0 top-0 h-full z-40 flex flex-col"
        style={{
          width: sidebarOpen ? 220 : 52,
          background: "oklch(0.12 0.022 240)",
          borderRight: "1px solid oklch(0.20 0.015 240)",
          transition: "width 0.25s ease",
          overflow: "hidden",
        }}
      >
        {/* Logo / title */}
        <div className="flex items-center gap-3 px-3 py-4" style={{ borderBottom: "1px solid oklch(0.18 0.015 240)", minHeight: 64 }}>
          <div className="flex-shrink-0 w-7 h-7 rounded-sm flex items-center justify-center"
            style={{ background: "oklch(0.75 0.18 200 / 0.15)", border: "1px solid oklch(0.75 0.18 200 / 0.4)" }}>
            <span style={{ fontSize: 14, color: "oklch(0.75 0.18 200)" }}>◉</span>
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ fontFamily: "'Rajdhani'", fontWeight: 700, fontSize: 13, color: "oklch(0.88 0.005 240)", letterSpacing: "0.1em" }}>
                PROJECT AURORA
              </div>
              <div className="label-caps" style={{ fontSize: 9 }}>CLASSIFIED · LEVEL 5</div>
            </div>
          )}
        </div>

        {/* Search box */}
        {sidebarOpen && (
          <div className="px-3 py-2" style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-sm" style={{ background: "oklch(0.14 0.018 240)", border: "1px solid oklch(0.22 0.015 240)" }}>
              <span style={{ fontSize: 10, color: "oklch(0.40 0.015 240)" }}>⌕</span>
              <input
                type="text"
                placeholder="Search sections…"
                value={navSearch}
                onChange={e => setNavSearch(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "oklch(0.70 0.005 240)", caretColor: "oklch(0.75 0.18 200)" }}
              />
              {navSearch && (
                <button onClick={() => setNavSearch("")} style={{ fontSize: 10, color: "oklch(0.40 0.015 240)" }}>✕</button>
              )}
            </div>
            {navSearch && (
              <div className="label-caps mt-1" style={{ fontSize: 8, color: "oklch(0.35 0.015 240)" }}>{filteredNav.length} result{filteredNav.length !== 1 ? "s" : ""}</div>
            )}
          </div>
        )}

        {/* Nav items */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {filteredNav.map(s => {
            const isActive = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 transition-all text-left"
                style={{
                  background: isActive ? "oklch(0.75 0.18 200 / 0.08)" : "transparent",
                  borderLeft: `2px solid ${isActive ? "oklch(0.75 0.18 200)" : "transparent"}`,
                }}
              >
                <span className="flex-shrink-0 text-sm" style={{ color: isActive ? "oklch(0.75 0.18 200)" : "oklch(0.40 0.015 240)", width: 20, textAlign: "center" }}>
                  {s.icon}
                </span>
                {sidebarOpen && (
                  <span style={{ fontFamily: "'Rajdhani'", fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", color: isActive ? "oklch(0.88 0.005 240)" : "oklch(0.50 0.012 240)", whiteSpace: "nowrap" }}>
                    {s.label.toUpperCase()}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(v => !v)}
          className="flex items-center justify-center py-3"
          style={{ borderTop: "1px solid oklch(0.18 0.015 240)", color: "oklch(0.40 0.015 240)" }}
        >
          <span style={{ fontSize: 12, transform: sidebarOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.25s" }}>◀</span>
        </button>
      </aside>

      {/* ── Main content ── */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ marginLeft: sidebarOpen ? 220 : 52, transition: "margin-left 0.25s ease" }}
      >

        {/* ── HERO ── */}
        <section
          id="overview"
          ref={el => { sectionRefs.current["overview"] = el; }}
          className="relative min-h-screen flex flex-col"
          style={{ overflow: "hidden" }}
        >
          {/* Hero background image */}
          <div className="absolute inset-0">
            <img src={HERO_IMG} alt="Flying Saucer" className="w-full h-full object-cover" style={{ objectPosition: "center 40%" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, oklch(0.10 0.025 240 / 0.55) 0%, oklch(0.10 0.025 240 / 0.75) 50%, oklch(0.10 0.025 240) 100%)" }} />
          </div>

          {/* Scanline overlay */}
          <div className="absolute inset-0 scanline pointer-events-none" />

          {/* Hero content */}
          <div className="relative z-10 flex flex-col justify-end h-screen px-8 pb-16 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="classified-stamp">TOP SECRET</span>
                <span className="classified-stamp" style={{ color: "oklch(0.75 0.18 200 / 0.7)", borderColor: "oklch(0.75 0.18 200 / 0.4)", transform: "rotate(1deg)" }}>
                  CLEARANCE LEVEL 5
                </span>
              </div>
              <h1 style={{ fontFamily: "'Rajdhani'", fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 700, color: "oklch(0.95 0.005 240)", letterSpacing: "0.05em", lineHeight: 1, marginBottom: 16 }}>
                PROJECT AURORA
                <br />
                <span style={{ color: "oklch(0.75 0.18 200)" }}>REPULSION-ILLUSION</span>
                <br />
                FLIGHT SYSTEM
              </h1>
              <p style={{ fontFamily: "'Inter'", fontSize: "clamp(0.85rem, 1.5vw, 1rem)", color: "oklch(0.70 0.008 240)", maxWidth: 560, lineHeight: 1.6, marginBottom: 8 }}>
                A flying saucer-scale craft engineered to produce a convincing repulsion-illusion through distributed ducted lift, segmented thrust vectoring, and a four-layer control architecture — no exotic matter required.
              </p>
              <p style={{ fontFamily: "'Inter'", fontSize: "0.78rem", color: "oklch(0.50 0.010 240)", maxWidth: 560, lineHeight: 1.5, marginBottom: 24 }}>
                <span style={{ color: "oklch(0.72 0.16 80)", fontWeight: 600 }}>Implementation:</span> repulsion-illusion via distributed lift + segmented vectoring + control. True negative-mass physics is treated separately in the{" "}
                <button onClick={() => { document.getElementById("rnd-speculation")?.scrollIntoView({ behavior: "smooth", block: "start" }); }} style={{ color: "oklch(0.75 0.18 200)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", fontFamily: "'Inter'", fontSize: "0.78rem" }}>R&amp;D Speculation</button>{" "}
                section.
              </p>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Diameter", value: "4–8 m", note: null, color: "oklch(0.75 0.18 200)" },
                  { label: "Dry Mass", value: "800 kg", note: null, color: "oklch(0.75 0.18 200)" },
                  { label: "Hover Power", value: "220 kW", note: "continuous", color: "oklch(0.75 0.18 200)" },
                  { label: "Burst Power", value: "350 kW", note: "10–30 s max", color: "oklch(0.65 0.22 25)" },
                  { label: "Battery", value: "55 kWh", note: "≈ 15 min hover", color: "oklch(0.65 0.22 25)" },
                  { label: "Fan Modules", value: "16", note: null, color: "oklch(0.75 0.18 200)" },
                  { label: "Vector Segments", value: "32", note: null, color: "oklch(0.75 0.18 200)" },
                  { label: "Max Lateral", value: "0.35 g", note: null, color: "oklch(0.75 0.18 200)" },
                ].map(({ label, value, note, color }) => (
                  <div key={label} className="rounded-sm px-3 py-2" style={{ background: "oklch(0.14 0.020 240 / 0.8)", border: `1px solid ${color === "oklch(0.65 0.22 25)" ? "oklch(0.65 0.22 25 / 0.40)" : "oklch(0.25 0.015 240)"}` }}>
                    <div className="label-caps">{label}</div>
                    <div className="data-value text-sm" style={{ color }}>{value}</div>
                    {note && <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "oklch(0.45 0.015 240)", marginTop: 2 }}>{note}</div>}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Animated saucer in corner */}
          <div className="absolute top-8 right-8 z-10 hidden lg:block">
            <SaucerCanvas />
          </div>
        </section>

        {/* ── PROPULSION ARCHITECTURES ── */}
        <section
          id="propulsion"
          ref={el => { sectionRefs.current["propulsion"] = el; }}
          className="px-8 py-16 max-w-6xl"
        >
          <SectionHeader label="Section 01 · Propulsion" title="Three Architecture Tiers" accent="cyan" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <PropulsionArchCard
              tier="Current Tech"
              title="Distributed Ducted Fans + Active Control"
              color="oklch(0.65 0.18 145)"
              items={[
                "16 high-power fans/impellers around the rim",
                "360° annular exhaust slit — no obvious jet",
                "Control loop opposes gravity and disturbances",
                "Downwash diffusers hide the thrust signature",
                "Effective lateral accel: 0.15–0.35 g",
              ]}
            />
            <PropulsionArchCard
              tier="Emerging"
              title="Active Metamaterial Inertia Inversion"
              color="oklch(0.75 0.18 200)"
              items={[
                "Fast sensing + actuation: phase-inverted response",
                "Effective negative mass over a frequency band",
                "Stable if carefully designed, unstable if not",
                "Combines control theory with structural dynamics",
                "Requires sub-millisecond actuation bandwidth",
              ]}
            />
            <PropulsionArchCard
              tier="Speculative"
              title="Field-Shaped Potential Wells"
              color="oklch(0.72 0.16 80)"
              items={[
                "Design spatial potential so force looks repulsive",
                "Already used in ion traps and optical tweezers",
                "Casimir-effect negative energy: real but tiny",
                "Quantum inequalities limit exploitable magnitude",
                "Not scalable to saucer mass with known physics",
              ]}
            />
          </div>

          {/* Side profile image */}
          <div className="rounded-sm overflow-hidden" style={{ border: "1px solid oklch(0.22 0.015 240)" }}>
            <img src={SIDE_IMG} alt="Flying Saucer Side Profile" className="w-full object-cover" style={{ maxHeight: 320 }} />
            <div className="px-4 py-2 flex items-center justify-between" style={{ background: "oklch(0.13 0.022 240)" }}>
              <span className="label-caps">Fig. 1 — Side Profile Technical Illustration · Project Aurora</span>
              <span className="classified-stamp">CLASSIFIED</span>
            </div>
          </div>
        </section>

        {/* ── FAN LAYOUT ── */}
        <section
          id="fan-layout"
          ref={el => { sectionRefs.current["fan-layout"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 02 · Propulsion Hardware" title="16-Fan Ring Layout & Power Zones" accent="cyan" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            The baseline configuration uses 16 distributed fan modules arranged in a circular ring, fed through a central plenum chamber and exhausted through a 360° annular slit. Four power zones (A–D) each supply four fans, enabling zone-level fault tolerance and asymmetric thrust for vectoring. Click zones to toggle them.
          </p>
          <FanLayout />
        </section>

        {/* ── CONTROL STACK ── */}
        <section
          id="control-stack"
          ref={el => { sectionRefs.current["control-stack"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 03 · Control Architecture" title="Four-Layer Repulsion Controller" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            The control stack runs four nested loops at different frequencies. The outer loop generates the UFO-style repulsion behavior; the inner loop provides raw stabilization. The safety layer is always-on and cannot be overridden. Click each layer to expand its specification.
          </p>
          <ControlStack />
        </section>

        {/* ── MOTION PRIMITIVES ── */}
        <section
          id="motion"
          ref={el => { sectionRefs.current["motion"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 04 · Flight Behaviour" title="UFO Motion Primitives" accent="cyan" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Four motion primitives define the UFO aesthetic. Each primitive has specific control authority requirements and a distinct audience perception signature. Select a primitive to see its animated demonstration and design requirements.
          </p>
          <MotionPrimitives />
        </section>

        {/* ── PERFORMANCE CALCULATOR ── */}
        <section
          id="performance"
          ref={el => { sectionRefs.current["performance"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 05 · Performance Envelope" title="Live Repulsion Calculator" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Adjust craft mass, thrust vector angle, and initial speed to compute the real-time performance envelope. The calculator uses the exact equations from Step 6 of the design: lateral force, lateral acceleration in g, required thrust overhead, and snap-stop kinematics.
          </p>
          <PerformanceCalculator />

          {/* Performance preset table */}
          <div className="mt-8 bg-navy-surface panel-border rounded-sm p-5">
            <div className="label-caps mb-4" style={{ color: "oklch(0.75 0.18 200)" }}>UFO-Safe Performance Preset (Best on Camera)</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid oklch(0.22 0.015 240)" }}>
                    {["Parameter", "Value", "Notes"].map(h => (
                      <th key={h} className="label-caps text-left py-2 pr-6">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Tilt limit", "Very low (level-first)", "Sustained tilt > 10° breaks the illusion"],
                    ["Lateral accel", "0.15 g sustained", "Smooth, uncanny glide"],
                    ["Burst lateral", "0.30 g for 2–3 s", "Snap moves and stops"],
                    ["Snap-stop decel", "0.25–0.35 g", "Jerk-limited onset/offset"],
                    ["Jerk limit", "High (smooth)", "Onset/offset feels field-driven"],
                    ["Obstacle repulsion", "Moderate baseline", "Spike only during repelled sequence"],
                  ].map(([p, v, n]) => (
                    <tr key={p} style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}>
                      <td className="label-caps py-2 pr-6">{p}</td>
                      <td className="data-value py-2 pr-6" style={{ color: "oklch(0.75 0.18 200)" }}>{v}</td>
                      <td className="py-2" style={{ color: "oklch(0.55 0.008 240)", fontFamily: "'Inter'" }}>{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── STORYBOARD ── */}
        <section
          id="storyboard"
          ref={el => { sectionRefs.current["storyboard"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 06 · Demo Production" title="8-Shot Demo Storyboard" accent="cyan" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            A 45–60 second demo sequence designed to maximize the repulsion illusion on camera. Each shot is engineered to sell a specific aspect of the UFO aesthetic while hiding propulsion tells. Select a shot number to view its full specification.
          </p>
          <Storyboard />

          {/* Propulsion diagram */}
          <div className="mt-8 rounded-sm overflow-hidden" style={{ border: "1px solid oklch(0.22 0.015 240)" }}>
            <img src={UNDERSIDE_IMG} alt="Propulsion System Diagram" className="w-full object-cover" style={{ maxHeight: 400 }} />
            <div className="px-4 py-2 flex items-center justify-between" style={{ background: "oklch(0.13 0.022 240)" }}>
              <span className="label-caps">Fig. 2 — Propulsion System Cutaway · 16-Fan Annular Array</span>
              <span className="classified-stamp">TOP SECRET</span>
            </div>
          </div>
        </section>

        {/* ── PHYSICS BASIS ── */}
        <section
          id="physics"
          ref={el => { sectionRefs.current["physics"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 07 · Scientific Basis" title="Physics of the Repulsion Illusion" accent="amber" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                title: "Negative Effective Mass (Real Labs)",
                color: "oklch(0.65 0.18 145)",
                content: "In spin-orbit coupled Bose-Einstein condensates, the curvature of the dispersion relation can be tuned to make the effective inertial mass negative — leading to counterintuitive acceleration. This is real, repeatable physics, but the atoms retain normal gravitational mass. The craft mimics this at the systems level: the control loop makes the craft accelerate opposite to expected disturbances.",
              },
              {
                title: "Acoustic Metamaterials",
                color: "oklch(0.75 0.18 200)",
                content: "Acoustic metamaterials exhibit negative effective mass density over certain frequency bands due to internal resonances. This affects wave propagation, not gravitational attraction. The annular plenum design borrows this principle: distributed resonant chambers smooth the airflow and reduce acoustic signature, making the propulsion less identifiable as a conventional fan array.",
              },
              {
                title: "General Relativity Constraints",
                color: "oklch(0.72 0.16 80)",
                content: "In GR, the gravitational field is sourced by the full stress-energy tensor. Genuinely repulsive gravity requires violation of the Null Energy Condition — negative energy density or negative pressure. The Casimir effect produces measurable negative energy density, but quantum inequalities constrain its magnitude to values far too small for macroscopic propulsion. The craft does not attempt to engineer this.",
              },
              {
                title: "Synthetic Potential Field Control",
                color: "oklch(0.60 0.15 280)",
                content: "The repulsion controller implements a synthetic potential field: a mathematical construct where the craft behaves as if embedded in a repulsive gravitational potential. When proximity sensors detect an obstacle, the outer control loop generates a velocity command that drives the craft away — without any change to the physical gravitational field. The observer sees repulsion; the physics is pure electromechanics.",
              },
            ].map(card => (
              <div key={card.title} className="rounded-sm p-5" style={{ background: "oklch(0.14 0.020 240)", border: `1px solid ${card.color.replace(')', ' / 0.3)')}` }}>
                <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: "'Rajdhani'", color: card.color, letterSpacing: "0.06em" }}>
                  {card.title.toUpperCase()}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.68 0.008 240)", fontFamily: "'Inter'" }}>
                  {card.content}
                </p>
              </div>
            ))}
          </div>

           {/* Bottom classification bar */}
          <div className="mt-16 flex items-center justify-between py-4" style={{ borderTop: "1px solid oklch(0.18 0.015 240)" }}>
            <div className="label-caps" style={{ color: "oklch(0.30 0.012 240)" }}>
              Project Aurora · Repulsion-Illusion Flight System · Engineering Reference
            </div>
            <div className="flex gap-3">
              <span className="classified-stamp">TOP SECRET</span>
              <span className="classified-stamp" style={{ color: "oklch(0.75 0.18 200 / 0.7)", borderColor: "oklch(0.75 0.18 200 / 0.4)", transform: "rotate(1deg)" }}>
                AURORA
              </span>
            </div>
          </div>
        </section>

        {/* ── THRUST VECTORING SIMULATOR ── */}
        <section
          id="vectoring"
          ref={el => { sectionRefs.current["vectoring"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 08 · Vectoring Simulator" title="Live Thrust Vectoring Simulator" accent="cyan" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Drag the lateral joystick to command a direction and watch the 16-fan throttle ring update in real time. The right joystick controls yaw rate. The ring shows per-fan throttle as colour-coded radial bars: cyan for nominal, amber for high, red for burst. A tilt warning fires when the body angle would break the UFO illusion.
          </p>
          <ThrustVectoringSimulator />
        </section>

        {/* ── FLIGHT TIMELINE SCRUBBER ── */}
        <section
          id="timeline"
          ref={el => { sectionRefs.current["timeline"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 09 · Demo Sequence" title="Flight Timeline Scrubber" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Play through the full 48-second demo sequence automatically or scrub manually. Each of the 8 shots has a distinct motion profile — hover micro-corrections, flat glide, snap-stop deceleration, and the hero exit. Use the speed selector to preview at 0.5×, 1×, 2×, or 4× real time.
          </p>
          <FlightTimeline />
        </section>

        {/* ── BILL OF MATERIALS ── */}
        <section
          id="bom"
          ref={el => { sectionRefs.current["bom"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 10 · Engineering Budget" title="Bill of Materials" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Full costed bill of materials across six subsystems — propulsion, vectoring, power, structure, control, and sensors — with per-item mass, continuous power draw, and USD cost estimates based on 2025 component pricing. Click a chart segment to filter the table. Click any row to highlight it.
          </p>
          <BillOfMaterials />

          {/* Final classification bar */}
          <div className="mt-16 flex items-center justify-between py-4" style={{ borderTop: "1px solid oklch(0.18 0.015 240)" }}>
            <div className="label-caps" style={{ color: "oklch(0.30 0.012 240)" }}>
              Project Aurora · Repulsion-Illusion Flight System · Engineering Reference v2.0
            </div>
            <div className="flex gap-3">
              <span className="classified-stamp">TOP SECRET</span>
              <span className="classified-stamp" style={{ color: "oklch(0.75 0.18 200 / 0.7)", borderColor: "oklch(0.75 0.18 200 / 0.4)", transform: "rotate(1deg)" }}>
                AURORA
              </span>
            </div>
          </div>
        </section>

        {/* ── FAULT TOLERANCE SIMULATOR ── */}
        <section
          id="fault"
          ref={el => { sectionRefs.current["fault"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 11 · Reliability" title="Fault-Tolerance Simulator" accent="cyan" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Click any fan module to simulate a failure. The control stack instantly recalculates asymmetric compensation throttles for surviving fans and reports residual roll/pitch torque, thrust margin, and whether attitude hold remains achievable. Use the quick scenario buttons to test zone failures and catastrophic configurations.
          </p>
          <FaultToleranceSimulator />
        </section>

        {/* ── ACOUSTIC ANALYSER ── */}
        <section
          id="acoustic"
          ref={el => { sectionRefs.current["acoustic"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 12 · Acoustic Signature" title="Noise Signature Analyser" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Frequency-domain model of the annular array’s acoustic output at any throttle level. Toggle between the undamped bare-array spectrum and the plenum-damped spectrum to see how the resonant chambers and annular slit suppress the blade-pass frequency tonal and its harmonics, making the propulsion signature harder to identify.
          </p>
          <AcousticAnalyser />

          {/* Classification bar v3 */}
          <div className="mt-16 flex items-center justify-between py-4" style={{ borderTop: "1px solid oklch(0.18 0.015 240)" }}>
            <div className="label-caps" style={{ color: "oklch(0.30 0.012 240)" }}>Project Aurora · Engineering Reference v3.0</div>
            <span className="classified-stamp">TOP SECRET</span>
          </div>
        </section>

        {/* ── THERMAL MANAGEMENT ── */}
        <section
          id="thermal"
          ref={el => { sectionRefs.current["thermal"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 13 · Thermal" title="Thermal Management" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Live heat map of the 16-fan ring showing motor and ESC temperatures at any throttle level and ambient condition. The animated cooling-airflow paths illustrate the forced-air duct system. A thermal runaway warning fires when temperatures approach critical limits, linked to the BOM’s thermal camera entry.
          </p>
          <ThermalManagement />
        </section>

        {/* ── REGULATORY COMPLIANCE ── */}
        <section
          id="regulatory"
          ref={el => { sectionRefs.current["regulatory"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 14 · Certification" title="Regulatory Compliance" accent="cyan" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            A structured compliance matrix mapping each design element to the relevant FAA, EASA, and ICAO regulation, with pass/fail/conditional status and required modification notes. Filter by category or status. Click any item to expand the full analysis and required action.
          </p>
          <RegulatoryCompliance />
        </section>

        {/* ── EXPLODED VIEW ── */}
        <section
          id="exploded"
          ref={el => { sectionRefs.current["exploded"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 15 · Structure" title="Cross-Section Exploded View" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Interactive SVG exploded diagram of the six craft layers — avionics bay, vectoring ring, fan ring, main hull, battery bay, and landing gear. Toggle between exploded and collapsed views. Click any layer to highlight its BOM entries and see mass, cost, and power contribution.
          </p>
          <ExplodedView />

          {/* Classification bar v4 */}
          <div className="mt-16 flex items-center justify-between py-4" style={{ borderTop: "1px solid oklch(0.18 0.015 240)" }}>
            <div className="label-caps" style={{ color: "oklch(0.30 0.012 240)" }}>Project Aurora · Engineering Reference v4.0</div>
            <span className="classified-stamp">TOP SECRET</span>
          </div>
        </section>

        {/* ── MISSION ENERGY PLANNER ── */}
        <section
          id="energy"
          ref={el => { sectionRefs.current["energy"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 16 · Energy" title="Mission Energy Planner" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Build a custom flight profile from hover, flat-glide, burst manoeuvre, and systems-idle segments. The planner computes total energy draw against the 55 kWh battery, plots the state-of-charge curve, and reports estimated hover reserve and warnings when the profile exceeds the usable energy budget.
          </p>
          <MissionEnergyPlanner />
        </section>

        {/* ── WIND DISTURBANCE SIMULATOR ── */}
        <section
          id="wind"
          ref={el => { sectionRefs.current["wind"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 17 · Disturbance" title="Wind Disturbance Simulator" accent="cyan" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Set wind speed and direction via sliders or compass. The control stack calculates the per-fan throttle compensation required to null the wind force and maintain position hold. The fan ring diagram shows colour-coded throttle boosts and reductions, with residual drift reported when compensation is saturated.
          </p>
          <WindDisturbanceSimulator />
        </section>

        {/* ── TECHNICAL BRIEF ── */}
        <section
          id="brief"
          ref={el => { sectionRefs.current["brief"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 18 · Export" title="Technical Brief" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            A consolidated single-page technical brief covering all key specifications, BOM summary, performance envelope, control architecture, regulatory compliance status, and open risks. Use the Print button to export as a PDF or send to a printer.
          </p>
          <TechnicalBrief />

          {/* Classification bar v5 */}
          <div className="mt-16 flex items-center justify-between py-4" style={{ borderTop: "1px solid oklch(0.18 0.015 240)" }}>
            <div className="label-caps" style={{ color: "oklch(0.30 0.012 240)" }}>Project Aurora · Engineering Reference v5.0</div>
            <span className="classified-stamp">TOP SECRET</span>
          </div>
        </section>

        {/* ── SCALE CONFIGURATOR ── */}
        <section
          id="scale"
          ref={el => { sectionRefs.current["scale"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 19 · Scaling" title="Scale Configurator" accent="cyan" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Slide the diameter from 2 m (drone-scale prototype) to 12 m (full-scale craft). All specifications — mass, power, fan count, battery, endurance, agility, and cost — are recalculated live using aerospace scaling laws, with regulatory threshold markers updated automatically.
          </p>
          <ScaleConfigurator />
        </section>

        {/* ── MATERIALS COMPARISON ── */}
        <section
          id="materials"
          ref={el => { sectionRefs.current["materials"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 20 · Materials" title="Materials Comparison" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Select hull material (CFRP, Al 7075, Ti-6Al-4V, fibreglass) and battery chemistry (LiPo, LiFePO₄, solid-state, NMC). The BOM updates live with revised mass, cost, and endurance figures, and bar charts compare all four options side by side.
          </p>
          <MaterialsComparison />
        </section>

        {/* ── SENSOR FUSION DIAGRAM ── */}
        <section
          id="sensor-fusion"
          ref={el => { sectionRefs.current["sensor-fusion"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 21 · Avionics" title="Sensor Fusion Diagram" accent="cyan" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Interactive block diagram of the avionics data flow: six sensor inputs through an Extended Kalman Filter into the four control layers, terminating at the fan mixer and actuators. Click any block to highlight its connections, inspect latency, and navigate the data path.
          </p>
          <SensorFusionDiagram />

          {/* Classification bar v6 */}
          <div className="mt-16 flex items-center justify-between py-4" style={{ borderTop: "1px solid oklch(0.18 0.015 240)" }}>
            <div className="label-caps" style={{ color: "oklch(0.30 0.012 240)" }}>Project Aurora · Engineering Reference v6.0</div>
            <span className="classified-stamp">TOP SECRET</span>
          </div>
        </section>

        {/* ── PROPULSION TRADE-OFF MATRIX ── */}
        <section
          id="propulsion-tradeoff"
          ref={el => { sectionRefs.current["propulsion-tradeoff"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 22 · Trade-off" title="Propulsion Trade-off Matrix" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Scored comparison of the three propulsion tiers — ducted fans, plasma jets, and photonic pressure — across six criteria: TRL, thrust density, acoustic stealth, power efficiency, EM detectability, and cost. Adjust the weighting sliders to reflect your priority profile and watch the winner update live.
          </p>
          <PropulsionTradeoff />
        </section>

        {/* ── GROUND TEST PLANNER ── */}
        <section
          id="ground-test"
          ref={el => { sectionRefs.current["ground-test"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 23 · Testing" title="Ground Test Sequence Planner" accent="cyan" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            12 pre-flight ground tests across 5 phases: electrical, mechanical, avionics, control, and signature. Toggle each test pass/fail to update the flight readiness score. Gate logic prevents later tests from being marked until their prerequisites pass.
          </p>
          <GroundTestPlanner />
        </section>

        {/* ── TELEMETRY HUD ── */}
        <section
          id="telemetry"
          ref={el => { sectionRefs.current["telemetry"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 24 · Ground Station" title="Live Telemetry HUD" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Simulated real-time ground station display. Press START to begin the telemetry simulation: arc gauges for altitude, speed, power, and battery; an attitude indicator; a 16-fan RPM ring; system status panel; and a scrolling telemetry log with mode changes and warnings.
          </p>
          <TelemetryHUD />

          {/* Classification bar v7 */}
          <div className="mt-16 flex items-center justify-between py-4" style={{ borderTop: "1px solid oklch(0.18 0.015 240)" }}>
            <div className="label-caps" style={{ color: "oklch(0.30 0.012 240)" }}>Project Aurora · Repulsion-Illusion Flight System · Engineering Reference v7.0</div>
            <span className="classified-stamp">TOP SECRET</span>
          </div>
        </section>

        {/* ── VIBRATION SIGNATURE ANALYSER ── */}
        <section
          id="vibration"
          ref={el => { sectionRefs.current["vibration"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 25 · Structural" title="Vibration Signature Analyser" accent="cyan" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            Structural vibration spectrum from 10–2000 Hz at four throttle levels. Toggle throttle curves to compare. Dashed vertical lines mark blade-pass frequency harmonics and structural resonance modes. Click any mode in the modal table to see its excitation condition and mitigation strategy.
          </p>
          <VibrationAnalyser />
        </section>

        {/* ── BUILD ROADMAP ── */}
        <section
          id="roadmap"
          ref={el => { sectionRefs.current["roadmap"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 26 · Programme" title="Prototype Build Roadmap" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            68-week development programme across 6 phases: Concept, PDR, CDR, Manufacturing, System Integration, and Flight Test. Click any phase bar or card to expand its deliverables, milestones, and dependencies. The vertical line marks the current programme week.
          </p>
          <BuildRoadmap />

          {/* Classification bar v8 */}
          <div className="mt-16 flex items-center justify-between py-4" style={{ borderTop: "1px solid oklch(0.18 0.015 240)" }}>
            <div className="label-caps" style={{ color: "oklch(0.30 0.012 240)" }}>Project Aurora · Repulsion-Illusion Flight System · Engineering Reference v8.0</div>
            <span className="classified-stamp">TOP SECRET</span>
          </div>
        </section>

        {/* ── R&D SPECULATION ── */}
        <section
          id="rnd-speculation"
          ref={el => { sectionRefs.current["rnd-speculation"] = el; }}
          className="px-8 py-16 max-w-6xl"
          style={{ borderTop: "1px solid oklch(0.16 0.015 240)" }}
        >
          <SectionHeader label="Section 28 · R&D" title="True Negative-Mass Physics — Speculation" accent="amber" />
          <p className="text-sm leading-relaxed mb-8" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'", maxWidth: 640 }}>
            This section is a scientific literature review of approaches that could, in principle, produce genuine negative-mass or gravitational-repulsion effects. It is <strong style={{ color: "oklch(0.72 0.16 80)" }}>entirely separate</strong> from the engineering implementation above. TRL levels range from 0 (concept only) to 4 (lab validation). None are ready for vehicle integration.
          </p>
          <RnDSpeculation />

          {/* Final classification bar v9 */}
          <div className="mt-16 flex items-center justify-between py-4" style={{ borderTop: "1px solid oklch(0.18 0.015 240)" }}>
            <div className="label-caps" style={{ color: "oklch(0.30 0.012 240)" }}>
              Project Aurora · Repulsion-Illusion Flight System · Engineering Reference v9.0
            </div>
            <div className="flex gap-3">
              <span className="classified-stamp">TOP SECRET</span>
              <span className="classified-stamp" style={{ color: "oklch(0.75 0.18 200 / 0.7)", borderColor: "oklch(0.75 0.18 200 / 0.4)", transform: "rotate(1deg)" }}>AURORA</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
