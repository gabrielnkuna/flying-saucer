/* =============================================================
   COMPONENT: ShareModal
   Design: Classified Aerospace Dossier
   Generates a shareable URL encoding current section + pitch mode.
   ============================================================= */
import { useState, useEffect } from "react";

interface Props {
  currentSection: string;
  pitchMode: boolean;
  onClose: () => void;
}

const SECTION_LABELS: Record<string, string> = {
  overview: "Overview", propulsion: "Propulsion", "fan-layout": "Fan Layout",
  "control-stack": "Control Stack", motion: "Motion Primitives", performance: "Performance Calc",
  storyboard: "Demo Storyboard", physics: "Physics Basis", vectoring: "Vectoring Sim",
  timeline: "Flight Timeline", bom: "Bill of Materials", fault: "Fault Tolerance",
  acoustic: "Acoustic Analyser", thermal: "Thermal Mgmt", regulatory: "Regulatory",
  exploded: "Exploded View", energy: "Energy Planner", wind: "Wind Sim",
  brief: "Technical Brief", scale: "Scale Config", materials: "Materials",
  "sensor-fusion": "Sensor Fusion", "propulsion-tradeoff": "Propulsion Matrix",
  "ground-test": "Ground Tests", telemetry: "Telemetry HUD", vibration: "Vibration",
  roadmap: "Build Roadmap", "rnd-speculation": "R&D Speculation",
};

