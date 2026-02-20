/* =============================================================
   COMPONENT: PropulsionTradeoff
   Design: Classified Aerospace Dossier
   Scored comparison of 3 propulsion tiers across 6 criteria.
   User adjusts weighting sliders → winner updates live.
   ============================================================= */
import { useState, useMemo } from "react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface Criterion {
  id: string;
  label: string;
  desc: string;
  weight: number; // 0–10
}

interface PropulsionTier {
  id: string;
  name: string;
  shortName: string;
  trl: number;
  color: string;
  scores: Record<string, number>; // 0–10 per criterion
  notes: string;
  status: string;
}

const CRITERIA: Criterion[] = [
  { id: "trl", label: "TRL", desc: "Technology Readiness Level — how close to deployment", weight: 8 },
  { id: "thrust", label: "Thrust Density", desc: "Thrust per unit mass of propulsion system (N/kg)", weight: 7 },
  { id: "noise", label: "Acoustic Stealth", desc: "Low noise signature — higher = quieter", weight: 6 },
  { id: "efficiency", label: "Power Efficiency", desc: "Thrust per watt — lower power for same lift", weight: 7 },
  { id: "detectability", label: "EM Detectability", desc: "Low radar/thermal cross-section — higher = stealthier", weight: 5 },
  { id: "cost", label: "Cost", desc: "Relative system cost — higher = cheaper", weight: 6 },
];

const TIERS: PropulsionTier[] = [
  {
    id: "ducted",
    name: "Ducted Fan Array",
    shortName: "Ducted Fans",
    trl: 8,
    color: "oklch(0.75 0.18 200)",
    scores: { trl: 9, thrust: 7, noise: 6, efficiency: 8, detectability: 5, cost: 9 },
    notes: "Reference propulsion system. 16 × 80A ducted fans with annular plenum. TRL 8 — commercially available components. Moderate acoustic signature mitigated by plenum damping.",
    status: "SELECTED",
  },
  {
    id: "plasma",
    name: "Plasma / Ion Jet",
    shortName: "Plasma Jets",
    trl: 4,
    color: "oklch(0.60 0.15 280)",
    scores: { trl: 4, thrust: 5, noise: 9, efficiency: 4, detectability: 7, cost: 2 },
    notes: "Dielectric barrier discharge or RF plasma thrusters. Near-silent, no moving parts, low EM signature. Extremely low thrust density and poor power efficiency at current TRL. Requires exotic power electronics.",
    status: "EMERGING",
  },
  {
    id: "photonic",
    name: "Photonic Pressure",
    shortName: "Photonic",
    trl: 2,
    color: "oklch(0.72 0.16 80)",
    scores: { trl: 2, thrust: 1, noise: 10, efficiency: 2, detectability: 9, cost: 1 },
    notes: "Radiation pressure from high-power laser arrays. Completely silent, zero EM signature. Thrust density 10⁻⁶ N/W — requires megawatt-scale power for any useful lift. Speculative at craft scale.",
    status: "SPECULATIVE",
  },
];

const STATUS_COLORS: Record<string, string> = {
  SELECTED: "oklch(0.65 0.18 145)",
  EMERGING: "oklch(0.60 0.15 280)",
  SPECULATIVE: "oklch(0.72 0.16 80)",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "oklch(0.14 0.020 240)", border: "1px solid oklch(0.28 0.015 240)", padding: "8px 12px", borderRadius: 4 }}>
      {payload.map((p: any) => (
        <div key={p.name} style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: p.color }}>{p.name}: {p.value?.toFixed(1)}</div>
      ))}
    </div>
  );
};

