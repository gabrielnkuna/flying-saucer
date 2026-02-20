/* =============================================================
   COMPONENT: Storyboard
   Design: Classified Aerospace Dossier
   8-shot demo storyboard from Step 18
   ============================================================= */
import { useState } from "react";

const SHOTS = [
  {
    n: 1,
    name: "Establishing Hover",
    camera: "Wide, low angle (knee height), 24–35mm",
    action: "Saucer already hovering, perfectly level, slight micro-stabilization",
    sell: "Pinned in space — no wobble, no tilt",
    hide: "Keep ground texture simple (short grass / compact surface)",
    duration: "5–8 s",
    color: "oklch(0.65 0.18 145)",
  },
  {
    n: 2,
    name: "Underside Reveal",
    camera: "Medium close, slightly off-center under rim",
    action: "Slow drift toward camera, then stop",
    sell: "Annular ring + segmentation hints — looks like a field boundary",
    hide: "Avoid strong dust cones; shoot higher off ground",
    duration: "4–6 s",
    color: "oklch(0.75 0.18 200)",
  },
  {
    n: 3,
    name: "Top-Down Beauty",
    camera: "Top-down or high oblique (drone/jib), slow push-in",
    action: "Saucer holds position; lights/panel seams visible",
    sell: "Design credibility — industrial detail reads as real machine",
    hide: "Keep calm — no aggressive motion here",
    duration: "5–7 s",
    color: "oklch(0.72 0.16 80)",
  },
  {
    n: 4,
    name: "Flat Glide (Signature)",
    camera: "Wide tracking shot from side (pan/vehicle follow)",
    action: "Saucer slides laterally without turning into the motion",
    sell: "It moved sideways without leaning",
    hide: "Keep yaw nearly fixed; motion feels like pulled on rails",
    duration: "6–8 s",
    color: "oklch(0.75 0.18 200)",
  },
  {
    n: 5,
    name: "Snap-Stop",
    camera: "Medium wide, side-on",
    action: "Saucer glides, then stops smoothly (jerk-limited), remains level",
    sell: "Inertia got damped",
    hide: "No dramatic pitch forward — if it pitches, the illusion collapses",
    duration: "4–5 s",
    color: "oklch(0.65 0.22 25)",
  },
  {
    n: 6,
    name: "Low Pass",
    camera: "Ground-level, looking across the field; foreground grass blurred",
    action: "Saucer passes low and fast-ish, stays level",
    sell: "Speed + stability = uncanny",
    hide: "Don't go too low over dust; avoid loose debris",
    duration: "3–4 s",
    color: "oklch(0.72 0.16 80)",
  },
  {
    n: 7,
    name: "Mechanical Credibility",
    camera: "Tight detail on rim/segments/fan bays (macro feel)",
    action: "Very subtle segment actuation, lights steady",
    sell: "Complex system — not a toy",
    hide: "Avoid obvious thrust pulsing — keep smooth and distributed",
    duration: "4–5 s",
    color: "oklch(0.60 0.15 280)",
  },
  {
    n: 8,
    name: "Hero Hover + Exit",
    camera: "Wide, centered, symmetrical",
    action: "Saucer hovers → gentle lateral slide → slow descent/land",
    sell: "Calm, deliberate, field controlled",
    hide: "Keep sound/lighting steady; no frantic corrections",
    duration: "8–10 s",
    color: "oklch(0.65 0.18 145)",
  },
];

const RULES = [
  { rule: "No yaw-to-velocity coupling", detail: "Don't point where you go — that screams pilot" },
  { rule: "Minimal tilt", detail: "Flat glide is your main flex — tilt = aircraft logic" },
  { rule: "Smooth accel changes", detail: "Jerk-limited: onset/offset should feel soft but strong" },
];

