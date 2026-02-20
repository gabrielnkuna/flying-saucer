/* =============================================================
   COMPONENT: FlightTimeline
   Design: Classified Aerospace Dossier
   Horizontal timeline scrubber that plays through the 8-shot
   storyboard sequence, animating a mini-saucer through each
   shot's motion profile automatically.
   ============================================================= */
import { useState, useEffect, useRef, useCallback } from "react";

// Each shot: duration (s), motion profile function (t in [0,1]) → {x, y, tilt, glow}
interface ShotProfile {
  n: number;
  name: string;
  duration: number; // seconds
  color: string;
  desc: string;
  // Returns saucer state at normalized time t ∈ [0,1]
  motion: (t: number) => { x: number; y: number; tilt: number; glow: number; yaw: number };
}

const SHOTS: ShotProfile[] = [
  {
    n: 1, name: "Establishing Hover", duration: 7, color: "oklch(0.65 0.18 145)",
    desc: "Pinned in space — no wobble, no tilt",
    motion: (t) => ({
      x: Math.sin(t * Math.PI * 2) * 2,
      y: Math.sin(t * Math.PI * 3) * 3,
      tilt: Math.sin(t * Math.PI * 4) * 0.5,
      glow: 0.6 + Math.sin(t * Math.PI * 6) * 0.1,
      yaw: 0,
    }),
  },
  {
    n: 2, name: "Underside Reveal", duration: 5, color: "oklch(0.75 0.18 200)",
    desc: "Slow drift toward camera, then stop",
    motion: (t) => {
      const ease = t < 0.6 ? t / 0.6 : 1 - (t - 0.6) / 0.4 * 0.1;
      return { x: ease * 18, y: Math.sin(t * Math.PI) * 4, tilt: 0, glow: 0.7 + ease * 0.2, yaw: 0 };
    },
  },
  {
    n: 3, name: "Top-Down Beauty", duration: 6, color: "oklch(0.72 0.16 80)",
    desc: "Holds position — design credibility",
    motion: (t) => ({
      x: Math.sin(t * Math.PI) * 3,
      y: 0,
      tilt: 0,
      glow: 0.5 + t * 0.3,
      yaw: t * 15,
    }),
  },
  {
    n: 4, name: "Flat Glide", duration: 7, color: "oklch(0.75 0.18 200)",
    desc: "Slides laterally without turning",
    motion: (t) => {
      const x = Math.sin(t * Math.PI) * 55;
      return { x, y: 0, tilt: 0, glow: 0.7 + Math.abs(Math.sin(t * Math.PI)) * 0.2, yaw: 0 };
    },
  },
  {
    n: 5, name: "Snap-Stop", duration: 5, color: "oklch(0.65 0.22 25)",
    desc: "Glides then stops — inertia damped",
    motion: (t) => {
      let x = 0;
      if (t < 0.5) x = t * 2 * 50;
      else {
        const decel = (t - 0.5) / 0.5;
        const eased = 1 - Math.pow(1 - decel, 3);
        x = 50 - eased * 50;
      }
      return { x, y: 0, tilt: 0, glow: 0.65 + (t < 0.5 ? t : 1 - t) * 0.3, yaw: 0 };
    },
  },
  {
    n: 6, name: "Low Pass", duration: 4, color: "oklch(0.72 0.16 80)",
    desc: "Fast level pass — speed + stability",
    motion: (t) => ({
      x: (t - 0.5) * 120,
      y: Math.sin(t * Math.PI) * -5,
      tilt: 0,
      glow: 0.8,
      yaw: 0,
    }),
  },
  {
    n: 7, name: "Mechanical Detail", duration: 5, color: "oklch(0.60 0.15 280)",
    desc: "Subtle segment actuation — not a toy",
    motion: (t) => ({
      x: Math.sin(t * Math.PI * 1.5) * 5,
      y: Math.cos(t * Math.PI * 2) * 3,
      tilt: Math.sin(t * Math.PI * 3) * 1,
      glow: 0.5 + Math.sin(t * Math.PI * 8) * 0.2,
      yaw: Math.sin(t * Math.PI * 2) * 5,
    }),
  },
  {
    n: 8, name: "Hero Hover + Exit", duration: 9, color: "oklch(0.65 0.18 145)",
    desc: "Calm, deliberate, field controlled",
    motion: (t) => {
      if (t < 0.5) {
        return { x: 0, y: Math.sin(t * Math.PI * 2) * 4, tilt: 0, glow: 0.7 + t * 0.2, yaw: 0 };
      } else {
        const exit = (t - 0.5) / 0.5;
        return { x: exit * 30, y: exit * 15, tilt: 0, glow: 0.9 - exit * 0.4, yaw: 0 };
      }
    },
  },
];

