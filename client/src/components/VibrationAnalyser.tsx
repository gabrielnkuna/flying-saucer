/* =============================================================
   COMPONENT: VibrationAnalyser
   Design: Classified Aerospace Dossier
   Structural vibration spectrum at different throttle levels.
   Blade-pass frequency harmonics, resonance modes, modal table.
   ============================================================= */
import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Legend,
} from "recharts";

// ── Physics helpers ───────────────────────────────────────────
// 16 fans, 3 blades each → BPF = RPM/60 * 3
// RPM range: 3800–5000 at 60–100% throttle
function bpf(throttle: number) {
  const rpm = 3800 + (throttle / 100) * 1200;
  return (rpm / 60) * 3; // Hz
}

// Generate structural vibration spectrum (log-spaced 10–2000 Hz)
// Model: broadband noise floor + BPF harmonics + structural resonances
function generateSpectrum(throttle: number, freqs: number[]) {
  const f0 = bpf(throttle);
  const harmonics = [1, 2, 3, 4, 5, 6];
  // Structural resonances (fixed, material-dependent)
  const resonances = [
    { f: 48, q: 12, amp: 8 },   // hull first bending
    { f: 127, q: 18, amp: 6 },  // fan ring hoop
    { f: 312, q: 25, amp: 4 },  // plenum panel
    { f: 580, q: 30, amp: 3 },  // vane servo bracket
    { f: 940, q: 40, amp: 2 },  // avionics bay
  ];

  return freqs.map(f => {
    // Broadband noise floor (falls off with frequency)
    let level = 55 - 12 * Math.log10(f / 10) + (throttle / 100) * 8;

    // BPF harmonics
    harmonics.forEach((n, i) => {
      const fh = f0 * n;
      const bw = fh * 0.04; // 4% bandwidth
      const amp = 22 - i * 3.5 + (throttle / 100) * 4;
      const d = Math.abs(f - fh);
      if (d < bw * 3) level += amp * Math.exp(-0.5 * (d / bw) ** 2);
    });

    // Structural resonances
    resonances.forEach(({ f: fr, q, amp }) => {
      const bw = fr / q;
      const d = Math.abs(f - fr);
      if (d < bw * 4) level += amp * Math.exp(-0.5 * (d / bw) ** 2);
    });

    return Math.max(20, Math.min(110, level));
  });
}

// Log-spaced frequencies 10–2000 Hz
const FREQS = Array.from({ length: 200 }, (_, i) => {
  return Math.round(10 * Math.pow(200, i / 199));
});

const THROTTLE_LEVELS = [60, 75, 90, 100];
const THROTTLE_COLORS: Record<number, string> = {
  60: "oklch(0.65 0.18 145)",
  75: "oklch(0.75 0.18 200)",
  90: "oklch(0.72 0.16 80)",
  100: "oklch(0.65 0.22 25)",
};

// Modal analysis table
interface Mode {
  id: string;
  name: string;
  freq: number;
  damping: number;
  excitedAt: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  mitigation: string;
}

const MODES: Mode[] = [
  { id: "M1", name: "Hull First Bending", freq: 48, damping: 2.1, excitedAt: "BPF×1 @ 60% throttle (190 Hz → not direct; sub-harmonic coupling)", severity: "LOW", mitigation: "CFRP hull stiffening ribs reduce amplitude by ~40%" },
  { id: "M2", name: "Fan Ring Hoop Mode", freq: 127, damping: 1.4, excitedAt: "BPF×2 @ 85% throttle (≈ 127 Hz)", severity: "HIGH", mitigation: "Annular damping ring at fan ring mid-plane; detune by ±5 Hz via mass inserts" },
  { id: "M3", name: "Plenum Panel Flutter", freq: 312, damping: 3.2, excitedAt: "BPF×3 @ 75% throttle (≈ 316 Hz)", severity: "MEDIUM", mitigation: "Constrained-layer damping on plenum inner surface; reduces SPL by 8 dB" },
  { id: "M4", name: "Vane Servo Bracket", freq: 580, damping: 4.5, excitedAt: "BPF×4 @ 90% throttle (≈ 576 Hz)", severity: "MEDIUM", mitigation: "Isolating rubber grommets on servo mounts; frequency shift to 620 Hz" },
  { id: "M5", name: "Avionics Bay Panel", freq: 940, damping: 5.8, excitedAt: "BPF×5 @ 95% throttle (≈ 950 Hz)", severity: "LOW", mitigation: "Foam-lined bay walls; no structural risk, minor EMI concern" },
];

