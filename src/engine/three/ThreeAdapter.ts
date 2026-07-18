/**
 * Three.js adapter — bind CharacterAppearanceEngine to a loaded GLTF character.
 * Peer dependency: three (not bundled). Import from your Vite game as:
 *   import { ThreeAppearanceBinding } from './head-customization-engine/...'
 */
import type { CharacterAppearanceEngine } from '../CharacterAppearanceEngine';
import type { MaterialProxy } from '../ColorLayer';

/** Minimal Three typings so this file typechecks without @types/three. */
export type ThreeLike = {
  Color: new (c?: any) => { set: (c: any) => void; r: number; g: number; b: number };
  Mesh: any;
  SkinnedMesh: any;
  MeshStandardMaterial: any;
  MeshBasicMaterial: any;
};

export type ThreeBindingOptions = {
  /** Recompute vertex normals after morph (slower, better lighting). Default false. */
  recomputeNormals?: boolean;
  /** Only morph meshes whose name matches (default: all skinned with head weights). */
  meshFilter?: (name: string) => boolean;
};

type BoundMesh = {
  mesh: any;
  basePositions: Float32Array;
  workPositions: Float32Array;
  headWeights: Float32Array;
  rigid: Uint8Array;
  positionAttr: any;
};

export class ThreeAppearanceBinding {
  private engine: CharacterAppearanceEngine;
  private root: any;
  private THREE: ThreeLike;
  private meshes: BoundMesh[] = [];
  private opts: ThreeBindingOptions;
  private unsub: (() => void) | null = null;

  constructor(engine: CharacterAppearanceEngine, root: any, THREE: ThreeLike, opts: ThreeBindingOptions = {}) {
    this.engine = engine;
    this.root = root;
    this.THREE = THREE;
    this.opts = opts;
    this.bindGeosets();
    this.bindMaterials();
    this.bindMorphTargets();
    this.unsub = engine.on('change', () => this.applyAll());
    this.applyAll();
  }

  dispose(): void {
    this.unsub?.();
    this.unsub = null;
    this.meshes = [];
  }

  private bindGeosets(): void {
    this.engine.bindGeosetScene(this.root);
  }

  private bindMaterials(): void {
    const mats = new Map<string, MaterialProxy>();
    const THREE = this.THREE;
    this.root.traverse((o: any) => {
      if (!o.isMesh && !o.isSkinnedMesh) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      for (const mat of list) {
        if (!mat || mats.has(mat.uuid)) continue;
        const slotGuess =
          typeof mat.userData?.slot === 'number'
            ? mat.userData.slot
            : undefined;
        mats.set(mat.uuid, {
          id: mat.uuid,
          slot: slotGuess,
          name: mat.name || '',
          setColor: (hexOrRgb) => {
            if (!mat.color) return;
            if (typeof hexOrRgb === 'string') mat.color.set(hexOrRgb);
            else {
              mat.color.r = hexOrRgb.r;
              mat.color.g = hexOrRgb.g;
              mat.color.b = hexOrRgb.b;
            }
            mat.needsUpdate = true;
          },
          setHSV: (h, s, v) => {
            // approximate: multiply base map tint
            if (!mat.color) return;
            const c = new THREE.Color().setHSL(h, s, v * 0.5);
            mat.color.copy(c);
            mat.needsUpdate = true;
          },
        });
      }
    });
    // also index by material array order on first skinned mesh for slot mapping
    let slot = 0;
    this.root.traverse((o: any) => {
      if (!o.isSkinnedMesh) return;
      const list = Array.isArray(o.material) ? o.material : [o.material];
      for (const mat of list) {
        const p = mats.get(mat.uuid);
        if (p && p.slot == null) p.slot = slot;
        slot++;
      }
    });
    this.engine.bindMaterials([...mats.values()]);
  }

  private bindMorphTargets(): void {
    const profile = this.engine.getProfile();
    const boneHints = profile.headRegion.headBoneHints.map((h) => h.toLowerCase());
    this.meshes = [];

    this.root.traverse((o: any) => {
      if (!o.isMesh && !o.isSkinnedMesh) return;
      if (this.opts.meshFilter && !this.opts.meshFilter(o.name || '')) return;
      const geom = o.geometry;
      if (!geom?.attributes?.position) return;
      const pos = geom.attributes.position;
      const n = pos.count;
      const basePositions = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        basePositions[i * 3] = pos.getX(i);
        basePositions[i * 3 + 1] = pos.getY(i);
        basePositions[i * 3 + 2] = pos.getZ(i);
      }
      const workPositions = new Float32Array(basePositions);
      const headWeights = new Float32Array(n);
      const rigid = new Uint8Array(n);

      // bone-weight head influence when skinned
      const skinIndex = geom.attributes.skinIndex;
      const skinWeight = geom.attributes.skinWeight;
      const skeleton = o.skeleton;
      const headBoneIdx = new Set<number>();
      if (skeleton?.bones) {
        skeleton.bones.forEach((b: any, i: number) => {
          const nm = (b.name || '').toLowerCase();
          if (boneHints.some((h) => nm.includes(h))) headBoneIdx.add(i);
        });
      }

      const yMin = profile.headRegion.yMin;
      const yMax = profile.headRegion.yMax;
      const name = (o.name || '').toLowerCase();
      const isRigidMesh = /eye|glow|eyeglow/.test(name);

      for (let i = 0; i < n; i++) {
        if (isRigidMesh) {
          rigid[i] = 1;
          headWeights[i] = 0;
          continue;
        }
        let hw = 0;
        if (skinIndex && skinWeight && headBoneIdx.size) {
          for (let k = 0; k < 4; k++) {
            const bi = skinIndex.getComponent(i, k);
            const w = skinWeight.getComponent(i, k);
            if (headBoneIdx.has(bi)) hw += w;
          }
        } else {
          // region fallback
          const y = basePositions[i * 3 + 1];
          hw = y >= yMin - 0.05 && y <= yMax + 0.05 ? 1 : 0;
        }
        headWeights[i] = hw;
      }

      // ensure buffer is editable
      if (pos.isInterleavedBufferAttribute) {
        // clone to non-interleaved for morph writing
        const arr = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) {
          arr[i * 3] = pos.getX(i);
          arr[i * 3 + 1] = pos.getY(i);
          arr[i * 3 + 2] = pos.getZ(i);
        }
        // dynamic path: write via setXYZ on original if possible
      }
      pos.usage = 35048; // DYNAMIC_DRAW

      this.meshes.push({
        mesh: o,
        basePositions,
        workPositions,
        headWeights,
        rigid,
        positionAttr: pos,
      });
    });
  }

  applyAll(): void {
    // geosets already applied inside engine on set*
    this.engine.geosets.applyVisibility();
    this.engine.colors.applyAll();
    this.applyMorphs();
  }

  applyMorphs(): void {
    for (const m of this.meshes) {
      this.engine.applyMorphsToPositions(m.basePositions, m.workPositions, m.headWeights, m.rigid);
      const pos = m.positionAttr;
      const n = m.workPositions.length / 3;
      for (let i = 0; i < n; i++) {
        pos.setXYZ(i, m.workPositions[i * 3], m.workPositions[i * 3 + 1], m.workPositions[i * 3 + 2]);
      }
      pos.needsUpdate = true;
      if (this.opts.recomputeNormals && m.mesh.geometry.computeVertexNormals) {
        m.mesh.geometry.computeVertexNormals();
      }
      m.mesh.geometry.computeBoundingSphere?.();
    }
  }
}
