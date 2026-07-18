/**
 * CharacterStudioEngine — head + body customization facade for beta-testing
 * with live GLB import. Auto-wires geosets discovered from the loaded model.
 */
import { MorphSculptEngine } from './MorphSculptEngine';
import { BodySculptEngine } from './BodySculptEngine';
import { FULL_MORPH_CATALOG } from './MorphCatalog';
import { FULL_BODY_MORPH_CATALOG, isBodySafeGeoset } from './BodyMorphCatalog';
import type { GeosetEntry } from '../io/GltfRuntime';

export type StudioAppearance = {
  version: 2;
  race?: string;
  gender?: string;
  headMorphs: Record<string, number>;
  bodyMorphs: Record<string, number>;
  geosetVisibility: Record<string, boolean>; // node name -> visible
  colors: Record<string, string>;
  materialTextureOverrides: Record<string, string>; // material index/name -> objectURL or label
  animationIndex: number | null;
  headPreset?: number | string | null;
};

export class CharacterStudioEngine {
  readonly head = new MorphSculptEngine({
    id: 'studio',
    race: 'generic',
    gender: 'male',
    label: 'Studio',
    modelScale: 1,
    headRegion: { yMin: 1.55, yMax: 2.35, xMin: 0.05, headBoneHints: ['head', 'jaw', 'eyelid', 'face', 'neck'] },
    morphAxes: FULL_MORPH_CATALOG,
    geosetSlots: [],
    colorChannels: [],
    defaultAppearance: {
      version: 1, race: 'generic', gender: 'male',
      morphs: Object.fromEntries(FULL_MORPH_CATALOG.map(a => [a.id, a.default])),
      geosets: {}, colors: {},
    },
  } as any);

  readonly body = new BodySculptEngine(FULL_BODY_MORPH_CATALOG, 0, 2.4);

  private geosets: GeosetEntry[] = [];
  private colors: Record<string, string> = {
    skin: '#5a8f3a', hair: '#1a1420', eyes: '#e8a020',
  };
  private texOverrides: Record<string, string> = {};
  private animIndex: number | null = null;
  private listeners = new Set<(s: StudioAppearance) => void>();

  onChange(fn: (s: StudioAppearance) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private emit() { const s = this.getAppearance(); for (const fn of this.listeners) fn(s); }

  /** Auto-wire geoset list from loaded GLB (call after import). */
  bindGeosetsFromModel(geosets: GeosetEntry[]): void {
    this.geosets = geosets.map((g) => ({ ...g }));
    // Apply smart defaults: prefer defaultVisible from extras, else show body + one hair
    const hasDefault = geosets.some((g) => g.defaultVisible);
    if (!hasDefault) {
      for (const g of this.geosets) {
        g.visible =
          g.isBodySafe ||
          /Geoset0|HeadSwap2|HeadPreset1|Eyes|Ears2|Hair1|FacialA2|FacialB1|Torso1|Trousers1|Feet1|Boots1|Gloves1/i.test(g.name);
      }
    }
    this.emit();
  }

  getGeosets(): GeosetEntry[] { return this.geosets; }

  setGeosetVisible(nodeName: string, visible: boolean): void {
    const g = this.geosets.find((x) => x.name === nodeName);
    if (g) g.visible = visible;
    this.emit();
  }

  setGeosetGroupVariant(group: string, variant: number | string | null): void {
    for (const g of this.geosets) {
      if (g.group !== group) continue;
      g.visible = variant != null && String(g.variant) === String(variant);
    }
    this.emit();
  }

  showOnlyDefaults(): void {
    for (const g of this.geosets) g.visible = g.defaultVisible;
    this.emit();
  }

  showAllGeosets(on: boolean): void {
    for (const g of this.geosets) g.visible = on;
    this.emit();
  }

  setHeadMorph(id: string, v: number): void { this.head.setMorph(id, v); this.emit(); }
  setBodyMorph(id: string, v: number): void { this.body.setMorph(id, v); this.emit(); }
  setColor(id: string, hex: string): void { this.colors[id] = hex; this.emit(); }
  setMaterialTexture(matKey: string, url: string): void { this.texOverrides[matKey] = url; this.emit(); }
  clearMaterialTexture(matKey: string): void { delete this.texOverrides[matKey]; this.emit(); }
  setAnimation(index: number | null): void { this.animIndex = index; this.emit(); }

  resetMorphs(): void {
    this.head.reset();
    this.body.reset();
    this.emit();
  }

  randomize(amount = 0.6): void {
    this.head.randomize(amount);
    this.body.randomize(amount * 0.7);
    this.emit();
  }

  getAppearance(): StudioAppearance {
    const geosetVisibility: Record<string, boolean> = {};
    for (const g of this.geosets) geosetVisibility[g.name] = g.visible;
    return {
      version: 2,
      headMorphs: this.head.getValues(),
      bodyMorphs: this.body.getValues(),
      geosetVisibility,
      colors: { ...this.colors },
      materialTextureOverrides: { ...this.texOverrides },
      animationIndex: this.animIndex,
    };
  }

  loadAppearance(a: Partial<StudioAppearance>): void {
    if (a.headMorphs) this.head.setMorphs(a.headMorphs);
    if (a.bodyMorphs) this.body.setMorphs(a.bodyMorphs);
    if (a.colors) Object.assign(this.colors, a.colors);
    if (a.materialTextureOverrides) this.texOverrides = { ...a.materialTextureOverrides };
    if (a.animationIndex !== undefined) this.animIndex = a.animationIndex;
    if (a.geosetVisibility) {
      for (const g of this.geosets) {
        if (a.geosetVisibility[g.name] !== undefined) g.visible = a.geosetVisibility[g.name];
      }
    }
    this.emit();
  }

  /** Classify mesh for morph application. */
  static meshMorphMode(name: string, group?: string): 'head' | 'body' | 'none' {
    const g = group || '';
    const n = name || '';
    if (/Hair|Facial|Piercing|Jewelry|Eyeglow|EyeGlow|Cloak|Tabard|Belt|Glove|Boot|Chest|Pants|Wrist|Kneepad|Weapon|Shield/i.test(n) ||
        /Hair|Facial|Piercing|Cloak|Tabard|Belt|Glove|Boot|Chest|Pants/.test(g)) {
      // hair follows head sculpt when near head — handled as head-weighted in renderer
      if (/Hair|Facial/i.test(n) || g === 'Hair' || g.startsWith('Facial')) return 'head';
      return 'none'; // pure gear
    }
    if (/Head|Ear|Eye|HeadSwap|HeadPreset/i.test(n) || /Head|Ear|Eye/.test(g)) return 'head';
    if (isBodySafeGeoset(g, n)) return 'body';
    return 'none';
  }
}
