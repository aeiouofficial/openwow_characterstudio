/**
 * BodySculptEngine — continuous body sculpt with gear-safe masking.
 *
 * Strategy (keeps gear/item textures correct):
 * 1. Only displace verts on body-safe meshes (Geoset0 / Torso / skin family).
 * 2. Soft region masks from bind-pose Y + |Z| + bone-weight hints.
 * 3. Near gear-attachment bones, falloff → 0 so armor edges don't crack as badly.
 * 4. Gear meshes are never written — their UVs/textures render 1:1 original.
 */
import {
  FULL_BODY_MORPH_CATALOG,
  type BodyMorphAxis,
  type BodyRegion,
} from './BodyMorphCatalog';

export type Vec3 = [number, number, number];

export type BodySculptVertex = {
  base: Vec3;
  out: Vec3;
  /** 0..1 body influence (0 = gear / rigid). */
  bodyWeight: number;
  regionWeights: Partial<Record<BodyRegion, number>>;
};

function smoothstep(v: number, a: number, b: number): number {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a || 1e-9)));
  return t * t * (3 - 2 * t);
}

function gauss(v: number, c: number, s: number): number {
  const d = (v - c) / s;
  return Math.exp(-0.5 * d * d);
}

/** Approximate classic humanoid region weights from bind-pose position (y-up). */
export function estimateRegionWeights(
  x: number, y: number, z: number,
  yMin = 0, yMax = 2.2,
): Partial<Record<BodyRegion, number>> {
  const h = Math.max(1e-6, yMax - yMin);
  const t = (y - yMin) / h; // 0 feet .. 1 head
  const lat = Math.max(-1, Math.min(1, z / 0.35));
  const sideL = Math.max(0, -lat);
  const sideR = Math.max(0, lat);
  const front = smoothstep(x, -0.05, 0.15);
  const back = 1 - front;

  const w: Partial<Record<BodyRegion, number>> = {};
  w.foot_l = gauss(t, 0.04, 0.04) * (0.4 + sideL);
  w.foot_r = gauss(t, 0.04, 0.04) * (0.4 + sideR);
  w.calf_l = gauss(t, 0.18, 0.08) * (0.35 + sideL);
  w.calf_r = gauss(t, 0.18, 0.08) * (0.35 + sideR);
  w.thigh_l = gauss(t, 0.38, 0.1) * (0.35 + sideL);
  w.thigh_r = gauss(t, 0.38, 0.1) * (0.35 + sideR);
  w.hips = gauss(t, 0.48, 0.07);
  w.belly = gauss(t, 0.55, 0.07) * front;
  w.torso = gauss(t, 0.58, 0.1);
  w.chest = gauss(t, 0.68, 0.08) * (0.5 + 0.5 * front);
  w.back = gauss(t, 0.65, 0.1) * (0.4 + 0.6 * back);
  w.shoulder_l = gauss(t, 0.75, 0.06) * (0.3 + sideL * 1.2);
  w.shoulder_r = gauss(t, 0.75, 0.06) * (0.3 + sideR * 1.2);
  w.upper_arm_l = gauss(t, 0.62, 0.1) * sideL * (Math.abs(z) > 0.15 ? 1 : 0.3);
  w.upper_arm_r = gauss(t, 0.62, 0.1) * sideR * (Math.abs(z) > 0.15 ? 1 : 0.3);
  w.forearm_l = gauss(t, 0.48, 0.08) * sideL * (Math.abs(z) > 0.2 ? 1 : 0.2);
  w.forearm_r = gauss(t, 0.48, 0.08) * sideR * (Math.abs(z) > 0.2 ? 1 : 0.2);
  w.hand_l = gauss(t, 0.35, 0.05) * sideL * (Math.abs(z) > 0.22 ? 1 : 0.1);
  w.hand_r = gauss(t, 0.35, 0.05) * sideR * (Math.abs(z) > 0.22 ? 1 : 0.1);
  w.neck = gauss(t, 0.88, 0.05);
  return w;
}

function regionSum(rw: Partial<Record<BodyRegion, number>>, regions: BodyRegion[]): number {
  let s = 0;
  for (const r of regions) s = Math.max(s, rw[r] || 0);
  return s;
}

export class BodySculptEngine {
  private axes: BodyMorphAxis[];
  private values: Record<string, number> = {};
  private yMin: number;
  private yMax: number;

  constructor(axes: BodyMorphAxis[] = FULL_BODY_MORPH_CATALOG, yMin = 0, yMax = 2.2) {
    this.axes = axes;
    this.yMin = yMin;
    this.yMax = yMax;
    for (const a of axes) this.values[a.id] = a.default;
  }

  getAxes(): BodyMorphAxis[] { return this.axes; }
  getValues(): Record<string, number> { return { ...this.values }; }

  setMorph(id: string, value: number): void {
    const a = this.axes.find((x) => x.id === id);
    if (!a) return;
    this.values[id] = Math.min(a.max, Math.max(a.min, value));
  }

