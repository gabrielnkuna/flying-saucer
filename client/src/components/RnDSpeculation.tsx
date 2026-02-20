/* =============================================================
   COMPONENT: RnDSpeculation
   Design: Classified Aerospace Dossier
   Dedicated R&D / Speculation section for true negative-mass
   physics — clearly separated from the engineering implementation.
   Covers: negative effective mass (real labs), exotic matter,
   GR implications, BEC experiments, metamaterial analogues,
   and a TRL ladder for each approach.
   ============================================================= */
import { useState } from "react";

interface Approach {
  id: string;
  name: string;
  trl: number;
  status: "DEMONSTRATED" | "THEORETICAL" | "SPECULATIVE" | "MATHEMATICAL";
  tagline: string;
  physics: string;
  evidence: string;
  gap: string;
  refs: string[];
  color: string;
}

const APPROACHES: Approach[] = [
  {
    id: "bec",
    name: "Negative Effective Mass in BECs",
    trl: 4,
    status: "DEMONSTRATED",
    tagline: "Real lab result — acceleration opposes applied force",
    physics: "In spin-orbit coupled Bose-Einstein condensates, the dispersion relation E(k) develops a negative curvature, giving an effective mass m* < 0. When an external force is applied, the condensate accelerates in the opposite direction. Demonstrated at Washington State University (2017) and reproduced in multiple cold-atom labs.",
    evidence: "Khamehchi et al., Physical Review Letters 118, 155301 (2017). Negative effective mass measured directly from momentum-space dynamics of a 87Rb BEC with Raman-induced spin-orbit coupling.",
    gap: "Operates at ~100 nK, requires ultra-high vacuum and laser cooling infrastructure. The 'negative mass' is a band-structure effect — gravitational mass is unchanged. No path to macroscopic or room-temperature operation is currently known.",
    refs: ["Khamehchi et al., PRL 118 (2017)", "Li et al., Nature 543 (2017)", "Leblanc et al., NJP 20 (2018)"],
    color: "oklch(0.65 0.18 145)",
  },
  {
    id: "metamaterial",
    name: "Acoustic / Mechanical Metamaterial Analogues",
    trl: 3,
    status: "DEMONSTRATED",
    tagline: "Engineered effective negative mass density in structured media",
    physics: "Locally resonant acoustic metamaterials (Liu et al., Science 2000) exhibit negative effective mass density near resonance frequencies. A mass-in-mass unit cell driven near its internal resonance frequency produces out-of-phase response, mimicking m_eff < 0 for acoustic waves. Analogous effects exist in mechanical and electromagnetic metamaterials.",
    evidence: "Liu et al., Science 289 (2000) — first demonstration of locally resonant phononic crystals. Huang et al., J. Appl. Phys. 105 (2009) — negative mass density in mass-in-mass lattices. Extensive literature on double-negative acoustic media.",
    gap: "Effect is frequency-specific, narrow-band, and applies only to wave propagation — not to the gravitational or inertial mass of the bulk object. No mechanism to extend to broadband or DC (static) force response.",
    refs: ["Liu et al., Science 289 (2000)", "Huang et al., JAP 105 (2009)", "Fang et al., Nature Materials 5 (2006)"],
    color: "oklch(0.75 0.18 200)",
  },
  {
    id: "active-inertia",
    name: "Active Inertia Inversion (Control-Based)",
    trl: 2,
    status: "THEORETICAL",
    tagline: "Feedback control that makes a system behave as if m < 0",
    physics: "By measuring applied force F and commanding an actuator to produce acceleration a = −F/m (opposite to Newton's 2nd law), a closed-loop system can exhibit apparent negative inertia within the control bandwidth. Proposed for vibration isolation, haptics, and spacecraft attitude control. The 'negative mass' is a control illusion — actual mass is unchanged.",
    evidence: "Proposed in robotics and haptics literature. Colgate & Hogan (1988) on Z-width in haptic displays. Mehling et al. on negative apparent inertia in force-controlled robots. No large-scale or gravitational demonstration.",
    gap: "Requires actuator bandwidth >> disturbance bandwidth. Stability is challenging — active negative inertia systems are conditionally stable and can exhibit limit cycles. Power cost scales with the magnitude of the simulated negative mass.",
    refs: ["Colgate & Hogan, ASME J. Dyn. Sys. (1988)", "Mehling et al., IEEE ICRA (2005)", "Eppinger & Seering, IEEE Trans. Rob. (1987)"],
    color: "oklch(0.72 0.16 80)",
  },
  {
    id: "exotic-matter",
    name: "Exotic Matter with Negative Energy Density",
    trl: 0,
    status: "THEORETICAL",
    tagline: "Required by Alcubierre warp metric and traversable wormholes",
    physics: "General Relativity permits stress-energy tensors with negative energy density (violating the Null Energy Condition). The Alcubierre metric (1994) and Morris-Thorne wormholes (1988) require exotic matter with ρ < 0. Casimir effect demonstrates that negative energy density is not forbidden in principle (vacuum fluctuations between plates produce negative energy density region).",
    evidence: "Casimir effect: Lamoreaux (1997), Mohideen & Roy (1998). Theoretical: Alcubierre, Class. Quantum Grav. 11 (1994); Morris & Thorne, Am. J. Phys. 56 (1988). No macroscopic exotic matter has been produced or isolated.",
    gap: "Casimir energy densities are ~10⁻³ J/m³ — 50 orders of magnitude below what Alcubierre metrics require. Ford-Roman quantum inequalities severely constrain how much negative energy can be concentrated. No known mechanism to produce macroscopic exotic matter.",
    refs: ["Alcubierre, CQG 11 (1994)", "Morris & Thorne, AJP 56 (1988)", "Ford & Roman, PRD 55 (1997)", "Lamoreaux, PRL 78 (1997)"],
    color: "oklch(0.60 0.15 280)",
  },
  {
    id: "gravitational-repulsion",
    name: "True Gravitational Repulsion (Negative Gravitational Mass)",
    trl: 0,
    status: "SPECULATIVE",
    tagline: "Would require matter with m_grav < 0 — not observed in nature",
    physics: "In Newtonian gravity and GR, all observed matter has positive gravitational mass. A hypothetical particle with m_grav < 0 would be gravitationally repelled by ordinary matter (Bondi, 1957). Such matter would violate the Weak Equivalence Principle and the energy conditions of GR. Some speculative extensions of the Standard Model (mirror matter, certain dark energy models) permit negative gravitational mass.",
    evidence: "No experimental evidence. The ALPHA experiment at CERN (2013) constrained antimatter gravitational mass to be positive within 65×m_e. ALPHA-g (2023) confirmed antihydrogen falls downward under gravity — ruling out gravitational repulsion for antimatter.",
    gap: "No known particle or field with negative gravitational mass. ALPHA-g result eliminates antimatter as a candidate. Any macroscopic negative gravitational mass would produce runaway acceleration (Bondi's 'runaway motion') unless paired with positive mass in a specific configuration.",
    refs: ["Bondi, Rev. Mod. Phys. 29 (1957)", "ALPHA Collaboration, Nature Comm. 4 (2013)", "ALPHA-g, Nature 621 (2023)", "Hajdukovic, Astrophys. Space Sci. 334 (2011)"],
    color: "oklch(0.65 0.22 25)",
  },
  {
    id: "analog-gravity",
    name: "Analogue Gravity Systems",
    trl: 3,
    status: "DEMONSTRATED",
    tagline: "Acoustic/optical systems that mimic curved-spacetime physics",
    physics: "Unruh (1981) showed that sound waves in a flowing fluid obey equations formally identical to a scalar field in curved spacetime. Acoustic black holes ('dumb holes'), Hawking radiation analogues, and ergoregion superradiance have been demonstrated in BECs, water tanks, and optical fibres. These are not gravitational systems — they are classical or quantum systems whose equations of motion are mathematically isomorphic to GR.",
    evidence: "Steinhauer (2016) — observation of thermal Hawking radiation in a BEC analogue black hole. Weinfurtner et al. (2011) — stimulated Hawking radiation in a water-wave analogue. Torres et al. (2017) — rotational superradiance in a water vortex.",
    gap: "Analogue gravity systems do not produce actual spacetime curvature or gravitational effects. They are useful for testing GR predictions in accessible lab settings but cannot be scaled to produce real gravitational repulsion.",
    refs: ["Unruh, PRL 46 (1981)", "Steinhauer, Nature Physics 12 (2016)", "Weinfurtner et al., PRL 106 (2011)", "Torres et al., Nature Physics 13 (2017)"],
    color: "oklch(0.62 0.20 200)",
  },
];

