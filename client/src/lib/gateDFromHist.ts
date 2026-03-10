export type GateDHeadline = {
  enter_radius_time_s: number | null;
  response_latency_s: number | null;
  recede_latency_s: number | null;
  v_rad_enter_mps: number | null;
  a_rad_peak_mps2: number | null;
  t_to_vrad_away_0p5_s: number | null;
  repel_speed_mps_median: number | null;
  repel_speed_mps_max: number | null;
  yaw_track_coupling_mean_abs_deg: number | null;
};

export type TraceV4 = {
  meta?: any;
  hist?: Record<string, any[]>;
  headline?: Partial<GateDHeadline>;
};

function hypot(x: number, y: number) {
  return Math.sqrt(x * x + y * y);
}

export function computeGateDHeadlineFromTrace(trace: TraceV4): GateDHeadline | null {
  const hist = trace.hist;
  const meta = trace.meta;
  if (!hist || !meta?.obstacle || !meta?.field) return null;

  const t = (hist.t ?? []).map(Number);
  const x = (hist.x ?? []).map(Number);
  const y = (hist.y ?? []).map(Number);
  const vx = (hist.vx ?? []).map(Number);
  const vy = (hist.vy ?? []).map(Number);
  const speed = (hist.speed ?? []).map(Number);

  if (!t.length || t.length !== x.length || x.length !== vx.length) return null;

  const ox = Number(meta.obstacle.x_m);
  const oy = Number(meta.obstacle.y_m);
  const radius = Number(meta.field.radius_m);

  const dist: number[] = [];
  const vRad: number[] = [];

  for (let i = 0; i < t.length; i++) {
    const dx = x[i] - ox;
    const dy = y[i] - oy;
    const d = hypot(dx, dy);
    dist.push(d);

    const dSafe = Math.max(d, 1e-6);
    const ux = dx / dSafe;
    const uy = dy / dSafe;
    vRad.push(vx[i] * ux + vy[i] * uy);
  }

  const enterIdx = dist.findIndex((d) => d <= radius);
  const enterTime = enterIdx >= 0 ? t[enterIdx] : null;

  let recedeTime: number | null = null;
  if (enterIdx >= 0) {
    for (let i = enterIdx; i < vRad.length; i++) {
      if (vRad[i] > 0) {
        recedeTime = t[i];
        break;
      }
    }
  }

  let tToAway05: number | null = null;
  if (enterIdx >= 0) {
    for (let i = enterIdx; i < vRad.length; i++) {
      if (vRad[i] >= 0.5) {
        tToAway05 = t[i] - t[enterIdx];
        break;
      }
    }
  }

  let aPeak: number | null = null;
  if (enterIdx >= 0) {
    let peak = -Infinity;
    for (let i = Math.max(enterIdx, 1); i < vRad.length; i++) {
      const dt = t[i] - t[i - 1];
      if (dt <= 1e-6) continue;
      const a = (vRad[i] - vRad[i - 1]) / dt;
      if (a > peak) peak = a;
    }
    if (Number.isFinite(peak)) aPeak = peak;
  }

  let responseTime: number | null = null;
  if (enterIdx >= 0 && speed.length) {
    const v0 = speed[0];
    for (let i = enterIdx; i < speed.length; i++) {
      if (Math.abs(speed[i] - v0) >= 0.3) {
        responseTime = t[i];
        break;
      }
    }
  }

  const speedMed = speed.length ? speed.slice().sort((a, b) => a - b)[Math.floor(speed.length / 2)] : null;
  const speedMax = speed.length ? Math.max(...speed) : null;

  return {
    enter_radius_time_s: enterTime,
    response_latency_s: enterTime != null && responseTime != null ? responseTime - enterTime : null,
    recede_latency_s: enterTime != null && recedeTime != null ? recedeTime - enterTime : null,
    v_rad_enter_mps: enterIdx >= 0 ? vRad[enterIdx] : null,
    a_rad_peak_mps2: aPeak,
    t_to_vrad_away_0p5_s: tToAway05,
    repel_speed_mps_median: speedMed,
    repel_speed_mps_max: speedMax,
    yaw_track_coupling_mean_abs_deg: meta?.yaw_track_coupling_mean_abs_deg ?? null,
  };
}
