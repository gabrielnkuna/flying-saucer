/* =============================================================
   COMPONENT: AcousticAnalyser
   Design: Classified Aerospace Dossier
   Frequency-domain chart of annular array acoustic output
   at different throttle levels — damped vs undamped spectrum
   ============================================================= */
import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, Legend,
} from "recharts";

// ── Acoustic model ────────────────────────────────────────────
// Fan blade-pass frequency: BPF = RPM/60 × blades
// At hover throttle (~75%): ~3200 RPM, 5 blades → BPF ≈ 267 Hz
// Harmonics at 2×, 3×, 4× BPF
// Plenum resonance damps BPF and harmonics by ~12–18 dB

const BLADES = 5;
const MAX_RPM = 5800;
const MIN_RPM = 1200;

function getRPM(throttle: number) {
  return MIN_RPM + throttle * (MAX_RPM - MIN_RPM);
}

function getBPF(throttle: number) {
  return (getRPM(throttle) / 60) * BLADES;
}

// Generate spectrum data points (20 Hz – 4000 Hz, log-spaced)
function generateSpectrum(throttle: number, damped: boolean): { freq: number; dB: number }[] {
  const rpm = getRPM(throttle);
  const bpf = (rpm / 60) * BLADES;
  const points: { freq: number; dB: number }[] = [];

  // Log-spaced frequencies
  const freqs: number[] = [];
  for (let i = 0; i <= 200; i++) {
    freqs.push(20 * Math.pow(4000 / 20, i / 200));
  }

  freqs.forEach(freq => {
    // Broadband turbulence noise floor (rises with throttle, rolls off at high freq)
    const broadband = 55 + throttle * 22 - 10 * Math.log10(freq / 100 + 1);

    // Tonal components at BPF harmonics
    let tonal = 0;
    for (let h = 1; h <= 5; h++) {
      const harmonicFreq = bpf * h;
      const dist = Math.abs(freq - harmonicFreq);
      const width = harmonicFreq * 0.04; // 4% bandwidth
      if (dist < width * 3) {
        const amplitude = (30 - h * 4) + throttle * 8; // dB above broadband
        tonal += amplitude * Math.exp(-0.5 * (dist / width) ** 2);
      }
    }

    // Plenum resonance: broad dip centred at BPF and harmonics
    let plenumAttenuation = 0;
    if (damped) {
      for (let h = 1; h <= 3; h++) {
        const harmonicFreq = bpf * h;
        const dist = Math.abs(freq - harmonicFreq);
        const width = harmonicFreq * 0.25;
        plenumAttenuation += (14 + h * 2) * Math.exp(-0.5 * (dist / width) ** 2);
      }
      // Additional broadband damping from plenum absorption
      plenumAttenuation += Math.min(8, freq / 500 * 4);
    }

    // Annular slit directivity: reduces low-frequency radiation
    const slitAttenuation = damped ? Math.max(0, 6 - freq / 80) : 0;

    const total = broadband + tonal - plenumAttenuation - slitAttenuation;
    points.push({ freq: Math.round(freq), dB: Math.max(20, Math.min(110, total)) });
  });

  return points;
}

// Merge two spectra into a single dataset for the comparison chart
function mergeSpectra(undamped: { freq: number; dB: number }[], damped: { freq: number; dB: number }[]) {
  return undamped.map((u, i) => ({
    freq: u.freq,
    undamped: parseFloat(u.dB.toFixed(1)),
    damped: parseFloat(damped[i].dB.toFixed(1)),
    reduction: parseFloat((u.dB - damped[i].dB).toFixed(1)),
  }));
}

const THROTTLE_PRESETS = [
  { label: "IDLE (30%)", value: 0.3, color: "oklch(0.65 0.18 145)" },
  { label: "HOVER (75%)", value: 0.75, color: "oklch(0.75 0.18 200)" },
  { label: "BURST (100%)", value: 1.0, color: "oklch(0.65 0.22 25)" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "oklch(0.14 0.020 240)", border: "1px solid oklch(0.28 0.015 240)", padding: "8px 12px", borderRadius: 4, minWidth: 160 }}>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "oklch(0.55 0.015 240)", marginBottom: 4 }}>{label} Hz</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: p.color, display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>{p.name}</span>
          <span>{typeof p.value === 'number' && isFinite(p.value) ? p.value.toFixed(1) : '—'} dB</span>
        </div>
      ))}
    </div>
  );
};