const TRL_LABELS: Record<number, string> = {
  0: "TRL 0 — Concept only",
  1: "TRL 1 — Basic principles observed",
  2: "TRL 2 — Technology concept formulated",
  3: "TRL 3 — Experimental proof of concept",
  4: "TRL 4 — Lab validation",
  5: "TRL 5 — Relevant environment validation",
  6: "TRL 6 — Prototype demonstration",
  7: "TRL 7 — System prototype",
  8: "TRL 8 — System complete",
  9: "TRL 9 — Operational",
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  DEMONSTRATED: { bg: "oklch(0.65 0.18 145 / 0.12)", text: "oklch(0.65 0.18 145)" },
  THEORETICAL: { bg: "oklch(0.75 0.18 200 / 0.12)", text: "oklch(0.75 0.18 200)" },
  SPECULATIVE: { bg: "oklch(0.65 0.22 25 / 0.12)", text: "oklch(0.65 0.22 25)" },
  MATHEMATICAL: { bg: "oklch(0.60 0.15 280 / 0.12)", text: "oklch(0.60 0.15 280)" },
};

function TrlBar({ trl, color }: { trl: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{
            width: 14, height: 6, borderRadius: 1,
            background: i < trl ? color : "oklch(0.20 0.015 240)",
            opacity: i < trl ? 1 : 0.4,
          }} />
        ))}
      </div>
      <span className="label-caps" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>TRL {trl}</span>
    </div>
  );
}

