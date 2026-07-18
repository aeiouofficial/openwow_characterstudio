/**
 * MorphSculptEngine — continuous head sculpt via smooth spatial fields.
 * Race/gender agnostic. Works on any mesh whose verts have positions in a
 * shared coordinate space (y-up). Does NOT touch skin weights / animations.
 *
 * Displacement is a pure function of (basePosition, morphValues, axes, headGate),
 * so welded geosets that share the vertex pool stay welded when you apply the
 * same field to all of them (or to the shared pool once).
 */
import type { MorphAxis, RaceGenderProfile } from './types';

export type Vec3 = [number, number, number];

export type SculptVertex = {
  /** Base bind-pose position (never mutated). */
  base: Vec3;
  /** Output position (mutated each apply). */
  out: Vec3;
  /** 0..1 head influence (from bone weights or region gate). */
  headWeight: number;
  /** Optional rigid flag (eyes, eyeglow) — never displaced. */
  rigid?: boolean;
};

function smoothstep(v: number, a: number, b: number): number {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a || 1e-9)));
  return t * t * (3 - 2 * t);
}

function gauss3(
  x: number, y: number, z: number,
  cx: number, cy: number, cz: number,
  sx: number, sy: number, sz: number,
): number {
  const dx = (x - cx) / sx, dy = (y - cy) / sy, dz = (z - cz) / sz;
  return Math.exp(-0.5 * (dx * dx + dy * dy + dz * dz));
}

/** Region helpers use normalized head-local coords derived from profile headRegion. */
type HeadLocal = {
  /** 0 at chin, 1 at crown */
  t: number;
  /** -1 left .. +1 right (z in y-up orc space was L/R; we treat z as lateral) */
  lat: number;
  /** 0 back .. 1 front */
  front: number;
  x: number; y: number; z: number;
};

function headLocal(
  p: Vec3,
  yMin: number,
  yMax: number,
  xMin = 0,
  xMax = 0.5,
): HeadLocal {
  const [x, y, z] = p;
  const t = smoothstep(y, yMin, yMax);
  const front = smoothstep(x, xMin, xMax);
  // lateral normalized roughly to ±0.15 skull half-width
  const lat = Math.max(-1, Math.min(1, z / 0.12));
  return { t, lat, front, x, y, z };
}

/**
 * Per-axis displacement contribution in model space (dx,dy,dz).
 * Centers are approximate classic humanoid head proportions in [0..1] head-height
 * and are remapped via profile.headRegion at apply time.
 */