export default function AcousticAnalyser() {
  const [throttle, setThrottle] = useState(0.75);
  const [showDamped, setShowDamped] = useState(true);
  const [showUndamped, setShowUndamped] = useState(true);
  const [activePreset, setActivePreset] = useState(1);

  const bpf = getBPF(throttle);
  const rpm = getRPM(throttle);

  const data = useMemo(() => {
    const undamped = generateSpectrum(throttle, false);
    const damped = generateSpectrum(throttle, true);
    return mergeSpectra(undamped, damped);
  }, [throttle]);

  // Compute key metrics
  const avgReduction = data.reduce((s, d) => s + d.reduction, 0) / data.length;
  const maxReduction = Math.max(...data.map(d => d.reduction));
  const bpfReduction = (() => {
    const near = data.filter(d => Math.abs(d.freq - bpf) < bpf * 0.05);
    if (!near.length) return 0;
    return near.reduce((s, d) => s + d.reduction, 0) / near.length;
  })();
  const overallDampedSPL = 10 * Math.log10(data.reduce((s, d) => s + Math.pow(10, d.damped / 10), 0) / data.length);
  const overallUndampedSPL = 10 * Math.log10(data.reduce((s, d) => s + Math.pow(10, d.undamped / 10), 0) / data.length);

  // Reduction area chart data (every 5th point for performance)
  const reductionData = data.filter((_, i) => i % 3 === 0);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Throttle slider */}
        <div className="bg-navy-surface panel-border rounded-sm p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <div className="label-caps">Throttle Level</div>
            <div className="data-value text-sm" style={{ color: "oklch(0.75 0.18 200)" }}>
              {(throttle * 100).toFixed(0)}% — {rpm.toFixed(0)} RPM — BPF {bpf.toFixed(0)} Hz
            </div>
          </div>
          <input
            type="range" min={0.1} max={1.0} step={0.01}
            value={throttle}
            onChange={e => { setThrottle(parseFloat(e.target.value)); setActivePreset(-1); }}
            className="w-full mb-4"
            style={{ accentColor: "oklch(0.75 0.18 200)" }}
          />
          <div className="flex gap-2">
            {THROTTLE_PRESETS.map((p, i) => (
              <button
                key={p.label}
                onClick={() => { setThrottle(p.value); setActivePreset(i); }}
                className="px-3 py-1.5 rounded-sm text-xs transition-all"
                style={{
                  fontFamily: "'JetBrains Mono'",
                  background: activePreset === i ? `${p.color.replace(")", " / 0.15)")}` : "oklch(0.18 0.018 240)",
                  border: `1px solid ${activePreset === i ? p.color.replace(")", " / 0.5)") : "oklch(0.25 0.015 240)"}`,
                  color: activePreset === i ? p.color : "oklch(0.50 0.015 240)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle overlays */}
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="label-caps mb-3">Overlay Control</div>
          <div className="space-y-3">
            {[
              { key: "undamped", label: "Undamped (bare array)", color: "oklch(0.65 0.22 25)", state: showUndamped, set: setShowUndamped },
              { key: "damped", label: "Damped (plenum + slit)", color: "oklch(0.75 0.18 200)", state: showDamped, set: setShowDamped },
            ].map(item => (
              <button
                key={item.key}
                onClick={() => item.set(v => !v)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-sm transition-all"
                style={{
                  background: item.state ? `${item.color.replace(")", " / 0.08)")}` : "oklch(0.14 0.020 240)",
                  border: `1px solid ${item.state ? item.color.replace(")", " / 0.4)") : "oklch(0.22 0.015 240)"}`,
                }}
              >
                <div style={{ width: 10, height: 10, borderRadius: 2, background: item.state ? item.color : "oklch(0.30 0.015 240)", flexShrink: 0 }} />
                <span className="label-caps text-left" style={{ color: item.state ? item.color : "oklch(0.40 0.012 240)" }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main spectrum chart */}
      <div className="bg-navy-surface panel-border rounded-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="label-caps">Sound Pressure Level — Frequency Spectrum</div>
          <div className="label-caps" style={{ color: "oklch(0.45 0.015 240)" }}>dB SPL (A-weighted) · 1m distance</div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.015 240)" />
            <XAxis
              dataKey="freq"
              type="number"
              scale="log"
              domain={[20, 4000]}
              ticks={[50, 100, 200, 500, 1000, 2000, 4000]}
              tickFormatter={v => v >= 1000 ? `${v / 1000}k` : `${v}`}
              tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.45 0.015 240)" }}
              axisLine={false} tickLine={false}
              label={{ value: "Frequency (Hz)", position: "insideBottom", offset: -2, style: { fontFamily: "'Rajdhani'", fontSize: 10, fill: "oklch(0.40 0.015 240)" } }}
            />
            <YAxis
              domain={[20, 110]}
              tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.45 0.015 240)" }}
              axisLine={false} tickLine={false}
              label={{ value: "dB SPL", angle: -90, position: "insideLeft", style: { fontFamily: "'Rajdhani'", fontSize: 10, fill: "oklch(0.40 0.015 240)" } }}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* BPF harmonic reference lines */}
            {[1, 2, 3].map(h => (
              <ReferenceLine
                key={h}
                x={Math.round(bpf * h)}
                stroke="oklch(0.60 0.15 280 / 0.4)"
                strokeDasharray="4 3"
                label={{ value: `${h}×BPF`, position: "top", style: { fontFamily: "'JetBrains Mono'", fontSize: 8, fill: "oklch(0.60 0.15 280 / 0.6)" } }}
              />
            ))}
            {/* 85 dB hearing damage threshold */}
            <ReferenceLine
              y={85}
              stroke="oklch(0.65 0.22 25 / 0.35)"
              strokeDasharray="6 3"
              label={{ value: "85 dB threshold", position: "right", style: { fontFamily: "'JetBrains Mono'", fontSize: 8, fill: "oklch(0.65 0.22 25 / 0.6)" } }}
            />
            {showUndamped && (
              <Line
                dataKey="undamped"
                name="Undamped"
                stroke="oklch(0.65 0.22 25)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            )}
            {showDamped && (
              <Line
                dataKey="damped"
                name="Damped"
                stroke="oklch(0.75 0.18 200)"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Reduction chart + metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reduction area */}
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="label-caps mb-4">Plenum Attenuation — Reduction vs Frequency</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={reductionData} margin={{ left: 0, right: 10, top: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.015 240)" />
              <XAxis
                dataKey="freq"
                type="number"
                scale="log"
                domain={[20, 4000]}
                ticks={[50, 200, 1000, 4000]}
                tickFormatter={v => v >= 1000 ? `${v / 1000}k` : `${v}`}
                tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.45 0.015 240)" }}
                axisLine={false} tickLine={false}
              />
              <YAxis
                domain={[0, 35]}
                tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.45 0.015 240)" }}
                axisLine={false} tickLine={false}
                label={{ value: "dB reduction", angle: -90, position: "insideLeft", style: { fontFamily: "'Rajdhani'", fontSize: 10, fill: "oklch(0.40 0.015 240)" } }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                dataKey="reduction"
                name="Reduction"
                stroke="oklch(0.65 0.18 145)"
                fill="oklch(0.65 0.18 145 / 0.12)"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Key metrics */}
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="label-caps mb-3">Acoustic Performance Metrics</div>
          <div className="space-y-0">
            {[
              { label: "Fan RPM", value: `${rpm.toFixed(0)}`, unit: "rpm", color: "oklch(0.88 0.005 240)" },
              { label: "Blade-Pass Frequency", value: `${bpf.toFixed(0)}`, unit: "Hz", color: "oklch(0.60 0.15 280)" },
              { label: "Overall SPL (undamped)", value: `${overallUndampedSPL.toFixed(1)}`, unit: "dB", color: "oklch(0.65 0.22 25)" },
              { label: "Overall SPL (damped)", value: `${overallDampedSPL.toFixed(1)}`, unit: "dB", color: "oklch(0.75 0.18 200)" },
              { label: "BPF Attenuation", value: `${bpfReduction.toFixed(1)}`, unit: "dB", color: "oklch(0.65 0.18 145)" },
              { label: "Avg Broadband Reduction", value: `${avgReduction.toFixed(1)}`, unit: "dB", color: "oklch(0.65 0.18 145)" },
              { label: "Peak Attenuation", value: `${maxReduction.toFixed(1)}`, unit: "dB", color: "oklch(0.65 0.18 145)" },
            ].map(({ label, value, unit, color }) => (
              <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}>
                <span className="label-caps">{label}</span>
                <span className="data-value text-sm" style={{ color }}>
                  {value} <span style={{ color: "oklch(0.40 0.012 240)", fontSize: "0.75em" }}>{unit}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Design notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            title: "PLENUM RESONANCE DAMPING",
            color: "oklch(0.75 0.18 200)",
            body: "The annular plenum chamber acts as a Helmholtz resonator array. Distributed resonant chambers are tuned to the BPF and first two harmonics, providing 12–18 dB of tonal attenuation at those frequencies. This is the same principle used in automotive intake noise cancellation.",
          },
          {
            title: "ANNULAR SLIT DIRECTIVITY",
            color: "oklch(0.65 0.18 145)",
            body: "The 360° annular exhaust slit distributes the acoustic radiation uniformly in azimuth, eliminating the directional lobes produced by discrete jet exhausts. Below 200 Hz, the slit geometry provides an additional 4–8 dB of low-frequency attenuation due to destructive interference across the ring.",
          },
          {
            title: "RESIDUAL SIGNATURE",
            color: "oklch(0.72 0.16 80)",
            body: "After plenum damping, the dominant residual is broadband turbulence noise in the 200–800 Hz band. This is perceptually similar to wind noise rather than a mechanical fan, which is the desired acoustic camouflage. The 85 dB threshold is crossed only at burst throttle within 5 m.",
          },
          {
            title: "IDENTIFICATION RISK",
            color: "oklch(0.60 0.15 280)",
            body: "The BPF at hover (≈267 Hz) falls in the most sensitive range of human hearing. Without plenum damping, the tonal component would be immediately identifiable as a fan. The damped spectrum's tonal peaks are suppressed below the broadband floor, making spectral identification significantly harder.",
          },
        ].map(card => (
          <div key={card.title} className="rounded-sm p-4" style={{ background: "oklch(0.14 0.020 240)", border: `1px solid ${card.color.replace(")", " / 0.2)")}` }}>
            <div className="label-caps mb-2" style={{ color: card.color }}>{card.title}</div>
            <p className="text-xs leading-relaxed" style={{ color: "oklch(0.60 0.008 240)", fontFamily: "'Inter'" }}>{card.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