const DIRECTOR_NOTES = [
  { label: "Lighting", value: "Golden hour / overcast — metal reads premium, shadows soft" },
  { label: "Atmosphere", value: "Mild haze helps scale; avoid dust clouds" },
  { label: "Ring glow", value: "Steady or slow pulse only — fast pulses look like thrusters" },
  { label: "Sound", value: "Low steady hum, minimal pitch changes during maneuvers" },
];

export default function Storyboard() {
  const [selected, setSelected] = useState<number>(1);
  const shot = SHOTS.find(s => s.n === selected)!;

  return (
    <div className="space-y-6">
      {/* Shot grid */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {SHOTS.map(s => (
          <button
            key={s.n}
            onClick={() => setSelected(s.n)}
            className="rounded-sm p-2 text-center transition-all"
            style={{
              background: selected === s.n ? `${s.color.replace(')', ' / 0.15)')}` : "oklch(0.14 0.020 240)",
              border: `1px solid ${selected === s.n ? s.color.replace(')', ' / 0.5)') : 'oklch(0.22 0.015 240)'}`,
            }}
          >
            <div className="data-value text-xs" style={{ color: selected === s.n ? s.color : "oklch(0.45 0.015 240)" }}>
              {String(s.n).padStart(2, "0")}
            </div>
            <div className="label-caps mt-0.5" style={{ fontSize: 8, lineHeight: 1.2 }}>
              {s.name.split(" ")[0]}
            </div>
          </button>
        ))}
      </div>

      {/* Shot detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-navy-surface panel-border rounded-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
              style={{ background: `${shot.color.replace(')', ' / 0.15)')}`, border: `1px solid ${shot.color.replace(')', ' / 0.4)')}` }}>
              <span style={{ fontFamily: "'JetBrains Mono'", fontWeight: 600, fontSize: 14, color: shot.color }}>
                {String(shot.n).padStart(2, "0")}
              </span>
            </div>
            <div>
              <div className="text-base font-semibold" style={{ fontFamily: "'Rajdhani'", color: shot.color, letterSpacing: "0.08em" }}>
                {shot.name.toUpperCase()}
              </div>
              <div className="label-caps">{shot.duration}</div>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { label: "Camera", value: shot.camera },
              { label: "Action", value: shot.action },
              { label: "Sell", value: shot.sell, highlight: true },
              { label: "Hide", value: shot.hide },
            ].map(({ label, value, highlight }) => (
              <div key={label}>
                <div className="label-caps mb-1">{label}</div>
                <p className="text-sm" style={{
                  color: highlight ? shot.color : "oklch(0.70 0.008 240)",
                  fontFamily: "'Inter'",
                  lineHeight: 1.5,
                }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {/* UFO signature rules */}
          <div className="bg-navy-surface panel-border rounded-sm p-4">
            <div className="label-caps mb-3" style={{ color: "oklch(0.65 0.22 25)" }}>
              ⚠ UFO Signature Rules — Never Break These
            </div>
            <div className="space-y-3">
              {RULES.map(r => (
                <div key={r.rule} className="flex gap-3">
                  <div className="w-1 flex-shrink-0 rounded-full mt-1" style={{ background: "oklch(0.65 0.22 25 / 0.6)", height: 16 }} />
                  <div>
                    <div className="text-xs font-semibold" style={{ fontFamily: "'Rajdhani'", color: "oklch(0.85 0.005 240)", letterSpacing: "0.05em" }}>
                      {r.rule}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "oklch(0.55 0.008 240)", fontFamily: "'Inter'" }}>
                      {r.detail}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Director notes */}
          <div className="bg-navy-surface panel-border rounded-sm p-4">
            <div className="label-caps mb-3">Director Notes</div>
            <div className="space-y-2">
              {DIRECTOR_NOTES.map(n => (
                <div key={n.label} className="flex gap-3 items-start py-1.5" style={{ borderBottom: "1px solid oklch(0.18 0.015 240)" }}>
                  <span className="label-caps flex-shrink-0 w-20">{n.label}</span>
                  <span className="text-xs" style={{ color: "oklch(0.68 0.008 240)", fontFamily: "'Inter'" }}>{n.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
