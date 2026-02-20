/* =============================================================
   COMPONENT: SensorFusionDiagram
   Design: Classified Aerospace Dossier
   Interactive SVG block diagram showing sensor data flow
   through Kalman filter into the four control layers.
   Hover a block → highlights its connections and shows latency.
   ============================================================= */
import { useState } from "react";

interface Block {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  layer: "sensor" | "fusion" | "control" | "output";
  latency: string;
  desc: string;
  connects: string[];
}

const BLOCKS: Block[] = [
  // ── Sensors ──────────────────────────────────────────────────
  {
    id: "imu1", label: "IMU ×3", sublabel: "9-DOF @ 1 kHz",
    x: 20, y: 30, w: 90, h: 36,
    color: "oklch(0.75 0.18 200)", layer: "sensor",
    latency: "< 1 ms", desc: "Triple redundant 9-DOF IMUs (accel + gyro + mag). Voted median output fed to Kalman filter at 1 kHz.",
    connects: ["kalman"],
  },
  {
    id: "gps", label: "RTK GPS", sublabel: "5 Hz, ±2 cm",
    x: 20, y: 90, w: 90, h: 36,
    color: "oklch(0.75 0.18 200)", layer: "sensor",
    latency: "200 ms", desc: "Dual-frequency RTK GNSS providing 2 cm absolute position. Low update rate — fused with IMU for high-rate estimate.",
    connects: ["kalman"],
  },
  {
    id: "baro", label: "Barometer ×2", sublabel: "50 Hz, ±0.5 m",
    x: 20, y: 150, w: 90, h: 36,
    color: "oklch(0.75 0.18 200)", layer: "sensor",
    latency: "20 ms", desc: "Dual barometric altimeters for redundant altitude measurement. Fused with LiDAR for low-altitude precision.",
    connects: ["kalman"],
  },
  {
    id: "lidar", label: "360° LiDAR", sublabel: "10 Hz, 0.1 m res",
    x: 20, y: 210, w: 90, h: 36,
    color: "oklch(0.75 0.18 200)", layer: "sensor",
    latency: "100 ms", desc: "360° rotating LiDAR for obstacle detection and terrain following. Also provides altitude aiding below 20 m.",
    connects: ["kalman", "l3"],
  },
  {
    id: "optflow", label: "Optical Flow ×2", sublabel: "200 Hz",
    x: 20, y: 270, w: 90, h: 36,
    color: "oklch(0.75 0.18 200)", layer: "sensor",
    latency: "5 ms", desc: "Dual downward-facing optical flow sensors for velocity estimation in GPS-denied environments.",
    connects: ["kalman"],
  },
  {
    id: "thermal", label: "Thermal Camera", sublabel: "9 Hz",
    x: 20, y: 330, w: 90, h: 36,
    color: "oklch(0.75 0.18 200)", layer: "sensor",
    latency: "110 ms", desc: "Motor and ESC temperature monitoring. Feeds directly to L0 safety layer for thermal runaway detection.",
    connects: ["l0"],
  },

  // ── Fusion ───────────────────────────────────────────────────
  {
    id: "kalman", label: "Extended Kalman Filter", sublabel: "500 Hz state estimate",
    x: 165, y: 150, w: 110, h: 48,
    color: "oklch(0.65 0.18 145)", layer: "fusion",
    latency: "2 ms", desc: "18-state EKF fusing all sensor inputs into a single high-rate state estimate: position, velocity, attitude, angular rates, and biases.",
    connects: ["l1", "l2"],
  },

  // ── Control layers ───────────────────────────────────────────
  {
    id: "l3", label: "L3 · Repulsion Nav", sublabel: "10–30 Hz",
    x: 335, y: 30, w: 110, h: 48,
    color: "oklch(0.60 0.15 280)", layer: "control",
    latency: "33–100 ms", desc: "Synthetic potential field navigation. Generates obstacle-avoidance trajectories and enforces UFO aesthetic constraints (no tilt > 5°, no banking).",
    connects: ["l2"],
  },
  {
    id: "l2", label: "L2 · Velocity Shaping", sublabel: "50–100 Hz",
    x: 335, y: 120, w: 110, h: 48,
    color: "oklch(0.60 0.15 280)", layer: "control",
    latency: "10–20 ms", desc: "Jerk-limited trajectory shaping, wind compensation, flat-glide enforcement, and snap-stop deceleration profiling.",
    connects: ["l1"],
  },
  {
    id: "l1", label: "L1 · Attitude / Thrust", sublabel: "200–500 Hz",
    x: 335, y: 210, w: 110, h: 48,
    color: "oklch(0.60 0.15 280)", layer: "control",
    latency: "2–5 ms", desc: "IMU-based attitude hold, per-fan throttle allocation, and vectoring vane angle commands. Runs on FPGA for deterministic timing.",
    connects: ["l0", "mixer"],
  },
  {
    id: "l0", label: "L0 · Safety / Limits", sublabel: "Always-on",
    x: 335, y: 300, w: 110, h: 48,
    color: "oklch(0.65 0.22 25)", layer: "control",
    latency: "< 1 ms", desc: "Hardware-level safety monitor. Enforces tilt limits, thermal cutoffs, battery low-voltage, and emergency descent. Cannot be overridden by software.",
    connects: ["mixer"],
  },

  // ── Output ───────────────────────────────────────────────────
  {
    id: "mixer", label: "Fan Mixer", sublabel: "16 channels × 500 Hz",
    x: 505, y: 150, w: 100, h: 48,
    color: "oklch(0.72 0.16 80)", layer: "output",
    latency: "< 1 ms", desc: "Allocates thrust commands to 16 fan ESCs and 32 vectoring vane servos. Applies saturation limits and fault-tolerance redistribution.",
    connects: ["fans", "vanes"],
  },
  {
    id: "fans", label: "16 Fan ESCs", sublabel: "PWM / DSHOT",
    x: 660, y: 110, w: 90, h: 36,
    color: "oklch(0.72 0.16 80)", layer: "output",
    latency: "< 2 ms", desc: "16 × 80A ESCs receiving DSHOT600 commands. Telemetry (RPM, current, temp) fed back to L0 safety monitor.",
    connects: [],
  },
  {
    id: "vanes", label: "32 Vane Servos", sublabel: "±25° @ 500 Hz",
    x: 660, y: 190, w: 90, h: 36,
    color: "oklch(0.72 0.16 80)", layer: "output",
    latency: "< 2 ms", desc: "32 digital servos controlling the annular exhaust vane segments. Bandwidth characterisation required to confirm 500 Hz command tracking.",
    connects: [],
  },
];

