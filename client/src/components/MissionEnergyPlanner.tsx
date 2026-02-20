/* =============================================================
   COMPONENT: MissionEnergyPlanner
   Design: Classified Aerospace Dossier
   Flight profile builder → energy draw → SoC curve → endurance
   ============================================================= */
import { useState, useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";

// ── Power model ───────────────────────────────────────────────
const HOVER_POWER_KW = 220;       // kW at hover
const GLIDE_POWER_KW = 260;       // kW during flat glide (vectoring overhead)
const BURST_POWER_KW = 350;       // kW during burst manoeuvre
const IDLE_POWER_KW = 45;         // kW systems-only (avionics, BMS, sensors)
const BATTERY_KWH = 55;
const BATTERY_RESERVE_PCT = 15;   // keep 15% reserve
const USABLE_KWH = BATTERY_KWH * (1 - BATTERY_RESERVE_PCT / 100);

interface Segment {
  id: string;
  type: "hover" | "glide" | "burst" | "idle";
  duration: number; // minutes
}

const SEGMENT_CONFIG = {
  hover: { label: "Hover", power: HOVER_POWER_KW, color: "oklch(0.75 0.18 200)", icon: "⊙" },
  glide: { label: "Flat Glide", power: GLIDE_POWER_KW, color: "oklch(0.65 0.18 145)", icon: "→" },
  burst: { label: "Burst Manoeuvre", power: BURST_POWER_KW, color: "oklch(0.65 0.22 25)", icon: "⚡" },
  idle:  { label: "Systems Idle", power: IDLE_POWER_KW, color: "oklch(0.60 0.15 280)", icon: "◌" },
};

const DEFAULT_PROFILE: Segment[] = [
  { id: "s1", type: "hover", duration: 2 },
  { id: "s2", type: "glide", duration: 5 },
  { id: "s3", type: "burst", duration: 1 },
  { id: "s4", type: "hover", duration: 3 },
  { id: "s5", type: "glide", duration: 4 },
  { id: "s6", type: "burst", duration: 0.5 },
  { id: "s7", type: "hover", duration: 2 },
];

function buildSoCCurve(segments: Segment[]) {
  const points: { time: number; soc: number; segment: string; power: number }[] = [];
  let time = 0;
  let energyUsed = 0;

  points.push({ time: 0, soc: 100, segment: "start", power: 0 });

  segments.forEach(seg => {
    const cfg = SEGMENT_CONFIG[seg.type];
    const energyKWh = cfg.power * (seg.duration / 60);
    const steps = Math.max(2, Math.round(seg.duration * 4));
    for (let i = 1; i <= steps; i++) {
      const dt = seg.duration / steps;
      time += dt;
      energyUsed += cfg.power * (dt / 60);
      const soc = Math.max(0, ((BATTERY_KWH - energyUsed) / BATTERY_KWH) * 100);
      points.push({ time: parseFloat(time.toFixed(2)), soc: parseFloat(soc.toFixed(1)), segment: seg.type, power: cfg.power });
    }
  });

  return { points, totalTime: time, totalEnergy: energyUsed };
}

// How many more minutes can we hover after the profile?
function remainingHoverTime(energyUsed: number) {
  const remaining = USABLE_KWH - energyUsed;
  if (remaining <= 0) return 0;
  return (remaining / HOVER_POWER_KW) * 60;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{ background: "oklch(0.14 0.020 240)", border: "1px solid oklch(0.28 0.015 240)", padding: "8px 12px", borderRadius: 4 }}>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "oklch(0.55 0.015 240)", marginBottom: 4 }}>{label} min</div>
      <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 11, color: "oklch(0.75 0.18 200)" }}>SoC: {d?.soc?.toFixed(1)}%</div>
      {d?.power > 0 && <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 10, color: "oklch(0.55 0.015 240)" }}>{d.power} kW · {d.segment}</div>}
    </div>
  );
};

let nextId = 100;