function axisDisplacement(
  id: string,
  value: number,
  strength: number,
  L: HeadLocal,
  yMin: number,
  yMax: number,
): Vec3 {
  if (Math.abs(value) < 1e-6) return [0, 0, 0];
  const s = value * strength;
  const y = L.y, x = L.x, z = L.z;
  const midY = (yMin + yMax) * 0.5;
  const h = Math.max(1e-6, yMax - yMin);

  // Feature anchors (fraction of head height from chin)
  const ay = (f: number) => yMin + f * h;
  const g = (fy: number, sx: number, sy: number, sz: number, cx = 0.32, cz = 0) =>
    gauss3(x, y, z, cx, ay(fy), cz, sx, sy * h, sz);

  let dx = 0, dy = 0, dz = 0;
  const signZ = z >= 0 ? 1 : -1;

  switch (id) {
    // skull
    case 'skull_width': dz += s * L.t * signZ * 0.9; break;
    case 'skull_height': dy += s * smoothstep(L.t, 0.55, 1.0); break;
    case 'skull_depth': dx += s * L.t * 0.5; break;
    case 'skull_roundness': {
      const w = g(0.75, 0.08, 0.2, 0.08);
      dx += s * w * 0.3; dz += s * w * signZ * 0.5;
      break;
    }
    case 'forehead_height': dy += s * g(0.9, 0.07, 0.12, 0.08); break;
    case 'forehead_width': dz += s * g(0.88, 0.06, 0.1, 0.09) * signZ; break;
    case 'forehead_slope': dx += s * g(0.88, 0.06, 0.12, 0.08) * (value > 0 ? 1 : -1); break;
    case 'temple_width': dz += s * g(0.78, 0.05, 0.1, 0.05, 0.28, 0.08 * signZ) * signZ; break;
    case 'occipital_bulk': dx -= s * g(0.7, 0.06, 0.15, 0.08, 0.12); break;

    // brow
    case 'brow_ridge': dx += s * g(0.72, 0.05, 0.06, 0.09); break;
    case 'brow_height': dy += s * g(0.72, 0.05, 0.05, 0.09); break;
    case 'brow_angle': dy += s * g(0.72, 0.04, 0.05, 0.04, 0.32, 0.07 * signZ) * Math.abs(L.lat); break;
    case 'brow_inner': dy += s * g(0.72, 0.03, 0.04, 0.03, 0.32, 0.02 * signZ); break;
    case 'brow_outer': dy += s * g(0.72, 0.03, 0.04, 0.03, 0.32, 0.09 * signZ); break;
    case 'glabella': dx += s * g(0.7, 0.025, 0.04, 0.025, 0.34, 0); break;

    // eyes
    case 'eye_size': {
      const w = g(0.68, 0.025, 0.03, 0.025, 0.34, 0.05 * signZ);
      dx += s * w * 0.2; dy += s * w * 0.2; dz += s * w * signZ * 0.3;
      break;
    }
    case 'eye_height': dy += s * g(0.68, 0.03, 0.03, 0.03, 0.34, 0.05 * signZ); break;
    case 'eye_depth': dx += s * g(0.68, 0.03, 0.03, 0.03, 0.34, 0.05 * signZ); break;
    case 'eye_spacing': dz += s * g(0.68, 0.03, 0.03, 0.03, 0.34, 0.05 * signZ) * signZ; break;
    case 'eye_slant': dy += s * g(0.68, 0.03, 0.025, 0.02, 0.34, 0.07 * signZ) * L.lat; break;
    case 'eye_openness': dy += s * g(0.68, 0.025, 0.02, 0.025, 0.34, 0.05 * signZ) * 0.5; break;
    case 'under_eye': dy -= s * g(0.64, 0.03, 0.025, 0.03, 0.33, 0.05 * signZ); break;

    // nose
    case 'nose_length': dx += s * g(0.58, 0.03, 0.08, 0.03, 0.38, 0); break;
    case 'nose_width': dz += s * g(0.55, 0.03, 0.06, 0.035, 0.36, 0) * signZ; break;
    case 'nose_height': dy += s * g(0.6, 0.03, 0.07, 0.03, 0.36, 0); break;
    case 'nose_tip_up': dy += s * g(0.52, 0.025, 0.03, 0.025, 0.4, 0); break;
    case 'nose_tip_width': dz += s * g(0.52, 0.025, 0.03, 0.03, 0.4, 0) * signZ; break;
    case 'nose_bridge_width': dz += s * g(0.62, 0.025, 0.05, 0.025, 0.35, 0) * signZ; break;
    case 'nostril_flare': dz += s * g(0.5, 0.02, 0.03, 0.025, 0.38, 0.02 * signZ) * signZ; break;
    case 'nose_hook': { const w = g(0.55, 0.03, 0.05, 0.03, 0.38, 0); dx += s * w; dy -= s * w * 0.4; break; }

    // cheeks
    case 'cheekbone_height': dy += s * g(0.58, 0.04, 0.05, 0.04, 0.3, 0.08 * signZ); break;
    case 'cheekbone_width': dz += s * g(0.58, 0.04, 0.05, 0.04, 0.3, 0.08 * signZ) * signZ; break;
    case 'cheekbone_depth': dx += s * g(0.58, 0.04, 0.05, 0.04, 0.3, 0.08 * signZ); break;
    case 'cheek_hollow': dz -= s * g(0.52, 0.04, 0.06, 0.04, 0.28, 0.07 * signZ) * signZ; break;
    case 'cheek_fullness': dz += s * g(0.5, 0.05, 0.06, 0.05, 0.28, 0.07 * signZ) * signZ; break;

    // mouth
    case 'mouth_width': dz += s * g(0.4, 0.03, 0.03, 0.04, 0.35, 0) * signZ; break;
    case 'mouth_height': dy += s * g(0.4, 0.03, 0.03, 0.04, 0.35, 0); break;
    case 'lip_upper': dy += s * g(0.42, 0.03, 0.02, 0.04, 0.36, 0); break;
    case 'lip_lower': dy -= s * g(0.38, 0.03, 0.02, 0.04, 0.36, 0); break;
    case 'lip_fullness': dx += s * g(0.4, 0.03, 0.03, 0.04, 0.36, 0) * 0.5; break;
    case 'mouth_protrusion': dx += s * g(0.4, 0.03, 0.04, 0.05, 0.36, 0); break;
    case 'philtrum': dx -= s * g(0.45, 0.015, 0.03, 0.015, 0.36, 0); break;

    // jaw
    case 'jaw_width': dz += s * g(0.28, 0.06, 0.08, 0.06) * signZ; break;
    case 'jaw_height': dy += s * g(0.25, 0.05, 0.08, 0.06); break;
    case 'jaw_angle': dz += s * g(0.3, 0.04, 0.06, 0.04, 0.28, 0.09 * signZ) * signZ; break;
    case 'jaw_forward': dx += s * g(0.28, 0.05, 0.08, 0.06); break;
    case 'mandible_bulk': { const w = g(0.28, 0.05, 0.07, 0.05); dx += s * w * 0.3; dz += s * w * signZ; break; }
    case 'masseter': dz += s * g(0.32, 0.04, 0.06, 0.04, 0.28, 0.08 * signZ) * signZ; break;

    // chin
    case 'chin_width': dz += s * g(0.18, 0.03, 0.05, 0.04, 0.32, 0) * signZ; break;
    case 'chin_height': dy += s * g(0.15, 0.03, 0.05, 0.04, 0.32, 0); break;
    case 'chin_depth': dx += s * g(0.15, 0.03, 0.05, 0.04, 0.34, 0); break;
    case 'chin_cleft': dz -= s * g(0.15, 0.015, 0.04, 0.015, 0.34, 0) * Math.sign(z || 1) * 0.01; dz += (z === 0 ? 0 : -s * g(0.15, 0.02, 0.04, 0.015, 0.34, 0) * 0.5 * (Math.abs(z) < 0.02 ? 1 : 0)); break;
    case 'chin_point': { const w = g(0.14, 0.025, 0.04, 0.025, 0.34, 0); dx += s * w; dy -= s * w * 0.3; break; }

    // ears (lateral extremes)
    case 'ear_size': {
      const w = g(0.65, 0.04, 0.1, 0.03, 0.22, 0.12 * signZ);
      dx += s * w * 0.2; dy += s * w * 0.3; dz += s * w * signZ;
      break;
    }
    case 'ear_height': dy += s * g(0.65, 0.03, 0.08, 0.03, 0.22, 0.12 * signZ); break;
    case 'ear_angle': dz += s * g(0.65, 0.03, 0.08, 0.03, 0.22, 0.12 * signZ) * signZ; break;
    case 'ear_tip': dy += s * g(0.78, 0.025, 0.04, 0.025, 0.22, 0.12 * signZ); break;
    case 'earlobe': dy -= s * g(0.55, 0.025, 0.04, 0.025, 0.22, 0.12 * signZ); break;

    // neck
    case 'neck_width': dz += s * smoothstep(y, yMin - 0.05, yMin + 0.08) * (1 - L.t) * signZ; break;
    case 'neck_length': dy += s * smoothstep(y, yMin - 0.08, yMin + 0.1) * 0.5; break;
    case 'adam_apple': dx += s * g(0.05, 0.02, 0.04, 0.02, 0.28, 0); break;
    case 'nape': dx -= s * g(0.1, 0.03, 0.06, 0.04, 0.1, 0); break;

    // asymmetry (positive = right side bigger / higher)
    case 'asym_jaw': dy += s * g(0.28, 0.05, 0.07, 0.05) * L.lat; dz += s * g(0.28, 0.05, 0.07, 0.05) * (L.lat > 0 ? 1 : 0) * 0.3; break;
    case 'asym_eye': dy += s * g(0.68, 0.03, 0.03, 0.03, 0.34, 0.05 * signZ) * L.lat; break;
    case 'asym_brow': dy += s * g(0.72, 0.04, 0.04, 0.04) * L.lat; break;
    case 'asym_mouth': dy += s * g(0.4, 0.03, 0.03, 0.04, 0.35, 0) * L.lat; break;
    case 'asym_nose': dz += s * g(0.55, 0.03, 0.06, 0.03, 0.36, 0) * value; break;

    // age
    case 'age_wrinkles': break; // texture-side primarily; tiny geo nudge
    case 'age_jowls': dy -= s * g(0.32, 0.04, 0.05, 0.04, 0.28, 0.07 * signZ); dz += s * g(0.32, 0.04, 0.05, 0.04, 0.28, 0.07 * signZ) * signZ * 0.5; break;
    case 'age_sag': dy -= s * L.t * 0.15; break;
    case 'fleshiness': { const w = L.t * 0.5; dz += s * w * signZ * 0.4; dx += s * w * 0.2; break; }

    // expression bias
    case 'expr_smile': { const w = g(0.4, 0.04, 0.03, 0.05, 0.34, 0); dy += s * w * 0.3; dz += s * w * signZ * 0.4; break; }
    case 'expr_frown': dy -= s * g(0.42, 0.04, 0.03, 0.05, 0.34, 0); break;
    case 'expr_snarl': { const w = g(0.42, 0.03, 0.03, 0.03, 0.35, 0.03 * signZ); dy += s * w * 0.2; dx += s * w * 0.3; break; }
    case 'expr_squint': dy -= s * g(0.68, 0.03, 0.02, 0.03, 0.34, 0.05 * signZ) * 0.5; break;
    case 'expr_brows_raise': dy += s * g(0.72, 0.04, 0.04, 0.08); break;

    default:
      break;
  }
  return [dx, dy, dz];
}

