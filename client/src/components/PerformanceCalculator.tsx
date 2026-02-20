/* =============================================================
   COMPONENT: PerformanceCalculator
   Design: Classified Aerospace Dossier
   Interactive performance envelope calculator from Step 6
   ============================================================= */
import { useState } from "react";
import { Slider } from "@/components/ui/slider";

interface CalcResult {
  lateralForce: number;
  lateralAccel: number;
  lateralAccelG: number;
  requiredThrust: number;
  stopTime: number;
  stopDist: number;
  look: string;
  lookColor: string;
}

function calcPerformance(mass: number, vectorAngle: number, initialSpeed: number): CalcResult {
  const g = 9.81;
  const weight = mass * g;
  const theta = (vectorAngle * Math.PI) / 180;
  const lateralForce = weight * Math.tan(theta);
  const lateralAccel = lateralForce / mass;
  const lateralAccelG = lateralAccel / g;
  const requiredThrust = weight / Math.cos(theta);
  const stopTime = initialSpeed / lateralAccel;
  const stopDist = (initialSpeed * initialSpeed) / (2 * lateralAccel);

  let look = "Normal drone";
  let lookColor = "oklch(0.55 0.015 240)";
  if (lateralAccelG >= 0.35) { look = "Borderline impossible"; lookColor = "oklch(0.65 0.22 25)"; }
  else if (lateralAccelG >= 0.25) { look = "\"That's weird\""; lookColor = "oklch(0.72 0.16 80)"; }
  else if (lateralAccelG >= 0.15) { look = "Very convincing glide"; lookColor = "oklch(0.75 0.18 200)"; }
  else if (lateralAccelG >= 0.08) { look = "Uncanny hover"; lookColor = "oklch(0.65 0.18 145)"; }

  return { lateralForce, lateralAccel, lateralAccelG, requiredThrust, stopTime, stopDist, look, lookColor };
}

export default function PerformanceCalculator() {
  const [mass, setMass] = useState(800);
  const [vectorAngle, setVectorAngle] = useState(15);
  const [initialSpeed, setInitialSpeed] = useState(10);

  const r = calcPerformance(mass, vectorAngle, initialSpeed);

  const DataRow = ({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: boolean }) => (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: "1px solid oklch(0.20 0.015 240)" }}>
      <span className="label-caps">{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className="data-value text-sm" style={{ color: highlight ? "oklch(0.75 0.18 200)" : "oklch(0.88 0.005 240)" }}>
          {value}
        </span>
        <span className="label-caps" style={{ color: "oklch(0.45 0.015 240)" }}>{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Inputs */}
      <div className="bg-navy-surface panel-border rounded-sm p-5 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-cyan tracking-widest uppercase" style={{ fontFamily: "'Rajdhani'" }}>
            System Parameters
          </h3>
          <span className="classified-stamp">LIVE</span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="label-caps">Craft Mass</span>
            <span className="data-value text-sm text-cyan">{mass} kg</span>
          </div>
          <Slider
            min={200} max={2000} step={50}
            value={[mass]}
            onValueChange={([v]) => setMass(v)}
            className="w-full"
          />
          <div className="flex justify-between label-caps" style={{ color: "oklch(0.35 0.012 240)" }}>
            <span>200 kg</span><span>2,000 kg</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="label-caps">Vector Angle θ</span>
            <span className="data-value text-sm" style={{ color: "oklch(0.72 0.16 80)" }}>{vectorAngle}°</span>
          </div>
          <Slider
            min={2} max={25} step={1}
            value={[vectorAngle]}
            onValueChange={([v]) => setVectorAngle(v)}
            className="w-full"
          />
          <div className="flex justify-between label-caps" style={{ color: "oklch(0.35 0.012 240)" }}>
            <span>2° subtle</span><span>25° dramatic</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="label-caps">Initial Speed (snap-stop)</span>
            <span className="data-value text-sm" style={{ color: "oklch(0.88 0.005 240)" }}>{initialSpeed} m/s</span>
          </div>
          <Slider
            min={2} max={30} step={1}
            value={[initialSpeed]}
            onValueChange={([v]) => setInitialSpeed(v)}
            className="w-full"
          />
          <div className="flex justify-between label-caps" style={{ color: "oklch(0.35 0.012 240)" }}>
            <span>2 m/s</span><span>30 m/s</span>
          </div>
        </div>

        {/* Visual look indicator */}
        <div className="rounded-sm p-3 mt-2" style={{ background: "oklch(0.12 0.022 240)", border: `1px solid ${r.lookColor}40` }}>
          <div className="label-caps mb-1">Audience Perception</div>
          <div className="text-base font-semibold" style={{ fontFamily: "'Rajdhani'", color: r.lookColor }}>
            {r.look}
          </div>
        </div>
      </div>

      {/* Outputs */}
      <div className="bg-navy-surface panel-border rounded-sm p-5">
        <h3 className="text-sm font-semibold text-cyan tracking-widest uppercase mb-4" style={{ fontFamily: "'Rajdhani'" }}>
          Computed Envelope
        </h3>

        <div className="space-y-0">
          <DataRow label="Weight (W)" value={(mass * 9.81).toFixed(0)} unit="N" />
          <DataRow label="Lateral Force (F_lat)" value={r.lateralForce.toFixed(0)} unit="N" highlight />
          <DataRow label="Lateral Acceleration" value={r.lateralAccel.toFixed(2)} unit="m/s²" highlight />
          <DataRow label="Lateral Accel (g)" value={r.lateralAccelG.toFixed(3)} unit="g" highlight />
          <DataRow label="Required Thrust" value={r.requiredThrust.toFixed(0)} unit="N" />
          <DataRow label="Thrust Overhead" value={(((r.requiredThrust / (mass * 9.81)) - 1) * 100).toFixed(1)} unit="%" />
          <DataRow label="Snap-stop Time" value={isFinite(r.stopTime) ? r.stopTime.toFixed(1) : "—"} unit="s" />
          <DataRow label="Snap-stop Distance" value={isFinite(r.stopDist) ? r.stopDist.toFixed(1) : "—"} unit="m" />
        </div>

        {/* Equations */}
        <div className="mt-4 p-3 rounded-sm" style={{ background: "oklch(0.12 0.022 240)" }}>
          <div className="label-caps mb-2">Key Equations</div>
          <div className="space-y-1">
            <div className="data-value text-xs" style={{ color: "oklch(0.55 0.015 240)" }}>
              T = W / cos(θ) &nbsp;·&nbsp; F_lat = W·tan(θ) &nbsp;·&nbsp; a_lat = F_lat / m
            </div>
            <div className="data-value text-xs" style={{ color: "oklch(0.55 0.015 240)" }}>
              t_stop = v / a_lat &nbsp;·&nbsp; d_stop = v² / (2·a_lat)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
