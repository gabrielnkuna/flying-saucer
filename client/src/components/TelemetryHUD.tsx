/* =============================================================
   COMPONENT: TelemetryHUD
   Design: Classified Aerospace Dossier
   Simulated real-time ground station telemetry HUD.
   Animated gauges, fan RPM ring, attitude indicator,
   battery SoC, and scrolling telemetry log.
   ============================================================= */
import { useState, useEffect, useRef, useCallback } from "react";

// ── Simulation state ──────────────────────────────────────────
interface TelState {
  altitude: number;      // m
  speed: number;         // m/s
  heading: number;       // deg
  pitch: number;         // deg
  roll: number;          // deg
  soc: number;           // %
  power: number;         // kW
  fanRpm: number[];      // 16 fans
  mode: string;
  gpsLock: boolean;
  ekfHealth: number;     // 0–100
  windSpeed: number;     // m/s
  windDir: number;       // deg
  uptime: number;        // s
}

const MODES = ["HOVER", "FLAT-GLIDE", "SNAP-STOP", "BURST", "POSITION HOLD", "RETURN"];
const MODE_COLORS: Record<string, string> = {
  "HOVER": "oklch(0.65 0.18 145)",
  "FLAT-GLIDE": "oklch(0.75 0.18 200)",
  "SNAP-STOP": "oklch(0.65 0.22 25)",
  "BURST": "oklch(0.62 0.25 20)",
  "POSITION HOLD": "oklch(0.65 0.18 145)",
  "RETURN": "oklch(0.72 0.16 80)",
};

function initState(): TelState {
  return {
    altitude: 3.5,
    speed: 0,
    heading: 47,
    pitch: 0.3,
    roll: 0.2,
    soc: 87,
    power: 220,
    fanRpm: Array(16).fill(0).map(() => 4200 + Math.random() * 200),
    mode: "HOVER",
    gpsLock: true,
    ekfHealth: 98,
    windSpeed: 2.1,
    windDir: 135,
    uptime: 0,
  };
}

function clamp(v: number, min: number, max: number) { return Math.max(min, Math.min(max, v)); }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

interface LogEntry { t: number; msg: string; level: "info" | "warn" | "error" }

// ── Gauge helpers ─────────────────────────────────────────────
function ArcGauge({ value, min, max, label, unit, color, size = 100 }: {
  value: number; min: number; max: number; label: string; unit: string; color: string; size?: number;
}) {
  const pct = (value - min) / (max - min);
  const startAngle = -210;
  const sweepAngle = 240;
  const angle = startAngle + pct * sweepAngle;
  const r = size * 0.38;
  const cx = size / 2, cy = size / 2;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const arcPath = (start: number, end: number, radius: number) => {
    const s = { x: cx + radius * Math.cos(toRad(start)), y: cy + radius * Math.sin(toRad(start)) };
    const e = { x: cx + radius * Math.cos(toRad(end)), y: cy + radius * Math.sin(toRad(end)) };
    const large = Math.abs(end - start) > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };
  const needleX = cx + r * 0.85 * Math.cos(toRad(angle));
  const needleY = cy + r * 0.85 * Math.sin(toRad(angle));
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {/* Track */}
      <path d={arcPath(startAngle, startAngle + sweepAngle, r)} fill="none"
        stroke="oklch(0.18 0.018 240)" strokeWidth={size * 0.06} strokeLinecap="round" />
      {/* Fill */}
      <path d={arcPath(startAngle, startAngle + pct * sweepAngle, r)} fill="none"
        stroke={color} strokeWidth={size * 0.06} strokeLinecap="round" />
      {/* Needle */}
      <line x1={cx} y1={cy} x2={needleX} y2={needleY}
        stroke={color} strokeWidth={size * 0.025} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={size * 0.04} fill={color} />
      {/* Value */}
      <text x={cx} y={cy + size * 0.16} textAnchor="middle"
        style={{ fontFamily: "'JetBrains Mono'", fontSize: size * 0.16, fontWeight: 700, fill: color }}>
        {value.toFixed(value < 10 ? 1 : 0)}
      </text>
      <text x={cx} y={cy + size * 0.28} textAnchor="middle"
        style={{ fontFamily: "'JetBrains Mono'", fontSize: size * 0.09, fill: "oklch(0.45 0.015 240)" }}>
        {unit}
      </text>
      <text x={cx} y={cy + size * 0.42} textAnchor="middle"
        style={{ fontFamily: "'Rajdhani'", fontSize: size * 0.09, fontWeight: 700, letterSpacing: "0.06em", fill: "oklch(0.45 0.015 240)" }}>
        {label}
      </text>
    </svg>
  );
}

