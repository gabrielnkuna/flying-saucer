/* =============================================================
   COMPONENT: RegulatoryCompliance
   Design: Classified Aerospace Dossier
   FAA/EASA compliance checklist mapping design elements
   to regulations with pass/fail status and modification notes
   ============================================================= */
import { useState } from "react";

type Status = "pass" | "fail" | "conditional" | "na" | "pending";

interface ComplianceItem {
  id: string;
  category: string;
  regulation: string;
  authority: "FAA" | "EASA" | "BOTH" | "ICAO";
  element: string;
  status: Status;
  detail: string;
  modification?: string;
}

const ITEMS: ComplianceItem[] = [
  // ── Weight & Category ──
  {
    id: "W1", category: "Weight & Category", regulation: "14 CFR Part 107 (sUAS)", authority: "FAA",
    element: "Craft mass 800 kg", status: "fail",
    detail: "Part 107 applies to UAS under 25 kg (55 lb). At 800 kg this craft is a full-scale aircraft, not a small UAS.",
    modification: "Requires Type Certificate under 14 CFR Part 21 as a powered-lift aircraft, or experimental category under Part 21.191.",
  },
  {
    id: "W2", category: "Weight & Category", regulation: "EASA CS-UAS / OPEN Category", authority: "EASA",
    element: "Craft mass 800 kg", status: "fail",
    detail: "EASA OPEN category is limited to 25 kg. SPECIFIC category requires operational authorisation. At 800 kg this requires CERTIFIED category.",
    modification: "Apply for EASA CERTIFIED category type design approval under Part 21. Equivalent to full aircraft certification.",
  },
  {
    id: "W3", category: "Weight & Category", regulation: "ICAO Annex 8 — Airworthiness", authority: "ICAO",
    element: "Novel propulsion configuration", status: "pending",
    detail: "No existing airworthiness standard covers a 16-fan annular-array powered-lift craft. ICAO Annex 8 requires states to establish standards for novel configurations.",
    modification: "Engage national aviation authority for Special Conditions development under ICAO Annex 8 §4.1.",
  },

  // ── Airspace ──
  {
    id: "A1", category: "Airspace", regulation: "14 CFR §91.119 — Minimum safe altitudes", authority: "FAA",
    element: "Low-altitude operation (3–30 m AGL)", status: "conditional",
    detail: "§91.119 requires 500 ft AGL over sparsely populated areas and 1,000 ft over congested areas. Low-altitude demo operations require specific waivers.",
    modification: "Apply for Certificate of Waiver or Authorisation (COA) under §91.903 for each planned low-altitude operation.",
  },
  {
    id: "A2", category: "Airspace", regulation: "14 CFR §91.113 — Right-of-way rules", authority: "FAA",
    element: "Autonomous obstacle repulsion", status: "conditional",
    detail: "The repulsion controller autonomously alters flight path. Autonomous deviation from ATC clearances is not permitted without prior approval.",
    modification: "Obstacle avoidance must be limited to pre-approved corridors. ATC must be notified of autonomous capability.",
  },
  {
    id: "A3", category: "Airspace", regulation: "EASA AUR Part-UAS — Operational authorisation", authority: "EASA",
    element: "Beyond visual line of sight (BVLOS)", status: "fail",
    detail: "BVLOS operations require specific operational authorisation. The repulsion navigation system implies potential BVLOS intent.",
    modification: "Restrict to VLOS operations or obtain BVLOS authorisation with remote pilot station and detect-and-avoid system.",
  },

  // ── Noise ──
  {
    id: "N1", category: "Noise", regulation: "14 CFR Part 36 — Noise Standards", authority: "FAA",
    element: "16-fan annular array, plenum-damped", status: "conditional",
    detail: "Part 36 noise limits apply to powered-lift aircraft. The plenum damping reduces BPF tonal by ~14 dB but broadband noise at hover (~78 dB at 1m) must be measured at certification reference points.",
    modification: "Conduct noise certification testing per Part 36 Appendix J (helicopters/powered-lift). Likely to pass with plenum damping at hover power.",
  },
  {
    id: "N2", category: "Noise", regulation: "EASA CS-36 — Aircraft noise", authority: "EASA",
    element: "Annular exhaust slit directivity", status: "conditional",
    detail: "CS-36 Chapter 11 covers novel/special aircraft. The 360° annular exhaust distributes noise uniformly — this may actually help certification by reducing directional peaks.",
    modification: "Submit noise test data from annular slit configuration. Uniform azimuthal radiation may qualify for reduced measurement point requirements.",
  },

  // ── RF / Electromagnetic ──
  {
    id: "R1", category: "RF & EMC", regulation: "FCC Part 15 — Unintentional radiators", authority: "FAA",
    element: "FPGA flight controller + 16× ESCs", status: "conditional",
    detail: "High-frequency switching in 16 ESCs (up to 32 kHz PWM) and FPGA logic can generate broadband RF emissions. Part 15 Class B limits apply.",
    modification: "Shielded ESC enclosures and ferrite chokes on motor leads. EMC test per ANSI C63.4 required before operation.",
  },
  {
    id: "R2", category: "RF & EMC", regulation: "EASA CS-ETSO C119 — TCAS", authority: "EASA",
    element: "No transponder / TCAS specified", status: "fail",
    detail: "Aircraft over 5,700 kg MTOW require TCAS II. At 800 kg this is below the threshold, but controlled airspace operations require Mode C transponder.",
    modification: "Install Mode C (or Mode S) transponder. For controlled airspace, ADS-B Out required after 2020 mandate.",
  },
  {
    id: "R3", category: "RF & EMC", regulation: "14 CFR §91.225 — ADS-B Out", authority: "FAA",
    element: "No ADS-B specified in BOM", status: "fail",
    detail: "ADS-B Out required in Class A, B, C airspace and above 10,000 ft MSL. Not required in Class G below 400 ft AGL, which covers most demo operations.",
    modification: "Add ADS-B Out module (e.g. uAvionix Ping200X, ~0.2 kg, 5W) to BOM for any controlled airspace operation.",
  },

  // ── Pilot / Operator ──
  {
    id: "P1", category: "Pilot & Operator", regulation: "14 CFR Part 61 — Pilot certification", authority: "FAA",
    element: "Remote pilot in command", status: "conditional",
    detail: "If operated as experimental aircraft, a Private Pilot certificate with powered-lift rating would be required. Under experimental amateur-built, sport pilot may suffice.",
    modification: "Obtain experimental aircraft airworthiness certificate. Remote pilot must hold appropriate certificate for the operating category.",
  },
  {
    id: "P2", category: "Pilot & Operator", regulation: "EASA Part-FCL — Pilot licensing", authority: "EASA",
    element: "Novel powered-lift category", status: "pending",
    detail: "No existing EASA licence type covers a powered-lift craft of this configuration. A new rating would need to be established.",
    modification: "Work with national authority to establish a type rating under Part-FCL Article 10 for novel aircraft.",
  },

  // ── Lighting & Marking ──
  {
    id: "L1", category: "Lighting & Marking", regulation: "14 CFR §91.209 — Aircraft lights", authority: "FAA",
    element: "No navigation lights in BOM", status: "fail",
    detail: "Navigation lights (red port, green starboard, white tail) are required for night operations. The saucer's symmetric shape makes standard placement non-trivial.",
    modification: "Install LED nav lights on the rim: red/green sectors on the lower disc edge, white aft sector. Add anti-collision strobe.",
  },
  {
    id: "L2", category: "Lighting & Marking", regulation: "14 CFR §45.29 — Nationality and registration marks", authority: "FAA",
    element: "CFRP hull — no markings specified", status: "fail",
    detail: "Registration marks must be at least 12 inches high on the fuselage or wing. The smooth CFRP disc must have a designated marking area.",
    modification: "Reserve a flat panel on the lower disc for registration markings. Use vinyl decal rated for outdoor use.",
  },

  // ── Safety Systems ──
  {
    id: "S1", category: "Safety Systems", regulation: "14 CFR Part 25 §25.1309 — Equipment, systems", authority: "FAA",
    element: "Dual redundant flight controllers", status: "pass",
    detail: "Dual FPGA+ARM flight controllers with triple IMUs satisfy the single-failure-survival requirement for critical systems. Failure probability analysis required.",
    modification: "Conduct FMEA per AC 25.1309-1A. Document failure modes and residual risk for each controller failure scenario.",
  },
  {
    id: "S2", category: "Safety Systems", regulation: "EASA CS-23 — Normal category aeroplanes", authority: "EASA",
    element: "Battery management system (BMS)", status: "pass",
    detail: "The BMS with cell balancing and thermal protection meets the intent of CS-23 Amendment 5 electrical system requirements for normal category.",
    modification: "Document BMS failure modes. Ensure battery disconnect is accessible and labelled per CS-23.1353.",
  },
  {
    id: "S3", category: "Safety Systems", regulation: "14 CFR §91.207 — Emergency locator transmitter", authority: "FAA",
    element: "No ELT in BOM", status: "fail",
    detail: "ELT required for all US-registered aircraft except gliders and balloons. 406 MHz ELT required for new installations.",
    modification: "Add 406 MHz ELT (e.g. ACR ResQLink, ~0.15 kg) to BOM. Register with NOAA SARSAT.",
  },
];

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  pass: { label: "PASS", color: "oklch(0.65 0.18 145)", bg: "oklch(0.65 0.18 145 / 0.08)" },
  fail: { label: "FAIL", color: "oklch(0.65 0.22 25)", bg: "oklch(0.65 0.22 25 / 0.08)" },
  conditional: { label: "CONDITIONAL", color: "oklch(0.72 0.16 80)", bg: "oklch(0.72 0.16 80 / 0.08)" },
  na: { label: "N/A", color: "oklch(0.45 0.015 240)", bg: "oklch(0.45 0.015 240 / 0.08)" },
  pending: { label: "PENDING", color: "oklch(0.60 0.15 280)", bg: "oklch(0.60 0.15 280 / 0.08)" },
};