const TOTAL_DURATION = SHOTS.reduce((s, sh) => s + sh.duration, 0); // ~48s

function getShotAtTime(time: number): { shot: ShotProfile; localT: number; shotStart: number } {
  let elapsed = 0;
  for (const shot of SHOTS) {
    if (time < elapsed + shot.duration) {
      return { shot, localT: (time - elapsed) / shot.duration, shotStart: elapsed };
    }
    elapsed += shot.duration;
  }
  const last = SHOTS[SHOTS.length - 1];
  return { shot: last, localT: 1, shotStart: TOTAL_DURATION - last.duration };
}

export default function FlightTimeline() {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const lastRafTime = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const tick = useRef<number>(Date.now());

  useEffect(() => {
    if (!playing) return;
    const loop = (now: number) => {
      if (lastRafTime.current === 0) lastRafTime.current = now;
      const dt = (now - lastRafTime.current) / 1000;
      lastRafTime.current = now;
      setCurrentTime(prev => {
        const next = prev + dt * speed;
        if (next >= TOTAL_DURATION) {
          setPlaying(false);
          return TOTAL_DURATION;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastRafTime.current = 0;
    };
  }, [playing, speed]);

  const { shot, localT } = getShotAtTime(currentTime);
  const state = shot.motion(localT);

  // Compute shot start times for timeline
  const shotStarts: number[] = [];
  let acc = 0;
  for (const s of SHOTS) { shotStarts.push(acc); acc += s.duration; }

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTime(parseFloat(e.target.value));
    setPlaying(false);
  }, []);

  const handleShotClick = useCallback((idx: number) => {
    setCurrentTime(shotStarts[idx]);
    setPlaying(false);
  }, [shotStarts]);

  const animT = Date.now() / 1000;

  return (
    <div className="space-y-6">
      {/* Saucer animation viewport */}
      <div className="bg-navy-surface panel-border rounded-sm overflow-hidden" style={{ height: 200, position: "relative" }}>
        {/* Background grid */}
        <div className="absolute inset-0" style={{
          backgroundImage: "linear-gradient(oklch(0.20 0.015 240 / 0.3) 1px, transparent 1px), linear-gradient(90deg, oklch(0.20 0.015 240 / 0.3) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }} />
        {/* Ground line */}
        <div className="absolute bottom-8 left-0 right-0" style={{ height: 1, background: "oklch(0.28 0.015 240)" }} />

        {/* Shot name overlay */}
        <div className="absolute top-3 left-4 flex items-center gap-3">
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: shot.color, boxShadow: `0 0 6px ${shot.color}` }} />
          <span style={{ fontFamily: "'Rajdhani'", fontSize: 13, fontWeight: 700, color: shot.color, letterSpacing: "0.1em" }}>
            SHOT {String(shot.n).padStart(2, "0")} — {shot.name.toUpperCase()}
          </span>
        </div>
        <div className="absolute top-3 right-4">
          <span className="data-value text-xs" style={{ color: "oklch(0.45 0.015 240)" }}>
            T+{currentTime.toFixed(1)}s
          </span>
        </div>
        <div className="absolute bottom-2 left-4">
          <span className="label-caps" style={{ fontSize: 9 }}>{shot.desc}</span>
        </div>

        {/* Animated saucer */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(calc(-50% + ${state.x}px), calc(-50% + ${state.y}px))`,
          transition: "none",
        }}>
          <svg viewBox="0 0 80 50" width={80} height={50}>
            <g transform={`rotate(${state.tilt}, 40, 25) rotate(${state.yaw * 0.1}, 40, 25)`}>
              {/* Glow */}
              <ellipse cx={40} cy={32} rx={32} ry={8}
                fill={`${shot.color.replace(")", ` / ${state.glow * 0.12})`)}`}
                style={{ filter: "blur(5px)" }}
              />
              {/* Lower disc */}
              <ellipse cx={40} cy={28} rx={34} ry={7}
                fill="oklch(0.18 0.018 240)" stroke="oklch(0.28 0.015 240)" strokeWidth="1" />
              {/* Upper dome */}
              <ellipse cx={40} cy={20} rx={22} ry={10}
                fill="oklch(0.22 0.020 240)" stroke="oklch(0.32 0.015 240)" strokeWidth="1" />
              {/* Thrust ring */}
              <ellipse cx={40} cy={30} rx={32} ry={4}
                fill="none"
                stroke={shot.color}
                strokeWidth="1.5"
                opacity={state.glow}
              />
              {/* Dome highlight */}
              <ellipse cx={36} cy={17} rx={8} ry={4}
                fill="oklch(0.45 0.015 240 / 0.2)" />
            </g>
          </svg>
        </div>
      </div>

      {/* Timeline scrubber */}
      <div className="bg-navy-surface panel-border rounded-sm p-5 space-y-4">
        {/* Shot segments bar */}
        <div className="relative h-8 rounded-sm overflow-hidden" style={{ background: "oklch(0.12 0.022 240)" }}>
          {SHOTS.map((s, i) => (
            <button
              key={s.n}
              onClick={() => handleShotClick(i)}
              className="absolute top-0 h-full transition-opacity"
              style={{
                left: `${(shotStarts[i] / TOTAL_DURATION) * 100}%`,
                width: `${(s.duration / TOTAL_DURATION) * 100}%`,
                background: shot.n === s.n
                  ? `${s.color.replace(")", " / 0.25)")}`
                  : `${s.color.replace(")", " / 0.08)")}`,
                borderRight: "1px solid oklch(0.18 0.015 240)",
                borderLeft: shot.n === s.n ? `2px solid ${s.color}` : "none",
              }}
            >
              <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 8, color: s.color, opacity: 0.8 }}>
                {String(s.n).padStart(2, "0")}
              </span>
            </button>
          ))}
          {/* Playhead */}
          <div style={{
            position: "absolute",
            top: 0, bottom: 0,
            left: `${(currentTime / TOTAL_DURATION) * 100}%`,
            width: 2,
            background: "oklch(0.92 0.005 240)",
            boxShadow: "0 0 4px oklch(0.92 0.005 240)",
            pointerEvents: "none",
          }} />
        </div>

        {/* Range input */}
        <input
          type="range"
          min={0}
          max={TOTAL_DURATION}
          step={0.1}
          value={currentTime}
          onChange={handleScrub}
          className="w-full"
          style={{ accentColor: "oklch(0.75 0.18 200)" }}
        />

        {/* Controls row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Play/pause */}
            <button
              onClick={() => {
                if (currentTime >= TOTAL_DURATION) setCurrentTime(0);
                setPlaying(v => !v);
              }}
              className="w-10 h-10 rounded-sm flex items-center justify-center transition-all"
              style={{
                background: playing ? "oklch(0.75 0.18 200 / 0.15)" : "oklch(0.18 0.018 240)",
                border: `1px solid ${playing ? "oklch(0.75 0.18 200 / 0.5)" : "oklch(0.28 0.015 240)"}`,
                color: playing ? "oklch(0.75 0.18 200)" : "oklch(0.60 0.015 240)",
                fontSize: 16,
              }}
            >
              {playing ? "⏸" : "▶"}
            </button>
            {/* Reset */}
            <button
              onClick={() => { setCurrentTime(0); setPlaying(false); }}
              className="w-10 h-10 rounded-sm flex items-center justify-center"
              style={{ background: "oklch(0.18 0.018 240)", border: "1px solid oklch(0.28 0.015 240)", color: "oklch(0.50 0.015 240)", fontSize: 14 }}
            >
              ⏮
            </button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-2">
            <span className="label-caps">SPEED</span>
            {[0.5, 1, 2, 4].map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className="px-2 py-1 rounded-sm text-xs transition-all"
                style={{
                  fontFamily: "'JetBrains Mono'",
                  background: speed === s ? "oklch(0.75 0.18 200 / 0.15)" : "oklch(0.18 0.018 240)",
                  border: `1px solid ${speed === s ? "oklch(0.75 0.18 200 / 0.5)" : "oklch(0.25 0.015 240)"}`,
                  color: speed === s ? "oklch(0.75 0.18 200)" : "oklch(0.50 0.015 240)",
                }}
              >
                {s}×
              </button>
            ))}
          </div>

          {/* Time display */}
          <div className="data-value text-sm" style={{ color: "oklch(0.55 0.015 240)" }}>
            {currentTime.toFixed(1)}s / {TOTAL_DURATION}s
          </div>
        </div>
      </div>

      {/* Shot list */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {SHOTS.map((s, i) => (
          <button
            key={s.n}
            onClick={() => handleShotClick(i)}
            className="rounded-sm p-2 text-left transition-all"
            style={{
              background: shot.n === s.n ? `${s.color.replace(")", " / 0.12)")}` : "oklch(0.14 0.020 240)",
              border: `1px solid ${shot.n === s.n ? s.color.replace(")", " / 0.5)") : "oklch(0.22 0.015 240)"}`,
            }}
          >
            <div className="data-value text-xs" style={{ color: s.color }}>{String(s.n).padStart(2, "0")}</div>
            <div className="label-caps mt-0.5" style={{ fontSize: 8, lineHeight: 1.3 }}>{s.name}</div>
            <div className="data-value text-xs mt-1" style={{ color: "oklch(0.40 0.012 240)" }}>{s.duration}s</div>
          </button>
        ))}
      </div>
    </div>
  );
}
