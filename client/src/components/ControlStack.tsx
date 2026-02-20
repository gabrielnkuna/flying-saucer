/* =============================================================
   COMPONENT: ControlStack
   Design: Classified Aerospace Dossier
   4-layer control architecture diagram from Step 4
   ============================================================= */
import { useState } from "react";

const LAYERS = [
  {
    id: 0,
    label: "Layer 3",
    name: "Repulsion Field Navigation",
    rate: "10–30 Hz",
    color: "oklch(0.72 0.16 80)",
    purpose: "Generates motion commands that look like repulsion: hover target maintenance, obstacle repulsion behavior, level-first aesthetic constraints.",
    outputs: ["Desired velocity vector (v_x, v_y, v_z)", "Yaw heading command", "Obstacle avoidance bias"],
    inputs: ["GPS / optical flow position", "360° proximity sensor data", "Pilot intent commands"],
    desc: "Outer loop — the 'UFO style' layer. Implements the synthetic potential field that makes the craft appear repelled from obstacles and ground.",
  },
  {
    id: 1,
    label: "Layer 2",
    name: "Velocity / Acceleration Shaping",
    rate: "50–100 Hz",
    color: "oklch(0.75 0.18 200)",
    purpose: "Controls horizontal velocity and climb rate. Applies jerk limits so acceleration changes look smooth and field-driven, not thrust-braked.",
    outputs: ["Desired acceleration vector (a_cmd)", "Yaw heading (optional)"],
    inputs: ["Velocity setpoint from Layer 3", "IMU velocity estimate", "Jerk limit profile"],
    desc: "Mid loop — makes motion feel 'field-driven.' Jerk limiting is the key to the UFO aesthetic: smooth onset/offset of acceleration.",
  },
  {
    id: 2,
    label: "Layer 1",
    name: "Attitude / Thrust Stabilization",
    rate: "200–500 Hz",
    color: "oklch(0.65 0.18 145)",
    purpose: "Keeps the craft stable at all times. Holds roll/pitch/yaw rates near commanded values and regulates total lift.",
    outputs: ["F_z (vertical force)", "τ_x, τ_y, τ_z (roll/pitch/yaw torques)"],
    inputs: ["IMU rates + attitude", "Acceleration command from Layer 2", "Altitude sensor"],
    desc: "Inner loop — pure stabilization. Outputs are desired forces/torques, not fan speeds yet. Runs at maximum rate for fast disturbance rejection.",
  },
  {
    id: 3,
    label: "Layer 0",
    name: "Safety & Limits",
    rate: "Always-on",
    color: "oklch(0.65 0.22 25)",
    purpose: "Enforces hard limits on thrust, temperature, current, tilt, and descent rate. Keeps the system inside a safe flight envelope regardless of higher-layer commands.",
    outputs: ["Clamped force/torque commands", "Fan speed limits", "Emergency hold"],
    inputs: ["All sensor data", "All higher-layer outputs", "Hardware limits"],
    desc: "Lowest layer — always active, cannot be overridden. Acts as the physical safety net for all other layers.",
  },
];