const AUTHORITY_COLORS: Record<string, string> = {
  FAA: "oklch(0.75 0.18 200)",
  EASA: "oklch(0.72 0.16 80)",
  BOTH: "oklch(0.65 0.18 145)",
  ICAO: "oklch(0.60 0.15 280)",
};

const CATEGORIES = Array.from(new Set(ITEMS.map(i => i.category)));

export default function RegulatoryCompliance() {
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<Status | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = ITEMS.filter(item =>
    (!filterCat || item.category === filterCat) &&
    (!filterStatus || item.status === filterStatus)
  );

  const counts = {
    pass: ITEMS.filter(i => i.status === "pass").length,
    fail: ITEMS.filter(i => i.status === "fail").length,
    conditional: ITEMS.filter(i => i.status === "conditional").length,
    pending: ITEMS.filter(i => i.status === "pending").length,
    na: ITEMS.filter(i => i.status === "na").length,
  };

  const overallStatus = counts.fail > 0 ? "NOT READY FOR CERTIFICATION" : counts.conditional > 2 ? "CONDITIONAL APPROVAL POSSIBLE" : "CERTIFICATION PATH CLEAR";
  const overallColor = counts.fail > 0 ? "oklch(0.65 0.22 25)" : counts.conditional > 2 ? "oklch(0.72 0.16 80)" : "oklch(0.65 0.18 145)";

  return (
    <div className="space-y-6">
      {/* Summary banner */}
      <div className="rounded-sm px-5 py-4" style={{ background: `${overallColor.replace(")", " / 0.06)")}`, border: `1px solid ${overallColor.replace(")", " / 0.35)")}` }}>
        <div className="flex items-center justify-between mb-3">
          <div className="label-caps" style={{ color: overallColor }}>{overallStatus}</div>
          <div className="label-caps" style={{ color: "oklch(0.40 0.012 240)" }}>FAA · EASA · ICAO — {ITEMS.length} items</div>
        </div>
        <div className="flex gap-4 flex-wrap">
          {(Object.entries(counts) as [Status, number][]).map(([status, count]) => (
            <button key={status} onClick={() => setFilterStatus(filterStatus === status ? null : status)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-sm transition-all"
              style={{
                background: filterStatus === status ? STATUS_CONFIG[status].bg : "oklch(0.14 0.020 240)",
                border: `1px solid ${filterStatus === status ? STATUS_CONFIG[status].color.replace(")", " / 0.5)") : "oklch(0.22 0.015 240)"}`,
              }}>
              <span className="label-caps" style={{ color: STATUS_CONFIG[status].color }}>{STATUS_CONFIG[status].label}</span>
              <span className="data-value text-sm" style={{ color: STATUS_CONFIG[status].color }}>{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterCat(null)}
          className="px-3 py-1.5 rounded-sm text-xs transition-all"
          style={{
            fontFamily: "'JetBrains Mono'",
            background: !filterCat ? "oklch(0.75 0.18 200 / 0.15)" : "oklch(0.18 0.018 240)",
            border: `1px solid ${!filterCat ? "oklch(0.75 0.18 200 / 0.5)" : "oklch(0.25 0.015 240)"}`,
            color: !filterCat ? "oklch(0.75 0.18 200)" : "oklch(0.50 0.015 240)",
          }}>ALL CATEGORIES</button>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setFilterCat(filterCat === cat ? null : cat)}
            className="px-3 py-1.5 rounded-sm text-xs transition-all"
            style={{
              fontFamily: "'JetBrains Mono'",
              background: filterCat === cat ? "oklch(0.75 0.18 200 / 0.15)" : "oklch(0.18 0.018 240)",
              border: `1px solid ${filterCat === cat ? "oklch(0.75 0.18 200 / 0.5)" : "oklch(0.25 0.015 240)"}`,
              color: filterCat === cat ? "oklch(0.75 0.18 200)" : "oklch(0.50 0.015 240)",
            }}>{cat.toUpperCase()}</button>
        ))}
      </div>

      {/* Checklist items */}
      <div className="space-y-2">
        {filtered.map(item => {
          const sc = STATUS_CONFIG[item.status];
          const isExpanded = expandedId === item.id;
          return (
            <div key={item.id}
              className="rounded-sm overflow-hidden transition-all"
              style={{ border: `1px solid ${isExpanded ? sc.color.replace(")", " / 0.3)") : "oklch(0.20 0.015 240)"}` }}>
              <button
                className="w-full flex items-center gap-4 px-5 py-3 text-left transition-all"
                style={{ background: isExpanded ? sc.bg : "oklch(0.14 0.020 240)" }}
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                {/* ID */}
                <span className="data-value text-xs w-8 shrink-0" style={{ color: "oklch(0.45 0.015 240)" }}>{item.id}</span>

                {/* Authority badge */}
                <span className="label-caps text-xs px-2 py-0.5 rounded-sm shrink-0"
                  style={{ background: `${AUTHORITY_COLORS[item.authority].replace(")", " / 0.12)")}`, color: AUTHORITY_COLORS[item.authority], border: `1px solid ${AUTHORITY_COLORS[item.authority].replace(")", " / 0.3)")}` }}>
                  {item.authority}
                </span>

                {/* Regulation */}
                <span className="label-caps text-xs flex-1 truncate" style={{ color: "oklch(0.75 0.005 240)" }}>{item.regulation}</span>

                {/* Element */}
                <span className="text-xs hidden sm:block flex-1 truncate" style={{ color: "oklch(0.55 0.010 240)", fontFamily: "'Inter'" }}>{item.element}</span>

                {/* Status */}
                <span className="label-caps text-xs px-2 py-0.5 rounded-sm shrink-0"
                  style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color.replace(")", " / 0.3)")}` }}>
                  {sc.label}
                </span>

                {/* Chevron */}
                <span style={{ color: "oklch(0.40 0.012 240)", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", fontSize: 10 }}>▼</span>
              </button>

              {isExpanded && (
                <div className="px-5 pb-4 pt-3" style={{ background: "oklch(0.12 0.018 240)", borderTop: `1px solid ${sc.color.replace(")", " / 0.15)")}` }}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="label-caps mb-1" style={{ color: "oklch(0.50 0.015 240)" }}>COMPLIANCE ANALYSIS</div>
                      <p className="text-xs leading-relaxed" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'" }}>{item.detail}</p>
                    </div>
                    {item.modification && (
                      <div>
                        <div className="label-caps mb-1" style={{ color: "oklch(0.72 0.16 80)" }}>REQUIRED MODIFICATION / ACTION</div>
                        <p className="text-xs leading-relaxed" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'" }}>{item.modification}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* South Africa Demo Path */}
      <div className="rounded-sm px-5 py-4" style={{ background: "oklch(0.13 0.020 240)", border: "1px solid oklch(0.75 0.18 200 / 0.25)" }}>
        <div className="label-caps mb-2" style={{ color: "oklch(0.75 0.18 200)" }}>→ SOUTH AFRICA DEMO PATH (SACAA)</div>
        <p className="text-xs leading-relaxed mb-3" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'" }}>
          At 800 kg, this craft falls outside the SACAA Part 101 RPA rules (150 kg MTOM cap for commercial operations). The practical path for a South African demonstration flight is:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { step: "1. Experimental Permit", detail: "Apply to SACAA for an Experimental Certificate under CAR Part 24. Requires design documentation, safety case, and test site approval." },
            { step: "2. Restricted Test Site", detail: "Designate a NOTAM-protected test area (private land, Class G airspace, < 400 ft AGL). SACAA inspector sign-off required before first flight." },
            { step: "3. Tethered Demo First", detail: "Initial demo flights tethered (< 5 m altitude, < 10 m radius) to validate hover stability before free-flight authorisation. Reduces regulatory risk significantly." },
          ].map(({ step, detail }) => (
            <div key={step} className="rounded-sm p-3" style={{ background: "oklch(0.11 0.020 240)", border: "1px solid oklch(0.22 0.015 240)" }}>
              <div className="label-caps mb-1" style={{ color: "oklch(0.75 0.18 200)", fontSize: 8 }}>{step}</div>
              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.58 0.008 240)", fontFamily: "'Inter'" }}>{detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Jurisdiction note */}
      <div className="rounded-sm px-4 py-3" style={{ background: "oklch(0.13 0.018 240)", border: "1px solid oklch(0.20 0.015 240)" }}>
        <div className="label-caps mb-1" style={{ color: "oklch(0.40 0.012 240)" }}>JURISDICTION NOTE</div>
        <p className="text-xs leading-relaxed" style={{ color: "oklch(0.40 0.010 240)", fontFamily: "'Inter'" }}>
          The FAA and EASA items above are reference benchmarks only. Actual requirements depend on country, airspace class, flight test site, whether operations are experimental or commercial, and whether the craft is tethered or free-flying. At this mass class, operations move into experimental/aircraft-grade regulatory territory and require a dedicated safety case, test site permissions, and additional systems depending on jurisdiction. Do not treat any item above as a blanket requirement without consulting the relevant national aviation authority and qualified aviation legal counsel.
        </p>
      </div>
    </div>
  );
}