function AttitudeIndicator({ pitch, roll, size = 100 }: { pitch: number; roll: number; size: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.42;
  const pitchPx = clamp(pitch * (size * 0.04), -r * 0.8, r * 0.8);
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      <defs>
        <clipPath id="adi-clip">
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      {/* Sky */}
      <g clipPath="url(#adi-clip)" transform={`rotate(${-roll}, ${cx}, ${cy})`}>
        <rect x={cx - r} y={cy - r - pitchPx} width={r * 2} height={r * 2}
          fill="oklch(0.25 0.08 240)" />
        {/* Ground */}
        <rect x={cx - r} y={cy - pitchPx} width={r * 2} height={r * 2}
          fill="oklch(0.30 0.06 60)" />
        {/* Horizon line */}
        <line x1={cx - r} y1={cy - pitchPx} x2={cx + r} y2={cy - pitchPx}
          stroke="oklch(0.75 0.18 200)" strokeWidth={1.5} />
      </g>
      {/* Bezel */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="oklch(0.28 0.015 240)" strokeWidth={2} />
      {/* Fixed crosshair */}
      <line x1={cx - r * 0.6} y1={cy} x2={cx - r * 0.2} y2={cy} stroke="oklch(0.75 0.18 200)" strokeWidth={2} strokeLinecap="round" />
      <line x1={cx + r * 0.2} y1={cy} x2={cx + r * 0.6} y2={cy} stroke="oklch(0.75 0.18 200)" strokeWidth={2} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={2} fill="oklch(0.75 0.18 200)" />
      {/* Labels */}
      <text x={cx} y={size - 4} textAnchor="middle"
        style={{ fontFamily: "'Rajdhani'", fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", fill: "oklch(0.45 0.015 240)" }}>
        ATTITUDE
      </text>
    </svg>
  );
}

function FanRing({ rpms, size = 200 }: { rpms: number[]; size: number }) {
  const cx = size / 2, cy = size / 2;
  const r = size * 0.38;
  const maxRpm = 5000;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      <circle cx={cx} cy={cy} r={r * 0.55} fill="oklch(0.12 0.018 240)" stroke="oklch(0.22 0.015 240)" strokeWidth={1} />
      <text x={cx} y={cy - 6} textAnchor="middle" style={{ fontFamily: "'Rajdhani'", fontSize: 11, fontWeight: 700, fill: "oklch(0.55 0.015 240)", letterSpacing: "0.06em" }}>FAN RPM</text>
      <text x={cx} y={cy + 8} textAnchor="middle" style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, fill: "oklch(0.45 0.015 240)" }}>16 MODULES</text>
      {rpms.map((rpm, i) => {
        const angle = (i / rpms.length) * 2 * Math.PI - Math.PI / 2;
        const pct = rpm / maxRpm;
        const innerR = r * 0.62;
        const outerR = r * 0.62 + (r * 0.32) * pct;
        const w = (2 * Math.PI * r) / rpms.length * 0.55;
        const fanCx = cx + r * Math.cos(angle);
        const fanCy = cy + r * Math.sin(angle);
        const barColor = pct > 0.9 ? "oklch(0.65 0.22 25)" : pct > 0.75 ? "oklch(0.72 0.16 80)" : "oklch(0.75 0.18 200)";
        // Draw as a small rect rotated to angle
        const bx = cx + innerR * Math.cos(angle);
        const by = cy + innerR * Math.sin(angle);
        const ex = cx + outerR * Math.cos(angle);
        const ey = cy + outerR * Math.sin(angle);
        return (
          <g key={i}>
            <line x1={bx} y1={by} x2={ex} y2={ey}
              stroke={barColor} strokeWidth={5} strokeLinecap="round" opacity={0.85} />
            <circle cx={fanCx} cy={fanCy} r={3}
              fill={barColor} opacity={0.4} />
          </g>
        );
      })}
    </svg>
  );
}