const LAYER_LABELS = [
  { x: 20, label: "SENSORS", color: "oklch(0.75 0.18 200)" },
  { x: 165, label: "FUSION", color: "oklch(0.65 0.18 145)" },
  { x: 335, label: "CONTROL STACK", color: "oklch(0.60 0.15 280)" },
  { x: 505, label: "ALLOCATION", color: "oklch(0.72 0.16 80)" },
  { x: 660, label: "ACTUATORS", color: "oklch(0.72 0.16 80)" },
];

// Build connection list
const CONNECTIONS: { from: string; to: string }[] = [];
BLOCKS.forEach(b => b.connects.forEach(t => CONNECTIONS.push({ from: b.id, to: t })));

function getBlockById(id: string) { return BLOCKS.find(b => b.id === id); }

function getCenter(b: Block) { return { x: b.x + b.w / 2, y: b.y + b.h / 2 }; }

function getEdgePoint(b: Block, toB: Block) {
  const bc = getCenter(b);
  const tc = getCenter(toB);
  if (tc.x > bc.x) return { x: b.x + b.w, y: bc.y };
  if (tc.x < bc.x) return { x: b.x, y: bc.y };
  if (tc.y > bc.y) return { x: bc.x, y: b.y + b.h };
  return { x: bc.x, y: b.y };
}