  setMorphs(v: Record<string, number>): void {
    for (const [k, val] of Object.entries(v)) this.setMorph(k, val);
  }

  reset(): void {
    for (const a of this.axes) this.values[a.id] = a.default;
  }

  randomize(amount = 0.55): void {
    for (const a of this.axes) {
      this.values[a.id] = Math.min(a.max, Math.max(a.min, (Math.random() * 2 - 1) * amount));
    }
  }

  apply(verts: BodySculptVertex[]): void {
    const active = this.axes.filter((a) => Math.abs(this.values[a.id] || 0) > 1e-6);
    const yMin = this.yMin, yMax = this.yMax;
    const h = Math.max(1e-6, yMax - yMin);

    for (let i = 0; i < verts.length; i++) {
      const v = verts[i];
      const [bx, by, bz] = v.base;
      v.out[0] = bx; v.out[1] = by; v.out[2] = bz;
      if (v.bodyWeight < 0.02) continue;

      const rw = v.regionWeights && Object.keys(v.regionWeights).length
        ? v.regionWeights
        : estimateRegionWeights(bx, by, bz, yMin, yMax);

      let dx = 0, dy = 0, dz = 0;
      const signZ = bz >= 0 ? 1 : -1;

      for (const a of active) {
        const val = this.values[a.id] || 0;
        const mask = regionSum(rw, a.regions) * v.bodyWeight;
        if (mask < 0.01) continue;
        const s = val * a.strength * mask;

        switch (a.id) {
          case 'body_scale': dx += s * bx * 0.3; dy += s * (by - yMin) * 0.15; dz += s * bz * 0.3; break;
          case 'height_bias': dy += s * ((by - yMin) / h); break;
          case 'muscle_bulk': dx += s * 0.4; dz += s * signZ * 0.8; break;
          case 'body_fat': dx += s * 0.5; dz += s * signZ * 0.9; break;
          case 'bone_frame': dz += s * signZ; break;
          case 'torso_width': dz += s * signZ; break;
          case 'torso_depth': dx += s; break;
          case 'torso_length': dy += s * 0.6; break;
          case 'chest_size': dx += s * 0.9; dz += s * signZ * 0.5; break;
          case 'chest_width': dz += s * signZ; break;
          case 'pec_definition': dx += s * 0.5; break;
          case 'belly_size': dx += s; dz += s * signZ * 0.4; break;
          case 'belly_depth': dx += s; break;
          case 'back_width': dz += s * signZ; dx -= s * 0.2; break;
          case 'lats': dz += s * signZ * 1.1; dx -= s * 0.15; break;
          case 'shoulder_width': dz += s * signZ * 1.2; break;
          case 'shoulder_height': dy += s; break;
          case 'shoulder_bulk': dz += s * signZ; dx += s * 0.3; break;
          case 'arm_length': dy += s * (by < (yMin + h * 0.7) ? -0.3 : 0.1); dz += s * signZ * 0.2; break;
          case 'upper_arm_size': dz += s * signZ; dx += s * 0.3; break;
          case 'forearm_size': dz += s * signZ * 0.8; break;
          case 'arm_definition': dz += s * signZ * 0.4; break;
          case 'hand_size': dx += s * 0.3; dz += s * signZ * 0.5; dy += s * 0.2; break;
          case 'waist_size': dz += s * signZ; dx += s * 0.5; break;
          case 'waist_height': dy += s; break;
          case 'hip_width': dz += s * signZ; break;
          case 'hip_depth': dx += s * 0.6; break;
          case 'glute_size': dx -= s * 0.8; dz += s * signZ * 0.4; break;
          case 'leg_length': dy += s * ((by - yMin) / h) * 0.8; break;
          case 'thigh_size': dz += s * signZ; dx += s * 0.3; break;
          case 'calf_size': dz += s * signZ * 0.8; break;
          case 'leg_definition': dz += s * signZ * 0.35; break;
          case 'stance_width': dz += s * signZ; break;
          case 'foot_size': dx += s * 0.4; dz += s * signZ * 0.5; break;
          case 'posture_chest_up': dx += s * 0.5; dy += s * 0.3; break;
          case 'posture_slouch': dx -= s * 0.5; dy -= s * 0.2; break;
          case 'shoulder_forward': dx += s * 0.6; break;
          default: dz += s * signZ * 0.3; break;
        }
      }

      v.out[0] = bx + dx;
      v.out[1] = by + dy;
      v.out[2] = bz + dz;
    }
  }

  applyToPositions(
    base: Float32Array,
    out: Float32Array,
    bodyWeights: Float32Array,
  ): void {
    const n = base.length / 3;
    const proxy: BodySculptVertex[] = new Array(n);
    for (let i = 0; i < n; i++) {
      const i3 = i * 3;
      const bx = base[i3], by = base[i3 + 1], bz = base[i3 + 2];
      proxy[i] = {
        base: [bx, by, bz],
        out: [0, 0, 0],
        bodyWeight: bodyWeights[i] ?? 0,
        regionWeights: estimateRegionWeights(bx, by, bz, this.yMin, this.yMax),
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