export default function RnDSpeculation() {
  const [selected, setSelected] = useState<string>("bec");
  const selectedApproach = APPROACHES.find(a => a.id === selected)!;

  return (
    <div className="space-y-6">
      {/* Disclaimer banner */}
      <div className="rounded-sm px-5 py-4" style={{ background: "oklch(0.65 0.22 25 / 0.08)", border: "1px solid oklch(0.65 0.22 25 / 0.35)" }}>
        <div className="flex items-start gap-3">
          <span style={{ fontSize: 16, color: "oklch(0.65 0.22 25)", flexShrink: 0, marginTop: 1 }}>⚠</span>
          <div>
            <div className="label-caps mb-1" style={{ color: "oklch(0.65 0.22 25)" }}>R&D Speculation — Not Part of the Engineering Implementation</div>
            <p className="text-sm leading-relaxed" style={{ color: "oklch(0.60 0.008 240)", fontFamily: "'Inter'" }}>
              The sections above describe the <strong style={{ color: "oklch(0.75 0.18 200)" }}>engineering implementation</strong> of Project Aurora: a real craft using ducted fans, vectoring vanes, and a control system to produce a convincing repulsion-illusion. This section is a separate <strong style={{ color: "oklch(0.72 0.16 80)" }}>scientific literature review</strong> of approaches that could, in principle, produce genuine negative-mass or gravitational-repulsion effects. Current TRL levels range from 0 to 4. None are ready for engineering integration.
            </p>
          </div>
        </div>
      </div>

      {/* Approach selector */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {APPROACHES.map(a => {
          const isSelected = selected === a.id;
          const badge = STATUS_BADGE[a.status];
          return (
            <button key={a.id} onClick={() => setSelected(a.id)}
              className="rounded-sm p-4 text-left transition-all"
              style={{
                background: isSelected ? `${a.color.replace(")", " / 0.10)")}` : "oklch(0.12 0.018 240)",
                border: `1px solid ${isSelected ? a.color.replace(")", " / 0.45)") : "oklch(0.20 0.015 240)"}`,
              }}>
              <div className="flex items-center justify-between mb-2">
                <span className="label-caps px-1.5 py-0.5 rounded-sm" style={{ fontSize: 8, background: badge.bg, color: badge.text, border: `1px solid ${badge.text.replace(")", " / 0.30)")}` }}>
                  {a.status}
                </span>
              </div>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 13, fontWeight: 700, color: isSelected ? a.color : "oklch(0.60 0.005 240)", lineHeight: 1.3, marginBottom: 6 }}>{a.name}</div>
              <TrlBar trl={a.trl} color={a.color} />
            </button>
          );
        })}
      </div>

      {/* Detail panel */}
      {selectedApproach && (
        <div className="rounded-sm p-6 space-y-5" style={{
          background: `${selectedApproach.color.replace(")", " / 0.06)")}`,
          border: `1px solid ${selectedApproach.color.replace(")", " / 0.35)")}`,
        }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="label-caps px-2 py-0.5 rounded-sm" style={{
                  fontSize: 9,
                  background: STATUS_BADGE[selectedApproach.status].bg,
                  color: STATUS_BADGE[selectedApproach.status].text,
                  border: `1px solid ${STATUS_BADGE[selectedApproach.status].text.replace(")", " / 0.30)")}`,
                }}>{selectedApproach.status}</span>
              </div>
              <div style={{ fontFamily: "'Rajdhani'", fontSize: 22, fontWeight: 700, color: selectedApproach.color, lineHeight: 1.2 }}>{selectedApproach.name}</div>
              <div className="mt-1 text-sm italic" style={{ color: "oklch(0.55 0.010 240)", fontFamily: "'Inter'" }}>{selectedApproach.tagline}</div>
            </div>
            <div className="shrink-0 text-right">
              <div className="label-caps mb-1" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>{TRL_LABELS[selectedApproach.trl]}</div>
              <TrlBar trl={selectedApproach.trl} color={selectedApproach.color} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-sm p-4" style={{ background: "oklch(0.11 0.018 240)", border: "1px solid oklch(0.18 0.015 240)" }}>
              <div className="label-caps mb-2" style={{ fontSize: 9, color: "oklch(0.75 0.18 200)" }}>Physics Basis</div>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.62 0.008 240)", fontFamily: "'Inter'" }}>{selectedApproach.physics}</p>
            </div>
            <div className="rounded-sm p-4" style={{ background: "oklch(0.11 0.018 240)", border: "1px solid oklch(0.18 0.015 240)" }}>
              <div className="label-caps mb-2" style={{ fontSize: 9, color: "oklch(0.65 0.18 145)" }}>Experimental Evidence</div>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.62 0.008 240)", fontFamily: "'Inter'" }}>{selectedApproach.evidence}</p>
            </div>
            <div className="rounded-sm p-4" style={{ background: "oklch(0.11 0.018 240)", border: "1px solid oklch(0.18 0.015 240)" }}>
              <div className="label-caps mb-2" style={{ fontSize: 9, color: "oklch(0.65 0.22 25)" }}>Engineering Gap</div>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.62 0.008 240)", fontFamily: "'Inter'" }}>{selectedApproach.gap}</p>
            </div>
          </div>

          <div>
            <div className="label-caps mb-2" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>Key References</div>
            <div className="flex flex-wrap gap-2">
              {selectedApproach.refs.map(ref => (
                <span key={ref} className="label-caps px-2 py-1 rounded-sm" style={{
                  fontSize: 8,
                  background: "oklch(0.14 0.018 240)",
                  color: "oklch(0.50 0.015 240)",
                  border: "1px solid oklch(0.22 0.015 240)",
                }}>{ref}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TRL comparison chart */}
      <div className="bg-navy-surface panel-border rounded-sm p-5">
        <div className="label-caps mb-4">TRL Comparison — All Approaches</div>
        <div className="space-y-3">
          {APPROACHES.map(a => (
            <div key={a.id} className="flex items-center gap-4 cursor-pointer" onClick={() => setSelected(a.id)}>
              <div style={{ width: 200, flexShrink: 0 }}>
                <div style={{ fontFamily: "'Rajdhani'", fontSize: 11, fontWeight: 600, color: selected === a.id ? a.color : "oklch(0.50 0.010 240)", lineHeight: 1.2 }}>{a.name}</div>
              </div>
              <div className="flex-1">
                <div className="flex gap-0.5">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} style={{
                      flex: 1, height: 8, borderRadius: 1,
                      background: i < a.trl ? a.color : "oklch(0.18 0.015 240)",
                    }} />
                  ))}
                </div>
              </div>
              <div className="label-caps shrink-0" style={{ fontSize: 9, color: a.color, width: 40, textAlign: "right" }}>TRL {a.trl}</div>
              <span className="label-caps px-1.5 py-0.5 rounded-sm shrink-0" style={{
                fontSize: 7,
                background: STATUS_BADGE[a.status].bg,
                color: STATUS_BADGE[a.status].text,
                border: `1px solid ${STATUS_BADGE[a.status].text.replace(")", " / 0.25)")}`,
                width: 90, textAlign: "center",
              }}>{a.status}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 text-xs leading-relaxed" style={{ borderTop: "1px solid oklch(0.18 0.015 240)", color: "oklch(0.38 0.010 240)", fontFamily: "'Inter'" }}>
          <strong style={{ color: "oklch(0.50 0.015 240)" }}>Note:</strong> TRL ratings above are engineering assessments for the specific application of producing macroscopic gravitational or inertial repulsion in a vehicle-scale system. The underlying physics (e.g., BEC experiments, Casimir effect) may be at higher TRL for other applications.
        </div>
      </div>
    </div>
  );
}