export default function TelemetryHUD() {
  const [running, setRunning] = useState(false);
  const [state, setState] = useState<TelState>(initState());
  const [log, setLog] = useState<LogEntry[]>([
    { t: 0, msg: "System initialised — all subsystems nominal", level: "info" },
    { t: 1, msg: "EKF converged — position covariance 0.008 m²", level: "info" },
    { t: 2, msg: "RTK GPS fix acquired — 2.1 cm horizontal error", level: "info" },
  ]);
  const logRef = useRef<HTMLDivElement>(null);
  const tickRef = useRef(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  const addLog = useCallback((msg: string, level: LogEntry["level"] = "info") => {
    setLog(l => [...l.slice(-49), { t: stateRef.current.uptime, msg, level }]);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [log]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      tickRef.current++;
      const tick = tickRef.current;
      setState(prev => {
        const t = tick * 0.1;
        // Altitude: gentle oscillation
        const alt = clamp(prev.altitude + (Math.random() - 0.5) * 0.05, 2.5, 8.0);
        // Speed: mode-dependent
        const targetSpeed = prev.mode === "FLAT-GLIDE" ? 12 : prev.mode === "BURST" ? 22 : 0;
        const speed = lerp(prev.speed, targetSpeed + (Math.random() - 0.5) * 0.5, 0.05);
        // Heading drift
        const heading = (prev.heading + (Math.random() - 0.5) * 0.3 + 360) % 360;
        // Attitude: small oscillations
        const pitch = clamp(prev.pitch + (Math.random() - 0.5) * 0.1, -2, 2);
        const roll = clamp(prev.roll + (Math.random() - 0.5) * 0.1, -2, 2);
        // Battery drain
        const soc = clamp(prev.soc - 0.002, 0, 100);
        // Power: mode-dependent
        const targetPower = prev.mode === "BURST" ? 352 : prev.mode === "FLAT-GLIDE" ? 180 : 220;
        const power = lerp(prev.power, targetPower + (Math.random() - 0.5) * 5, 0.1);
        // Fan RPMs: slight variation
        const fanRpm = prev.fanRpm.map(r => clamp(r + (Math.random() - 0.5) * 30, 3800, 5000));
        // Mode cycling every ~15s
        let mode = prev.mode;
        if (tick % 150 === 0) {
          const idx = Math.floor(Math.random() * MODES.length);
          mode = MODES[idx];
        }
        // Wind
        const windSpeed = clamp(prev.windSpeed + (Math.random() - 0.5) * 0.1, 0, 12);
        const windDir = (prev.windDir + (Math.random() - 0.5) * 1 + 360) % 360;
        return { ...prev, altitude: alt, speed, heading, pitch, roll, soc, power, fanRpm, mode, windSpeed, windDir, uptime: prev.uptime + 0.1 };
      });

      // Occasional log messages
      if (tick % 50 === 0) addLog(`Attitude hold nominal — pitch ${stateRef.current.pitch.toFixed(2)}° roll ${stateRef.current.roll.toFixed(2)}°`);
      if (tick % 80 === 0) addLog(`Battery SoC ${stateRef.current.soc.toFixed(1)}% — estimated ${(stateRef.current.soc / 100 * 12.5).toFixed(1)} min remaining`);
      if (tick % 120 === 0) addLog(`Wind ${stateRef.current.windSpeed.toFixed(1)} m/s @ ${stateRef.current.windDir.toFixed(0)}° — compensation active`);
      if (tick % 150 === 0) addLog(`Flight mode → ${stateRef.current.mode}`, stateRef.current.mode === "SNAP-STOP" || stateRef.current.mode === "BURST" ? "warn" : "info");
      if (stateRef.current.soc < 20 && tick % 30 === 0) addLog("LOW BATTERY — return to base recommended", "warn");
    }, 100);
    return () => clearInterval(interval);
  }, [running, addLog]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const modeColor = MODE_COLORS[state.mode] || "oklch(0.65 0.18 145)";

  return (
    <div className="space-y-4">
      {/* HUD header bar */}
      <div className="flex items-center justify-between px-5 py-3 rounded-sm" style={{
        background: "oklch(0.10 0.022 240)",
        border: "1px solid oklch(0.20 0.015 240)",
      }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: running ? "oklch(0.65 0.18 145)" : "oklch(0.45 0.015 240)" }} />
            <span className="label-caps" style={{ color: running ? "oklch(0.65 0.18 145)" : "oklch(0.45 0.015 240)" }}>
              {running ? "LIVE TELEMETRY" : "STANDBY"}
            </span>
          </div>
          <span className="data-value text-xs" style={{ color: "oklch(0.40 0.015 240)" }}>AURORA-01</span>
          <span className="data-value text-xs" style={{ color: "oklch(0.40 0.015 240)" }}>T+{formatTime(state.uptime)}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="label-caps px-3 py-1 rounded-sm" style={{
            background: `${modeColor.replace(")", " / 0.12)")}`,
            color: modeColor,
            border: `1px solid ${modeColor.replace(")", " / 0.40)")}`,
          }}>{state.mode}</span>
          <button onClick={() => setRunning(r => !r)}
            className="px-4 py-1.5 rounded-sm label-caps text-xs transition-all"
            style={{
              background: running ? "oklch(0.65 0.22 25 / 0.15)" : "oklch(0.65 0.18 145 / 0.15)",
              color: running ? "oklch(0.65 0.22 25)" : "oklch(0.65 0.18 145)",
              border: `1px solid ${running ? "oklch(0.65 0.22 25 / 0.40)" : "oklch(0.65 0.18 145 / 0.40)"}`,
            }}>
            {running ? "■ STOP" : "▶ START"}
          </button>
        </div>
      </div>

      {/* Main HUD grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Gauges row */}
        <div className="bg-navy-surface panel-border rounded-sm p-3 flex flex-col items-center">
          <ArcGauge value={state.altitude} min={0} max={10} label="ALTITUDE" unit="m" color="oklch(0.75 0.18 200)" size={110} />
        </div>
        <div className="bg-navy-surface panel-border rounded-sm p-3 flex flex-col items-center">
          <ArcGauge value={state.speed} min={0} max={25} label="SPEED" unit="m/s" color="oklch(0.65 0.18 145)" size={110} />
        </div>
        <div className="bg-navy-surface panel-border rounded-sm p-3 flex flex-col items-center">
          <ArcGauge value={state.power} min={0} max={400} label="POWER" unit="kW" color="oklch(0.72 0.16 80)" size={110} />
        </div>
        <div className="bg-navy-surface panel-border rounded-sm p-3 flex flex-col items-center">
          <ArcGauge value={state.soc} min={0} max={100} label="BATTERY" unit="%" color={state.soc < 20 ? "oklch(0.65 0.22 25)" : "oklch(0.65 0.18 145)"} size={110} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Attitude indicator */}
        <div className="bg-navy-surface panel-border rounded-sm p-4 flex flex-col items-center gap-3">
          <AttitudeIndicator pitch={state.pitch} roll={state.roll} size={140} />
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="text-center">
              <div className="label-caps" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>PITCH</div>
              <div className="data-value text-lg" style={{ color: "oklch(0.75 0.18 200)" }}>{state.pitch.toFixed(2)}°</div>
            </div>
            <div className="text-center">
              <div className="label-caps" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>ROLL</div>
              <div className="data-value text-lg" style={{ color: "oklch(0.75 0.18 200)" }}>{state.roll.toFixed(2)}°</div>
            </div>
          </div>
        </div>

        {/* Fan RPM ring */}
        <div className="bg-navy-surface panel-border rounded-sm p-4 flex flex-col items-center gap-2">
          <FanRing rpms={state.fanRpm} size={180} />
          <div className="grid grid-cols-2 gap-4 w-full">
            <div className="text-center">
              <div className="label-caps" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>AVG RPM</div>
              <div className="data-value text-lg" style={{ color: "oklch(0.75 0.18 200)" }}>
                {Math.round(state.fanRpm.reduce((a, b) => a + b, 0) / state.fanRpm.length)}
              </div>
            </div>
            <div className="text-center">
              <div className="label-caps" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>MAX RPM</div>
              <div className="data-value text-lg" style={{ color: "oklch(0.72 0.16 80)" }}>
                {Math.round(Math.max(...state.fanRpm))}
              </div>
            </div>
          </div>
        </div>

        {/* Status + wind */}
        <div className="bg-navy-surface panel-border rounded-sm p-4 space-y-3">
          <div className="label-caps mb-2">System Status</div>
          {[
            { label: "GPS RTK", value: state.gpsLock ? "LOCKED" : "NO FIX", color: state.gpsLock ? "oklch(0.65 0.18 145)" : "oklch(0.65 0.22 25)" },
            { label: "EKF Health", value: `${state.ekfHealth}%`, color: "oklch(0.65 0.18 145)" },
            { label: "Heading", value: `${state.heading.toFixed(0)}°`, color: "oklch(0.75 0.18 200)" },
            { label: "Wind", value: `${state.windSpeed.toFixed(1)} m/s @ ${state.windDir.toFixed(0)}°`, color: "oklch(0.72 0.16 80)" },
            { label: "Mode", value: state.mode, color: modeColor },
            { label: "Uptime", value: formatTime(state.uptime), color: "oklch(0.55 0.015 240)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between py-1" style={{ borderBottom: "1px solid oklch(0.16 0.015 240)" }}>
              <span className="label-caps" style={{ fontSize: 9, color: "oklch(0.40 0.015 240)" }}>{label}</span>
              <span className="data-value text-xs" style={{ color, fontFamily: "'JetBrains Mono'" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Telemetry log */}
      <div className="bg-navy-surface panel-border rounded-sm p-4">
        <div className="label-caps mb-2">Telemetry Log</div>
        <div ref={logRef} className="overflow-y-auto space-y-0.5" style={{ maxHeight: 160, fontFamily: "'JetBrains Mono'", fontSize: 10 }}>
          {log.map((entry, i) => (
            <div key={i} className="flex items-start gap-3 py-0.5">
              <span style={{ color: "oklch(0.35 0.015 240)", flexShrink: 0 }}>T+{formatTime(entry.t)}</span>
              <span style={{ color: entry.level === "error" ? "oklch(0.65 0.22 25)" : entry.level === "warn" ? "oklch(0.72 0.16 80)" : "oklch(0.55 0.008 240)" }}>
                {entry.level !== "info" && <span style={{ color: entry.level === "warn" ? "oklch(0.72 0.16 80)" : "oklch(0.65 0.22 25)" }}>[{entry.level.toUpperCase()}] </span>}
                {entry.msg}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