export default function ShareModal({ currentSection, pitchMode, onClose }: Props) {
  const [selectedSection, setSelectedSection] = useState(currentSection);
  const [includePitch, setIncludePitch] = useState(pitchMode);
  const [copied, setCopied] = useState(false);

  const buildUrl = () => {
    const base = window.location.origin + window.location.pathname;
    const hash = `#s=${selectedSection}${includePitch ? "&pitch=1" : ""}`;
    return base + hash;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // fallback: select input
      const el = document.getElementById("share-url-input") as HTMLInputElement;
      el?.select();
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const QUICK_LINKS = [
    { label: "Full Dashboard", section: "overview", pitch: false },
    { label: "Investor Pitch", section: "overview", pitch: true },
    { label: "Technical Brief", section: "brief", pitch: false },
    { label: "Physics Basis", section: "physics", pitch: false },
    { label: "R&D Speculation", section: "rnd-speculation", pitch: false },
    { label: "Telemetry HUD", section: "telemetry", pitch: false },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "oklch(0 0 0 / 0.70)" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="rounded-sm flex flex-col"
        style={{
          width: "min(560px, 95vw)",
          background: "oklch(0.12 0.022 240)",
          border: "1px solid oklch(0.25 0.015 240)",
          boxShadow: "0 24px 64px oklch(0 0 0 / 0.60)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid oklch(0.20 0.015 240)" }}>
          <div>
            <div className="label-caps mb-0.5" style={{ color: "oklch(0.75 0.18 200)" }}>PROJECT AURORA</div>
            <div style={{ fontFamily: "'Rajdhani'", fontSize: 17, fontWeight: 700, color: "oklch(0.90 0.005 240)", letterSpacing: "0.06em" }}>
              SHARE THIS VIEW
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-sm"
            style={{ color: "oklch(0.45 0.015 240)", border: "1px solid oklch(0.22 0.015 240)" }}>✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Quick links */}
          <div>
            <div className="label-caps mb-2" style={{ fontSize: 9, color: "oklch(0.45 0.015 240)" }}>QUICK LINKS</div>
            <div className="grid grid-cols-3 gap-2">
              {QUICK_LINKS.map(ql => (
                <button
                  key={ql.label}
                  onClick={() => { setSelectedSection(ql.section); setIncludePitch(ql.pitch); }}
                  className="px-2 py-1.5 rounded-sm text-left transition-all"
                  style={{
                    background: selectedSection === ql.section && includePitch === ql.pitch
                      ? "oklch(0.75 0.18 200 / 0.12)"
                      : "oklch(0.14 0.018 240)",
                    border: `1px solid ${selectedSection === ql.section && includePitch === ql.pitch
                      ? "oklch(0.75 0.18 200 / 0.45)"
                      : "oklch(0.22 0.015 240)"}`,
                  }}
                >
                  <div className="label-caps" style={{ fontSize: 8, color: "oklch(0.75 0.18 200)" }}>{ql.label}</div>
                  {ql.pitch && (
                    <div className="label-caps mt-0.5" style={{ fontSize: 7, color: "oklch(0.72 0.16 80 / 0.70)" }}>PITCH MODE</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom section picker */}
          <div>
            <div className="label-caps mb-2" style={{ fontSize: 9, color: "oklch(0.45 0.015 240)" }}>CUSTOM — SELECT SECTION</div>
            <select
              value={selectedSection}
              onChange={e => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 rounded-sm outline-none"
              style={{
                background: "oklch(0.14 0.018 240)",
                border: "1px solid oklch(0.25 0.015 240)",
                color: "oklch(0.75 0.005 240)",
                fontFamily: "'JetBrains Mono'",
                fontSize: 11,
              }}
            >
              {Object.entries(SECTION_LABELS).map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </div>

          {/* Pitch mode toggle */}
          <div className="flex items-center justify-between px-3 py-2 rounded-sm"
            style={{ background: "oklch(0.14 0.018 240)", border: "1px solid oklch(0.22 0.015 240)" }}>
            <div>
              <div className="label-caps" style={{ fontSize: 9, color: "oklch(0.65 0.010 240)" }}>INCLUDE PITCH MODE</div>
              <div className="text-xs mt-0.5" style={{ color: "oklch(0.42 0.010 240)", fontFamily: "'Inter'" }}>
                Recipient will see only the 6 investor-facing sections
              </div>
            </div>
            <button
              onClick={() => setIncludePitch(v => !v)}
              className="w-10 h-5 rounded-full transition-all relative"
              style={{ background: includePitch ? "oklch(0.72 0.16 80 / 0.60)" : "oklch(0.22 0.015 240)" }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                style={{
                  left: includePitch ? "calc(100% - 18px)" : "2px",
                  background: includePitch ? "oklch(0.72 0.16 80)" : "oklch(0.40 0.015 240)",
                }}
              />
            </button>
          </div>

          {/* URL output */}
          <div>
            <div className="label-caps mb-2" style={{ fontSize: 9, color: "oklch(0.45 0.015 240)" }}>SHAREABLE URL</div>
            <div className="flex gap-2">
              <input
                id="share-url-input"
                readOnly
                value={buildUrl()}
                className="flex-1 px-3 py-2 rounded-sm outline-none"
                style={{
                  background: "oklch(0.10 0.020 240)",
                  border: "1px solid oklch(0.22 0.015 240)",
                  color: "oklch(0.60 0.008 240)",
                  fontFamily: "'JetBrains Mono'",
                  fontSize: 10,
                }}
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2 rounded-sm transition-all label-caps"
                style={{
                  fontSize: 9,
                  background: copied ? "oklch(0.65 0.18 145 / 0.15)" : "oklch(0.75 0.18 200 / 0.12)",
                  color: copied ? "oklch(0.65 0.18 145)" : "oklch(0.75 0.18 200)",
                  border: `1px solid ${copied ? "oklch(0.65 0.18 145 / 0.40)" : "oklch(0.75 0.18 200 / 0.35)"}`,
                  minWidth: 72,
                }}
              >
                {copied ? "✓ COPIED" : "COPY"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 flex items-center justify-between" style={{ borderTop: "1px solid oklch(0.18 0.015 240)" }}>
          <span className="label-caps" style={{ fontSize: 8, color: "oklch(0.30 0.012 240)" }}>
            Link encodes section + mode into URL hash — no server required
          </span>
          <button onClick={onClose} className="label-caps px-4 py-1.5 rounded-sm"
            style={{ fontSize: 10, background: "oklch(0.75 0.18 200 / 0.10)", color: "oklch(0.75 0.18 200)", border: "1px solid oklch(0.75 0.18 200 / 0.35)" }}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