const SEV_COLORS: Record<string, string> = {
  LOW: "oklch(0.65 0.18 145)",
  MEDIUM: "oklch(0.72 0.16 80)",
  HIGH: "oklch(0.65 0.22 25)",
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "oklch(0.12 0.020 240)", border: "1px solid oklch(0.25 0.015 240)", padding: "8px 12px", borderRadius: 4, minWidth: 160 }}>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "oklch(0.55 0.015 240)", marginBottom: 4 }}>{label} Hz</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: p.color }}>
          {p.name}: {p.value?.toFixed(1)} dB
        </div>
      ))}
    </div>
  );
};

export default function VibrationAnalyser() {
  const [activeThrottles, setActiveThrottles] = useState<Set<number>>(new Set([75, 100]));
  const [expandedMode, setExpandedMode] = useState<string | null>(null);

  const chartData = useMemo(() => {
    const spectra: Record<number, number[]> = {};
    THROTTLE_LEVELS.forEach(t => { spectra[t] = generateSpectrum(t, FREQS); });
    return FREQS.map((f, i) => {
      const pt: Record<string, number> = { freq: f };
      THROTTLE_LEVELS.forEach(t => { pt[`${t}%`] = spectra[t][i]; });
      return pt;
    });
  }, []);

  const toggleThrottle = (t: number) => {
    setActiveThrottles(prev => {
      const next = new Set(prev);
      if (next.has(t)) { if (next.size > 1) next.delete(t); }
      else next.add(t);
      return next;
    });
  };

  // BPF reference lines for active throttles
  const bpfLines = useMemo(() => {
    const lines: { f: number; label: string; color: string }[] = [];
    activeThrottles.forEach(t => {
      const f0 = bpf(t);
      [1, 2, 3].forEach(n => {
        lines.push({ f: Math.round(f0 * n), label: `BPF×${n}@${t}%`, color: THROTTLE_COLORS[t] });
      });
    });
    return lines;
  }, [activeThrottles]);

  return (
    <div className="space-y-6">
      {/* BPF summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {THROTTLE_LEVELS.map(t => {
          const f0 = bpf(t);
          const rpm = 3800 + (t / 100) * 1200;
          const active = activeThrottles.has(t);
          return (
            <button key={t} onClick={() => toggleThrottle(t)}
              className="rounded-sm p-4 text-left transition-all"
              style={{
                background: active ? `${THROTTLE_COLORS[t].replace(")", " / 0.10)")}` : "oklch(0.12 0.018 240)",
                border: `1px solid ${active ? THROTTLE_COLORS[t].replace(")", " / 0.45)") : "oklch(0.20 0.015 240)"}`,
              }}>
              <div className="label-caps mb-1" style={{ color: active ? THROTTLE_COLORS[t] : "oklch(0.35 0.015 240)" }}>{t}% Throttle</div>
              <div className="data-value text-xl" style={{ color: active ? THROTTLE_COLORS[t] : "oklch(0.35 0.015 240)" }}>{f0.toFixed(0)} Hz</div>
              <div className="label-caps mt-1" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>BPF · {Math.round(rpm)} RPM</div>
            </button>
          );
        })}
      </div>

      {/* Spectrum chart */}
      <div className="bg-navy-surface panel-border rounded-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="label-caps">Structural Vibration Spectrum (dB re 1 μm/s²)</div>
          <div className="label-caps" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>Log frequency axis · 10–2000 Hz</div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 20, left: 10 }}>
            <CartesianGrid stroke="oklch(0.18 0.015 240)" strokeDasharray="3 3" />
            <XAxis dataKey="freq"
              scale="log" domain={[10, 2000]} type="number"
              tickFormatter={v => `${v}`}
              ticks={[10, 20, 50, 100, 200, 500, 1000, 2000]}
              tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.40 0.015 240)" }}
              label={{ value: "Frequency (Hz)", position: "insideBottom", offset: -12, style: { fontFamily: "'Rajdhani'", fontSize: 10, fill: "oklch(0.40 0.015 240)", letterSpacing: "0.06em" } }}
            />
            <YAxis domain={[20, 110]}
              tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.40 0.015 240)" }}
              label={{ value: "dB", angle: -90, position: "insideLeft", offset: 10, style: { fontFamily: "'Rajdhani'", fontSize: 10, fill: "oklch(0.40 0.015 240)" } }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "oklch(0.50 0.015 240)" }} />

            {/* Structural resonance reference lines */}
            {MODES.map(m => (
              <ReferenceLine key={m.id} x={m.freq} stroke={SEV_COLORS[m.severity]}
                strokeDasharray="4 3" strokeWidth={1} opacity={0.5}
                label={{ value: m.id, position: "top", style: { fontFamily: "'JetBrains Mono'", fontSize: 8, fill: SEV_COLORS[m.severity] } }}
              />
            ))}

            {/* BPF harmonic lines */}
            {bpfLines.map(({ f, label, color }) => (
              <ReferenceLine key={label} x={f} stroke={color}
                strokeDasharray="2 4" strokeWidth={1} opacity={0.6} />
            ))}

            {/* Spectrum lines */}
            {THROTTLE_LEVELS.filter(t => activeThrottles.has(t)).map(t => (
              <Line key={t} dataKey={`${t}%`} name={`${t}% throttle`}
                stroke={THROTTLE_COLORS[t]} strokeWidth={1.5} dot={false}
                isAnimationActive={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-px" style={{ borderTop: "1px dashed oklch(0.65 0.22 25)", opacity: 0.7 }} />
            <span className="label-caps" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>HIGH resonance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-px" style={{ borderTop: "1px dashed oklch(0.72 0.16 80)", opacity: 0.7 }} />
            <span className="label-caps" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>MEDIUM resonance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-px" style={{ borderTop: "1px dashed oklch(0.65 0.18 145)", opacity: 0.7 }} />
            <span className="label-caps" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>LOW resonance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-px" style={{ borderTop: "2px dashed oklch(0.75 0.18 200)", opacity: 0.6 }} />
            <span className="label-caps" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>BPF harmonic</span>
          </div>
        </div>
      </div>

      {/* Modal analysis table */}
      <div className="bg-navy-surface panel-border rounded-sm p-5">
        <div className="label-caps mb-4">Modal Analysis — Structural Resonance Inventory</div>
        <div className="space-y-2">
          {MODES.map(mode => {
            const isExpanded = expandedMode === mode.id;
            return (
              <div key={mode.id} className="rounded-sm overflow-hidden" style={{ border: `1px solid ${SEV_COLORS[mode.severity].replace(")", " / 0.25)")}` }}>
                <button className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpandedMode(isExpanded ? null : mode.id)}>
                  <span className="label-caps w-8 shrink-0" style={{ color: SEV_COLORS[mode.severity] }}>{mode.id}</span>
                  <span className="flex-1 label-caps" style={{ color: "oklch(0.70 0.005 240)" }}>{mode.name}</span>
                  <span className="data-value text-sm shrink-0" style={{ color: "oklch(0.75 0.18 200)", width: 60, textAlign: "right" }}>{mode.freq} Hz</span>
                  <span className="data-value text-xs shrink-0" style={{ color: "oklch(0.50 0.015 240)", width: 50, textAlign: "right" }}>ζ={mode.damping}%</span>
                  <span className="label-caps px-2 py-0.5 rounded-sm shrink-0" style={{
                    fontSize: 8,
                    background: `${SEV_COLORS[mode.severity].replace(")", " / 0.10)")}`,
                    color: SEV_COLORS[mode.severity],
                    border: `1px solid ${SEV_COLORS[mode.severity].replace(")", " / 0.30)")}`,
                  }}>{mode.severity}</span>
                  <span style={{ color: "oklch(0.35 0.015 240)", fontSize: 10, transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2" style={{ borderTop: "1px solid oklch(0.16 0.015 240)", paddingTop: 10 }}>
                    <div>
                      <span className="label-caps" style={{ fontSize: 9, color: "oklch(0.75 0.18 200)" }}>EXCITED AT: </span>
                      <span className="text-xs" style={{ color: "oklch(0.60 0.008 240)", fontFamily: "'Inter'" }}>{mode.excitedAt}</span>
                    </div>
                    <div>
                      <span className="label-caps" style={{ fontSize: 9, color: "oklch(0.72 0.16 80)" }}>MITIGATION: </span>
                      <span className="text-xs" style={{ color: "oklch(0.60 0.008 240)", fontFamily: "'Inter'" }}>{mode.mitigation}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
