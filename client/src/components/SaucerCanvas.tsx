/* =============================================================
   COMPONENT: SaucerCanvas
   Design: Classified Aerospace Dossier
   Animated CSS 3D saucer with rotating rings and pulsing glow
   ============================================================= */
import { useEffect, useRef, useState } from "react";

export default function SaucerCanvas() {
  const [tick, setTick] = useState(0);
  const rafRef = useRef<number>(0);
  const startRef = useRef<number>(Date.now());

  useEffect(() => {
    const loop = () => {
      setTick(Date.now() - startRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const t = tick / 1000;
  const floatY = Math.sin(t * 0.8) * 10;
  const ringGlow = 0.5 + Math.sin(t * 1.2) * 0.3;
  const ringGlow2 = 0.5 + Math.sin(t * 0.9 + 1) * 0.3;

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: 340, height: 260, perspective: "800px" }}
    >
      {/* Ground reflection glow */}
      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full"
        style={{
          width: 220,
          height: 24,
          background: `radial-gradient(ellipse, oklch(0.75 0.18 200 / ${0.15 + ringGlow * 0.1}) 0%, transparent 70%)`,
          filter: "blur(8px)",
          transform: `translateX(-50%) scaleY(${0.8 + Math.sin(t * 0.8) * 0.05})`,
        }}
      />

      {/* Main saucer body */}
      <div
        className="relative"
        style={{
          transform: `translateY(${floatY}px)`,
          transition: "none",
        }}
      >
        {/* Outer rotating ring */}
        <div
          className="absolute"
          style={{
            width: 280,
            height: 280,
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) rotateX(75deg) rotate(${t * 18}deg)`,
            border: `1px solid oklch(0.75 0.18 200 / ${ringGlow * 0.5})`,
            borderRadius: "50%",
            boxShadow: `0 0 ${8 + ringGlow * 8}px oklch(0.75 0.18 200 / ${ringGlow * 0.3})`,
          }}
        />

        {/* Inner counter-rotating ring */}
        <div
          className="absolute"
          style={{
            width: 200,
            height: 200,
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) rotateX(75deg) rotate(${-t * 24}deg)`,
            border: `1px dashed oklch(0.72 0.16 80 / ${ringGlow2 * 0.4})`,
            borderRadius: "50%",
          }}
        />

        {/* Saucer hull — upper dome */}
        <div
          className="relative"
          style={{
            width: 200,
            height: 80,
            background: "linear-gradient(180deg, oklch(0.28 0.020 240) 0%, oklch(0.18 0.018 240) 60%, oklch(0.14 0.020 240) 100%)",
            borderRadius: "50% 50% 30% 30% / 60% 60% 20% 20%",
            border: "1px solid oklch(0.35 0.015 240)",
            boxShadow: "inset 0 -2px 8px oklch(0 0 0 / 0.4), 0 2px 4px oklch(0 0 0 / 0.3)",
            position: "relative",
            zIndex: 2,
          }}
        >
          {/* Dome highlight */}
          <div
            style={{
              position: "absolute",
              top: 8,
              left: "20%",
              width: "60%",
              height: "35%",
              background: "radial-gradient(ellipse, oklch(0.55 0.015 240 / 0.3) 0%, transparent 70%)",
              borderRadius: "50%",
            }}
          />
          {/* Amber accent line */}
          <div
            style={{
              position: "absolute",
              bottom: 6,
              left: "10%",
              width: "80%",
              height: 2,
              background: `linear-gradient(90deg, transparent, oklch(0.72 0.16 80 / ${0.4 + ringGlow2 * 0.3}), transparent)`,
              borderRadius: 1,
            }}
          />
        </div>

        {/* Saucer hull — lower disc */}
        <div
          style={{
            width: 240,
            height: 36,
            background: "linear-gradient(180deg, oklch(0.20 0.020 240) 0%, oklch(0.14 0.020 240) 100%)",
            borderRadius: "50%",
            border: "1px solid oklch(0.30 0.015 240)",
            marginTop: -8,
            marginLeft: -20,
            position: "relative",
            zIndex: 1,
            boxShadow: "0 4px 16px oklch(0 0 0 / 0.5)",
          }}
        >
          {/* Annular thrust ring glow */}
          <div
            style={{
              position: "absolute",
              bottom: -4,
              left: "5%",
              width: "90%",
              height: 8,
              background: `radial-gradient(ellipse, oklch(0.75 0.18 200 / ${ringGlow}) 0%, oklch(0.75 0.18 200 / ${ringGlow * 0.3}) 50%, transparent 80%)`,
              borderRadius: "50%",
              filter: "blur(3px)",
            }}
          />
          {/* Segmented vanes hint */}
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                bottom: 2,
                left: `${8 + i * 7}%`,
                width: 3,
                height: 6,
                background: `oklch(0.75 0.18 200 / ${0.3 + (i % 3 === 0 ? ringGlow * 0.4 : 0)})`,
                borderRadius: 1,
              }}
            />
          ))}
        </div>

        {/* Downwash shimmer */}
        <div
          style={{
            position: "absolute",
            bottom: -30,
            left: "20%",
            width: "60%",
            height: 30,
            background: `linear-gradient(180deg, oklch(0.75 0.18 200 / ${ringGlow * 0.08}) 0%, transparent 100%)`,
            filter: "blur(4px)",
          }}
        />
      </div>

      {/* Status indicators */}
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        {["LIFT", "VEC", "NAV"].map((label, i) => (
          <div key={label} className="flex items-center gap-1.5">
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: i === 0
                  ? `oklch(0.65 0.18 145 / ${0.6 + Math.sin(t * 2 + i) * 0.4})`
                  : i === 1
                  ? `oklch(0.75 0.18 200 / ${0.6 + Math.sin(t * 1.5 + i) * 0.4})`
                  : `oklch(0.72 0.16 80 / ${0.6 + Math.sin(t * 1.8 + i) * 0.4})`,
                boxShadow: i === 0
                  ? `0 0 4px oklch(0.65 0.18 145 / 0.6)`
                  : i === 1
                  ? `0 0 4px oklch(0.75 0.18 200 / 0.6)`
                  : `0 0 4px oklch(0.72 0.16 80 / 0.6)`,
              }}
            />
            <span style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "oklch(0.45 0.015 240)", letterSpacing: "0.1em" }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Live telemetry readout */}
      <div className="absolute bottom-2 left-3">
        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "oklch(0.45 0.015 240)", letterSpacing: "0.05em" }}>
          ALT {(3.2 + Math.sin(t * 0.8) * 0.3).toFixed(1)}m
        </div>
        <div style={{ fontFamily: "'JetBrains Mono'", fontSize: 9, color: "oklch(0.75 0.18 200 / 0.6)", letterSpacing: "0.05em" }}>
          PWR {(218 + Math.sin(t * 1.1) * 8).toFixed(0)}kW
        </div>
      </div>
    </div>
  );
}