export class MorphSculptEngine {
  private axes: MorphAxis[];
  private values: Record<string, number> = {};
  private yMin: number;
  private yMax: number;
  private xMin: number;
  private xMax: number;

  constructor(profile: RaceGenderProfile) {
    this.axes = profile.morphAxes;
    this.yMin = profile.headRegion.yMin;
    this.yMax = profile.headRegion.yMax;
    this.xMin = profile.headRegion.xMin ?? 0.05;
    this.xMax = 0.55;
    for (const a of this.axes) this.values[a.id] = a.default;
  }

  setProfile(profile: RaceGenderProfile): void {
    this.axes = profile.morphAxes;
    this.yMin = profile.headRegion.yMin;
    this.yMax = profile.headRegion.yMax;
    this.xMin = profile.headRegion.xMin ?? 0.05;
    const next: Record<string, number> = {};
    for (const a of this.axes) next[a.id] = this.values[a.id] ?? a.default;
    this.values = next;
  }

  getAxes(): MorphAxis[] { return this.axes; }
  getValues(): Record<string, number> { return { ...this.values }; }

  setMorph(id: string, value: number): void {
    const axis = this.axes.find((a) => a.id === id);
    if (!axis) return;
    this.values[id] = Math.min(axis.max, Math.max(axis.min, value));
  }