export default function ControlStack() {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {LAYERS.map((layer) => {
        const isOpen = expanded === layer.id;
        return (
          <div
            key={layer.id}
            className="rounded-sm overflow-hidden"
            style={{
              border: `1px solid ${isOpen ? layer.color.replace(')', ' / 0.5)') : 'oklch(0.22 0.015 240)'}`,
              background: isOpen ? `${layer.color.replace(')', ' / 0.05)')}` : "oklch(0.14 0.020 240)",
              transition: "border-color 0.2s, background 0.2s",
            }}
          >
            {/* Header */}
            <button
              className="w-full flex items-center gap-4 p-4 text-left"
              onClick={() => setExpanded(isOpen ? null : layer.id)}
            >
              <div
                className="flex-shrink-0 w-2 h-8 rounded-full"
                style={{ background: layer.color, boxShadow: `0 0 8px ${layer.color}` }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="label-caps" style={{ color: layer.color }}>{layer.label}</span>
                  <span className="label-caps" style={{ color: "oklch(0.35 0.012 240)" }}>·</span>
                  <span className="label-caps">{layer.rate}</span>
                </div>
                <div className="text-sm font-semibold mt-0.5" style={{ fontFamily: "'Rajdhani'", color: "oklch(0.88 0.005 240)", letterSpacing: "0.05em" }}>
                  {layer.name}
                </div>
              </div>
              <div
                className="flex-shrink-0 text-xs transition-transform duration-200"
                style={{ color: "oklch(0.45 0.015 240)", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
              >
                ▼
              </div>
            </button>

            {/* Expanded content */}
            {isOpen && (
              <div className="px-4 pb-4 space-y-4">
                <div className="ring-glow-divider" style={{ background: `radial-gradient(ellipse at center, ${layer.color.replace(')', ' / 0.4)')} 0%, transparent 70%)` }} />

                <p className="text-sm leading-relaxed" style={{ color: "oklch(0.72 0.008 240)", fontFamily: "'Inter'" }}>
                  {layer.desc}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-sm p-3" style={{ background: "oklch(0.12 0.022 240)" }}>
                    <div className="label-caps mb-2" style={{ color: layer.color }}>Purpose</div>
                    <p className="text-xs leading-relaxed" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'" }}>
                      {layer.purpose}
                    </p>
                  </div>
                  <div className="rounded-sm p-3" style={{ background: "oklch(0.12 0.022 240)" }}>
                    <div className="label-caps mb-2">Inputs</div>
                    <ul className="space-y-1">
                      {layer.inputs.map(inp => (
                        <li key={inp} className="text-xs" style={{ color: "oklch(0.60 0.008 240)", fontFamily: "'JetBrains Mono'" }}>
                          · {inp}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-sm p-3" style={{ background: "oklch(0.12 0.022 240)" }}>
                    <div className="label-caps mb-2">Outputs</div>
                    <ul className="space-y-1">
                      {layer.outputs.map(out => (
                        <li key={out} className="text-xs" style={{ color: "oklch(0.60 0.008 240)", fontFamily: "'JetBrains Mono'" }}>
                          · {out}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Hard Limits card */}
      <div className="mt-6 rounded-sm p-4" style={{ background: "oklch(0.14 0.020 240)", border: "1px solid oklch(0.65 0.22 25 / 0.35)" }}>
        <div className="label-caps mb-3" style={{ color: "oklch(0.65 0.22 25)" }}>⚠ Layer 0 — Hard Limits (non-overridable)</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { param: "Max Body Tilt",      value: "12°",       note: "roll or pitch" },
            { param: "Max Lateral Accel",  value: "0.35 g",    note: "sustained" },
            { param: "Max Descent Rate",   value: "3 m/s",     note: "controlled" },
            { param: "Max Motor Temp",     value: "85 °C",     note: "winding" },
            { param: "Min Bus Voltage",    value: "42 V",      note: "20% SoC cutoff" },
            { param: "Max Burst Duration", value: "30 s",      note: "at 350 kW" },
          ].map(({ param, value, note }) => (
            <div key={param} className="rounded-sm px-3 py-2" style={{ background: "oklch(0.12 0.022 240)", border: "1px solid oklch(0.65 0.22 25 / 0.18)" }}>
              <div className="label-caps" style={{ fontSize: 8, color: "oklch(0.45 0.015 240)" }}>{param}</div>
              <div className="data-value text-sm" style={{ color: "oklch(0.65 0.22 25)" }}>{value}</div>
              <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "oklch(0.40 0.015 240)", marginTop: 2 }}>{note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Data flow arrows hint */}
      <div className="flex items-center gap-2 pt-2">
        <div className="label-caps">Data flow:</div>
        <div className="flex items-center gap-1">
          {["L3", "→", "L2", "→", "L1", "→", "L0", "→", "FANS"].map((s, i) => (
            <span key={i} className="data-value text-xs" style={{
              color: s === "→" ? "oklch(0.35 0.012 240)" :
                s === "L3" ? "oklch(0.72 0.16 80)" :
                s === "L2" ? "oklch(0.75 0.18 200)" :
                s === "L1" ? "oklch(0.65 0.18 145)" :
                s === "L0" ? "oklch(0.65 0.22 25)" :
                "oklch(0.55 0.015 240)"
            }}>
              {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