export default function SensorFusionDiagram() {
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeBlock = BLOCKS.find(b => b.id === activeId);

  const isHighlighted = (id: string) => {
    if (!activeId) return false;
    if (id === activeId) return true;
    const active = BLOCKS.find(b => b.id === activeId);
    if (!active) return false;
    return active.connects.includes(id) || BLOCKS.some(b => b.id === id && b.connects.includes(activeId));
  };

  const isConnHighlighted = (from: string, to: string) => {
    if (!activeId) return false;
    return from === activeId || to === activeId;
  };

  const SVG_W = 780;
  const SVG_H = 420;

  return (
    <div className="space-y-6">
      <div className="bg-navy-surface panel-border rounded-sm p-4">
        <div className="label-caps mb-3">Avionics Data Flow — Click any block to inspect</div>
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full min-w-[600px]" style={{ maxHeight: 460 }}>
            <defs>
              <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="oklch(0.35 0.015 240)" />
              </marker>
              <marker id="arrow-hi" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M0,0 L6,3 L0,6 Z" fill="oklch(0.75 0.18 200)" />
              </marker>
              <radialGradient id="sf-bg" cx="50%" cy="50%" r="70%">
                <stop offset="0%" stopColor="oklch(0.14 0.020 240)" />
                <stop offset="100%" stopColor="oklch(0.10 0.022 240)" />
              </radialGradient>
            </defs>
            <rect x={0} y={0} width={SVG_W} height={SVG_H} fill="url(#sf-bg)" />

            {/* Layer column headers */}
            {LAYER_LABELS.map(l => (
              <text key={l.label} x={l.x + (l.label === "CONTROL STACK" ? 55 : l.label === "ACTUATORS" ? 45 : l.label === "ALLOCATION" ? 50 : l.label === "FUSION" ? 55 : 45)} y={14}
                textAnchor="middle"
                style={{ fontFamily: "'Rajdhani'", fontSize: 9, fontWeight: 700, fill: l.color, letterSpacing: "0.10em" }}>
                {l.label}
              </text>
            ))}

            {/* Vertical column separators */}
            {[160, 330, 500, 655].map(x => (
              <line key={x} x1={x} y1={20} x2={x} y2={SVG_H - 10}
                stroke="oklch(0.18 0.015 240)" strokeWidth="1" strokeDasharray="3 5" />
            ))}

            {/* Connections */}
            {CONNECTIONS.map(({ from, to }) => {
              const fromB = getBlockById(from);
              const toB = getBlockById(to);
              if (!fromB || !toB) return null;
              const start = getEdgePoint(fromB, toB);
              const end = getEdgePoint(toB, fromB);
              const hi = isConnHighlighted(from, to);
              const mx = (start.x + end.x) / 2;
              const path = `M ${start.x} ${start.y} C ${mx} ${start.y} ${mx} ${end.y} ${end.x} ${end.y}`;
              return (
                <path key={`${from}-${to}`}
                  d={path}
                  fill="none"
                  stroke={hi ? "oklch(0.75 0.18 200)" : "oklch(0.28 0.015 240)"}
                  strokeWidth={hi ? 2 : 1}
                  strokeDasharray={hi ? "none" : "4 3"}
                  markerEnd={hi ? "url(#arrow-hi)" : "url(#arrow)"}
                  opacity={activeId && !hi ? 0.2 : 1}
                />
              );
            })}

            {/* Blocks */}
            {BLOCKS.map(b => {
              const hi = isHighlighted(b.id);
              const dimmed = activeId && !hi;
              return (
                <g key={b.id}
                  onClick={() => setActiveId(activeId === b.id ? null : b.id)}
                  style={{ cursor: "pointer", opacity: dimmed ? 0.3 : 1, transition: "opacity 0.2s" }}>
                  {/* Glow */}
                  {hi && (
                    <rect x={b.x - 3} y={b.y - 3} width={b.w + 6} height={b.h + 6} rx={5}
                      fill={`${b.color.replace(")", " / 0.12)")}`}
                      style={{ filter: "blur(4px)" }} />
                  )}
                  {/* Block */}
                  <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={3}
                    fill={`${b.color.replace(")", " / 0.10)")}`}
                    stroke={hi ? b.color : `${b.color.replace(")", " / 0.35)")}`}
                    strokeWidth={hi ? 1.5 : 1}
                  />
                  {/* Label */}
                  <text x={b.x + b.w / 2} y={b.y + b.h / 2 - 5}
                    textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: "'Rajdhani'", fontSize: 9, fontWeight: 700, fill: hi ? b.color : "oklch(0.80 0 0)", letterSpacing: "0.04em", pointerEvents: "none" }}>
                    {b.label}
                  </text>
                  <text x={b.x + b.w / 2} y={b.y + b.h / 2 + 8}
                    textAnchor="middle" dominantBaseline="middle"
                    style={{ fontFamily: "'JetBrains Mono'", fontSize: 7, fill: `${b.color.replace(")", " / 0.7)")}`, pointerEvents: "none" }}>
                    {b.sublabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Detail panel */}
      {activeBlock ? (
        <div className="bg-navy-surface panel-border rounded-sm p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div style={{ width: 8, height: 8, borderRadius: 2, background: activeBlock.color }} />
                <div className="label-caps" style={{ color: activeBlock.color }}>{activeBlock.label}</div>
                <span className="label-caps px-2 py-0.5 rounded-sm" style={{ background: `${activeBlock.color.replace(")", " / 0.10)")}`, color: activeBlock.color, border: `1px solid ${activeBlock.color.replace(")", " / 0.3)")}`, fontSize: 9 }}>
                  {activeBlock.layer.toUpperCase()}
                </span>
              </div>
              <div className="text-xs" style={{ color: "oklch(0.50 0.015 240)", fontFamily: "'JetBrains Mono'" }}>{activeBlock.sublabel}</div>
            </div>
            <div className="text-right">
              <div className="label-caps" style={{ color: "oklch(0.45 0.015 240)" }}>Latency</div>
              <div className="data-value text-sm" style={{ color: activeBlock.color }}>{activeBlock.latency}</div>
            </div>
          </div>
          <p className="text-sm leading-relaxed mb-4" style={{ color: "oklch(0.65 0.008 240)", fontFamily: "'Inter'" }}>{activeBlock.desc}</p>
          <div className="flex gap-6">
            {activeBlock.connects.length > 0 && (
              <div>
                <div className="label-caps mb-1">Outputs to</div>
                <div className="flex gap-2 flex-wrap">
                  {activeBlock.connects.map(cid => {
                    const cb = getBlockById(cid);
                    if (!cb) return null;
                    return (
                      <button key={cid} onClick={() => setActiveId(cid)}
                        className="px-2 py-1 rounded-sm label-caps text-xs transition-all"
                        style={{ background: `${cb.color.replace(")", " / 0.10)")}`, color: cb.color, border: `1px solid ${cb.color.replace(")", " / 0.3)")}` }}>
                        {cb.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {(() => {
              const inboundIds = BLOCKS.filter(b => b.connects.includes(activeBlock.id)).map(b => b.id);
              if (inboundIds.length === 0) return null;
              return (
                <div>
                  <div className="label-caps mb-1">Receives from</div>
                  <div className="flex gap-2 flex-wrap">
                    {inboundIds.map(iid => {
                      const ib = getBlockById(iid);
                      if (!ib) return null;
                      return (
                        <button key={iid} onClick={() => setActiveId(iid)}
                          className="px-2 py-1 rounded-sm label-caps text-xs transition-all"
                          style={{ background: `${ib.color.replace(")", " / 0.10)")}`, color: ib.color, border: `1px solid ${ib.color.replace(")", " / 0.3)")}` }}>
                          {ib.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Sensor Inputs", count: BLOCKS.filter(b => b.layer === "sensor").length, color: "oklch(0.75 0.18 200)" },
            { label: "Fusion Nodes", count: BLOCKS.filter(b => b.layer === "fusion").length, color: "oklch(0.65 0.18 145)" },
            { label: "Control Layers", count: BLOCKS.filter(b => b.layer === "control").length, color: "oklch(0.60 0.15 280)" },
            { label: "Actuator Groups", count: BLOCKS.filter(b => b.layer === "output").length, color: "oklch(0.72 0.16 80)" },
          ].map(({ label, count, color }) => (
            <div key={label} className="bg-navy-surface panel-border rounded-sm p-4 text-center">
              <div className="label-caps mb-1">{label}</div>
              <div className="data-value text-3xl" style={{ color }}>{count}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