export default function MissionEnergyPlanner() {
  const [segments, setSegments] = useState<Segment[]>(DEFAULT_PROFILE);
  const [addType, setAddType] = useState<Segment["type"]>("hover");
  const [addDuration, setAddDuration] = useState(2);

  const { points, totalTime, totalEnergy } = useMemo(() => buildSoCCurve(segments), [segments]);
  const finalSoC = points[points.length - 1]?.soc ?? 100;
  const remainingHover = remainingHoverTime(totalEnergy);
  const exceedsUsable = totalEnergy > USABLE_KWH;
  const exceedsTotal = totalEnergy > BATTERY_KWH;

  const totalFlightTime = segments.reduce((s, seg) => s + seg.duration, 0);

  const addSegment = () => {
    setSegments(prev => [...prev, { id: `s${nextId++}`, type: addType, duration: addDuration }]);
  };

  const removeSegment = (id: string) => setSegments(prev => prev.filter(s => s.id !== id));

  const moveSegment = (id: string, dir: -1 | 1) => {
    setSegments(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx < 0) return prev;
      const next = [...prev];
      const swap = idx + dir;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  };

  const resetProfile = () => setSegments(DEFAULT_PROFILE);

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="rounded-sm px-5 py-3 flex items-center justify-between" style={{
        background: exceedsTotal ? "oklch(0.65 0.22 25 / 0.10)" : exceedsUsable ? "oklch(0.72 0.16 80 / 0.08)" : "oklch(0.65 0.18 145 / 0.06)",
        border: `1px solid ${exceedsTotal ? "oklch(0.65 0.22 25 / 0.4)" : exceedsUsable ? "oklch(0.72 0.16 80 / 0.35)" : "oklch(0.65 0.18 145 / 0.3)"}`,
      }}>
        <div>
          <div className="label-caps" style={{ color: exceedsTotal ? "oklch(0.65 0.22 25)" : exceedsUsable ? "oklch(0.72 0.16 80)" : "oklch(0.65 0.18 145)" }}>
            {exceedsTotal ? "⚠ PROFILE EXCEEDS TOTAL BATTERY CAPACITY" : exceedsUsable ? "⚠ PROFILE EXCEEDS USABLE RESERVE — REDUCE DURATION" : "✓ PROFILE WITHIN ENERGY BUDGET"}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.010 240)", fontFamily: "'Inter'" }}>
            {totalEnergy.toFixed(1)} kWh used · {finalSoC.toFixed(1)}% SoC remaining · {remainingHover.toFixed(0)} min hover reserve
          </div>
        </div>
        <button onClick={resetProfile} className="label-caps px-3 py-1 rounded-sm transition-all"
          style={{ border: "1px solid oklch(0.30 0.015 240)", color: "oklch(0.50 0.015 240)" }}>
          RESET
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile builder */}
        <div className="space-y-4">
          <div className="bg-navy-surface panel-border rounded-sm p-5">
            <div className="label-caps mb-3">Flight Profile Segments</div>
            <div className="space-y-1 mb-4 max-h-64 overflow-y-auto">
              {segments.map((seg, idx) => {
                const cfg = SEGMENT_CONFIG[seg.type];
                const energy = cfg.power * (seg.duration / 60);
                return (
                  <div key={seg.id} className="flex items-center gap-2 px-3 py-2 rounded-sm"
                    style={{ background: "oklch(0.12 0.018 240)", border: `1px solid ${cfg.color.replace(")", " / 0.2)")}` }}>
                    <span style={{ color: cfg.color, fontSize: 12, width: 14 }}>{cfg.icon}</span>
                    <div className="flex-1">
                      <div className="label-caps text-xs" style={{ color: cfg.color }}>{cfg.label}</div>
                      <div className="text-xs" style={{ color: "oklch(0.50 0.015 240)", fontFamily: "'JetBrains Mono'" }}>
                        {seg.duration} min · {cfg.power} kW · {energy.toFixed(2)} kWh
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moveSegment(seg.id, -1)} disabled={idx === 0}
                        className="px-1.5 py-0.5 rounded text-xs" style={{ color: "oklch(0.45 0.015 240)", background: "oklch(0.16 0.018 240)" }}>▲</button>
                      <button onClick={() => moveSegment(seg.id, 1)} disabled={idx === segments.length - 1}
                        className="px-1.5 py-0.5 rounded text-xs" style={{ color: "oklch(0.45 0.015 240)", background: "oklch(0.16 0.018 240)" }}>▼</button>
                      <button onClick={() => removeSegment(seg.id)}
                        className="px-1.5 py-0.5 rounded text-xs" style={{ color: "oklch(0.65 0.22 25)", background: "oklch(0.16 0.018 240)" }}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add segment */}
            <div className="pt-3" style={{ borderTop: "1px solid oklch(0.18 0.015 240)" }}>
              <div className="label-caps mb-2">Add Segment</div>
              <div className="flex gap-2 mb-2">
                {(Object.keys(SEGMENT_CONFIG) as Segment["type"][]).map(t => (
                  <button key={t} onClick={() => setAddType(t)}
                    className="flex-1 py-1.5 rounded-sm text-xs transition-all"
                    style={{
                      fontFamily: "'JetBrains Mono'",
                      background: addType === t ? `${SEGMENT_CONFIG[t].color.replace(")", " / 0.15)")}` : "oklch(0.16 0.018 240)",
                      border: `1px solid ${addType === t ? SEGMENT_CONFIG[t].color.replace(")", " / 0.5)") : "oklch(0.22 0.015 240)"}`,
                      color: addType === t ? SEGMENT_CONFIG[t].color : "oklch(0.45 0.015 240)",
                    }}>{SEGMENT_CONFIG[t].icon}</button>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="label-caps">Duration</span>
                    <span className="data-value text-xs" style={{ color: SEGMENT_CONFIG[addType].color }}>{addDuration} min</span>
                  </div>
                  <input type="range" min={0.5} max={20} step={0.5} value={addDuration}
                    onChange={e => setAddDuration(parseFloat(e.target.value))}
                    className="w-full" style={{ accentColor: SEGMENT_CONFIG[addType].color }} />
                </div>
                <button onClick={addSegment}
                  className="px-4 py-2 rounded-sm label-caps transition-all"
                  style={{
                    background: `${SEGMENT_CONFIG[addType].color.replace(")", " / 0.15)")}`,
                    border: `1px solid ${SEGMENT_CONFIG[addType].color.replace(")", " / 0.4)")}`,
                    color: SEGMENT_CONFIG[addType].color,
                  }}>ADD</button>
              </div>
            </div>
          </div>

          {/* Summary metrics */}
          <div className="bg-navy-surface panel-border rounded-sm p-5">
            <div className="label-caps mb-3">Energy Budget Summary</div>
            <div className="space-y-0">
              {[
                { label: "Total Flight Time", value: `${totalFlightTime.toFixed(1)} min`, color: "oklch(0.88 0.005 240)" },
                { label: "Energy Used", value: `${totalEnergy.toFixed(1)} kWh`, color: exceedsUsable ? "oklch(0.65 0.22 25)" : "oklch(0.75 0.18 200)" },
                { label: "Battery Capacity", value: `${BATTERY_KWH} kWh`, color: "oklch(0.65 0.015 240)" },
                { label: "Usable (85%)", value: `${USABLE_KWH.toFixed(1)} kWh`, color: "oklch(0.65 0.015 240)" },
                { label: "Final SoC", value: `${finalSoC.toFixed(1)}%`, color: finalSoC < 15 ? "oklch(0.65 0.22 25)" : finalSoC < 30 ? "oklch(0.72 0.16 80)" : "oklch(0.65 0.18 145)" },
                { label: "Hover Reserve", value: `${remainingHover.toFixed(0)} min`, color: remainingHover < 5 ? "oklch(0.65 0.22 25)" : "oklch(0.65 0.18 145)" },
                { label: "Avg Power Draw", value: `${totalFlightTime > 0 ? (totalEnergy / (totalFlightTime / 60)).toFixed(0) : 0} kW`, color: "oklch(0.72 0.16 80)" },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}>
                  <span className="label-caps">{label}</span>
                  <span className="data-value text-sm" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SoC chart */}
        <div className="space-y-4">
          <div className="bg-navy-surface panel-border rounded-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="label-caps">Battery State of Charge</div>
              <div className="label-caps" style={{ color: "oklch(0.45 0.015 240)" }}>% over mission time (min)</div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={points} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="soc-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.75 0.18 200)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.75 0.18 200)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.18 0.015 240)" />
                <XAxis dataKey="time"
                  tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.45 0.015 240)" }}
                  axisLine={false} tickLine={false}
                  label={{ value: "Time (min)", position: "insideBottom", offset: -2, style: { fontFamily: "'Rajdhani'", fontSize: 10, fill: "oklch(0.40 0.015 240)" } }}
                />
                <YAxis domain={[0, 100]}
                  tick={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.45 0.015 240)" }}
                  axisLine={false} tickLine={false}
                  label={{ value: "SoC (%)", angle: -90, position: "insideLeft", style: { fontFamily: "'Rajdhani'", fontSize: 10, fill: "oklch(0.40 0.015 240)" } }}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* Reserve threshold */}
                <ReferenceLine y={BATTERY_RESERVE_PCT}
                  stroke="oklch(0.65 0.22 25 / 0.5)"
                  strokeDasharray="5 3"
                  label={{ value: `${BATTERY_RESERVE_PCT}% reserve`, position: "right", style: { fontFamily: "'JetBrains Mono'", fontSize: 8, fill: "oklch(0.65 0.22 25 / 0.7)" } }}
                />
                {/* 50% warning */}
                <ReferenceLine y={50}
                  stroke="oklch(0.72 0.16 80 / 0.3)"
                  strokeDasharray="3 4"
                />
                <Area dataKey="soc" name="SoC"
                  stroke="oklch(0.75 0.18 200)"
                  fill="url(#soc-grad)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Power breakdown by segment type */}
          <div className="bg-navy-surface panel-border rounded-sm p-5">
            <div className="label-caps mb-3">Power by Segment Type</div>
            <div className="space-y-2">
              {(Object.keys(SEGMENT_CONFIG) as Segment["type"][]).map(type => {
                const cfg = SEGMENT_CONFIG[type];
                const segs = segments.filter(s => s.type === type);
                const totalDur = segs.reduce((s, seg) => s + seg.duration, 0);
                const energy = cfg.power * (totalDur / 60);
                const pct = totalEnergy > 0 ? (energy / totalEnergy * 100) : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span style={{ color: cfg.color, width: 14, fontSize: 12 }}>{cfg.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="label-caps" style={{ color: cfg.color }}>{cfg.label}</span>
                        <span className="data-value text-xs" style={{ color: cfg.color }}>{energy.toFixed(2)} kWh</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "oklch(0.18 0.018 240)" }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                    </div>
                    <span className="data-value text-xs w-10 text-right" style={{ color: "oklch(0.45 0.015 240)" }}>{pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