export default function PropulsionTradeoff() {
  const [weights, setWeights] = useState<Record<string, number>>(
    Object.fromEntries(CRITERIA.map(c => [c.id, c.weight]))
  );

  const totalWeight = useMemo(() => Object.values(weights).reduce((a, b) => a + b, 0), [weights]);

  const weightedScores = useMemo(() =>
    TIERS.map(tier => {
      const score = CRITERIA.reduce((sum, c) => sum + tier.scores[c.id] * (weights[c.id] / totalWeight), 0);
      return { ...tier, weightedScore: score };
    }).sort((a, b) => b.weightedScore - a.weightedScore),
    [weights, totalWeight]
  );

  const winner = weightedScores[0];

  const radarData = CRITERIA.map(c => ({
    subject: c.label,
    ...Object.fromEntries(TIERS.map(t => [t.shortName, t.scores[c.id]])),
  }));

  return (
    <div className="space-y-6">
      {/* Winner banner */}
      <div className="rounded-sm px-5 py-4 flex items-center justify-between" style={{
        background: `${winner.color.replace(")", " / 0.08)")}`,
        border: `1px solid ${winner.color.replace(")", " / 0.40)")}`,
      }}>
        <div>
          <div className="label-caps mb-0.5" style={{ color: winner.color }}>Weighted Winner</div>
          <div style={{ fontFamily: "'Rajdhani'", fontSize: 20, fontWeight: 700, color: winner.color }}>{winner.name}</div>
        </div>
        <div className="text-right">
          <div className="label-caps mb-0.5" style={{ color: "oklch(0.45 0.015 240)" }}>Composite Score</div>
          <div className="data-value text-3xl" style={{ color: winner.color }}>{winner.weightedScore.toFixed(2)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weighting sliders */}
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="label-caps mb-4">Criteria Weighting (drag to adjust priority)</div>
          <div className="space-y-4">
            {CRITERIA.map(c => (
              <div key={c.id}>
                <div className="flex items-center justify-between mb-1">
                  <div>
                    <span className="label-caps" style={{ color: "oklch(0.70 0.005 240)" }}>{c.label}</span>
                    <span className="text-xs ml-2" style={{ color: "oklch(0.40 0.010 240)", fontFamily: "'Inter'" }}>{c.desc}</span>
                  </div>
                  <span className="data-value text-sm" style={{ color: "oklch(0.75 0.18 200)" }}>{weights[c.id]}</span>
                </div>
                <input type="range" min={0} max={10} step={1} value={weights[c.id]}
                  onChange={e => setWeights(w => ({ ...w, [c.id]: parseInt(e.target.value) }))}
                  className="w-full" style={{ accentColor: "oklch(0.75 0.18 200)" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Radar chart */}
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="label-caps mb-3">Raw Score Comparison (unweighted)</div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="oklch(0.22 0.015 240)" />
              <PolarAngleAxis dataKey="subject"
                tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.50 0.015 240)" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "oklch(0.50 0.015 240)" }} />
              {TIERS.map(t => (
                <Radar key={t.id} dataKey={t.shortName} name={t.shortName}
                  stroke={t.color} fill={`${t.color.replace(")", " / 0.10)")}`} strokeWidth={2} />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranked scores */}
      <div className="bg-navy-surface panel-border rounded-sm p-5">
        <div className="label-caps mb-4">Weighted Ranking</div>
        <div className="space-y-3">
          {weightedScores.map((tier, rank) => (
            <div key={tier.id} className="rounded-sm p-4" style={{
              background: `${tier.color.replace(")", " / 0.06)")}`,
              border: `1px solid ${tier.color.replace(")", " / 0.25)")}`,
            }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="data-value text-2xl" style={{ color: tier.color, opacity: 0.5 }}>#{rank + 1}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "'Rajdhani'", fontSize: 15, fontWeight: 700, color: tier.color }}>{tier.name}</span>
                      <span className="label-caps px-2 py-0.5 rounded-sm" style={{
                        background: `${STATUS_COLORS[tier.status].replace(")", " / 0.12)")}`,
                        color: STATUS_COLORS[tier.status],
                        border: `1px solid ${STATUS_COLORS[tier.status].replace(")", " / 0.30)")}`,
                        fontSize: 9,
                      }}>{tier.status}</span>
                    </div>
                    <div className="label-caps mt-0.5" style={{ color: "oklch(0.40 0.015 240)", fontSize: 9 }}>TRL {tier.trl}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="data-value text-xl" style={{ color: tier.color }}>{tier.weightedScore.toFixed(2)}</div>
                  <div className="label-caps" style={{ color: "oklch(0.40 0.015 240)", fontSize: 9 }}>composite</div>
                </div>
              </div>

              {/* Per-criterion score bars */}
              <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 mb-3">
                {CRITERIA.map(c => (
                  <div key={c.id} className="flex items-center gap-2">
                    <span className="label-caps w-20 shrink-0" style={{ fontSize: 8, color: "oklch(0.40 0.015 240)" }}>{c.label}</span>
                    <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.018 240)" }}>
                      <div className="h-full rounded-full" style={{ width: `${tier.scores[c.id] * 10}%`, background: tier.color }} />
                    </div>
                    <span className="data-value" style={{ fontSize: 9, color: tier.color, width: 14, textAlign: "right" }}>{tier.scores[c.id]}</span>
                  </div>
                ))}
              </div>

              <p className="text-xs leading-relaxed" style={{ color: "oklch(0.50 0.010 240)", fontFamily: "'Inter'" }}>{tier.notes}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Full criteria × tier matrix */}
      <div className="bg-navy-surface panel-border rounded-sm p-5">
        <div className="label-caps mb-3">Score Matrix</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid oklch(0.22 0.015 240)" }}>
                <th className="py-2 label-caps text-left pr-6" style={{ color: "oklch(0.40 0.015 240)" }}>Criterion</th>
                <th className="py-2 label-caps text-center pr-4" style={{ color: "oklch(0.40 0.015 240)" }}>Weight</th>
                {TIERS.map(t => (
                  <th key={t.id} className="py-2 label-caps text-center pr-4" style={{ color: t.color }}>{t.shortName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CRITERIA.map(c => (
                <tr key={c.id} style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
                  <td className="py-2 label-caps pr-6" style={{ color: "oklch(0.60 0.005 240)" }}>{c.label}</td>
                  <td className="py-2 text-center pr-4 data-value" style={{ color: "oklch(0.75 0.18 200)", fontFamily: "'JetBrains Mono'", fontSize: 11 }}>{weights[c.id]}</td>
                  {TIERS.map(t => (
                    <td key={t.id} className="py-2 text-center pr-4 data-value" style={{
                      color: t.color,
                      fontFamily: "'JetBrains Mono'", fontSize: 11,
                      fontWeight: t.scores[c.id] === Math.max(...TIERS.map(x => x.scores[c.id])) ? 700 : 400,
                    }}>{t.scores[c.id]}</td>
                  ))}
                </tr>
              ))}
              <tr style={{ borderTop: "1px solid oklch(0.28 0.015 240)" }}>
                <td className="py-2 label-caps pr-6" style={{ color: "oklch(0.75 0.18 200)" }}>Weighted Total</td>
                <td className="py-2 pr-4" />
                {weightedScores.sort((a, b) => TIERS.indexOf(a) - TIERS.indexOf(b)).map(t => (
                  <td key={t.id} className="py-2 text-center pr-4 data-value" style={{ color: t.color, fontFamily: "'JetBrains Mono'", fontSize: 12, fontWeight: 700 }}>
                    {t.weightedScore.toFixed(2)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