  setMorphs(values: Record<string, number>): void {
    for (const [k, v] of Object.entries(values)) this.setMorph(k, v);
  }

  reset(): void {
    for (const a of this.axes) this.values[a.id] = a.default;
  }

  randomize(amount = 0.65): void {
    for (const a of this.axes) {
      if (a.category === 'expression') continue;
      const r = (Math.random() * 2 - 1) * amount;
      this.values[a.id] = Math.min(a.max, Math.max(a.min, r));
    }
  }

  /**
   * Apply morphs to a vertex buffer (mutates verts[i].out).
   * Call once per frame after slider change, or bake into geometry.
   */
  apply(verts: SculptVertex[]): void {
    const active = this.axes.filter((a) => Math.abs(this.values[a.id] ?? 0) > 1e-6);
    const yMin = this.yMin, yMax = this.yMax, xMin = this.xMin, xMax = this.xMax;
    // soft head gate along height
    for (let i = 0; i < verts.length; i++) {
      const v = verts[i];
      const [bx, by, bz] = v.base;
      v.out[0] = bx; v.out[1] = by; v.out[2] = bz;
      if (v.rigid || v.headWeight < 0.02) continue;
      const gate =
        v.headWeight *
        smoothstep(by, yMin - 0.02, yMin + 0.06) *
        (1 - smoothstep(by, yMax - 0.02, yMax + 0.05) * 0.15);
      if (gate < 0.01) continue;
      const L = headLocal(v.base, yMin, yMax, xMin, xMax);
      let dx = 0, dy = 0, dz = 0;
      for (const a of active) {
        const val = this.values[a.id] ?? 0;
        const d = axisDisplacement(a.id, val, a.strength, L, yMin, yMax);
        dx += d[0]; dy += d[1]; dz += d[2];
      }
      v.out[0] = bx + dx * gate;
      v.out[1] = by + dy * gate;
      v.out[2] = bz + dz * gate;
    }
  }

  /** Apply into a flat Float32Array of xyz positions (length = verts*3). */
  applyToPositions(base: Float32Array, out: Float32Array, headWeights: Float32Array, rigid?: Uint8Array): void {
    const n = base.length / 3;
    const proxy: SculptVertex[] = new Array(n);
    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      proxy[i] = {
        base: [base[i3], base[i3 + 1], base[i3 + 2]],
        out: [0, 0, 0],
        headWeight: headWeights[i] ?? 1,
        rigid: rigid ? !!rigid[i] : false,
      };
    }
    this.apply(proxy);
    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      out[i3] = proxy[i].out[0];
      out[i3 + 1] = proxy[i].out[1];
      out[i3 + 2] = proxy[i].out[2];
    }
  }
}
