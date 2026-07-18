/**
 * CharacterAppearanceEngine — race/gender-agnostic facade.
 * Combines morph sculpt + geoset + color layers under one AppearanceState.
 */
import type {
  AppearanceState,
  ColorChannel,
  EngineEvents,
  GeosetSlot,
  Listener,
  MorphAxis,
  RaceGenderProfile,
} from './types';
import { MorphSculptEngine, type SculptVertex } from './MorphSculptEngine';
import { GeosetLayer } from './GeosetLayer';
import { ColorLayer, type ColorValue, type MaterialProxy } from './ColorLayer';
import {
  appearanceFromProfile,
  clampAppearance,
  createDefaultAppearance,
  deserializeAppearance,
  packAppearanceCompact,
  serializeAppearance,
} from './AppearanceState';

export class CharacterAppearanceEngine {
  private profile: RaceGenderProfile;
  private state: AppearanceState;
  readonly morph: MorphSculptEngine;
  readonly geosets: GeosetLayer;
  readonly colors: ColorLayer;
  private listeners: { [K in keyof EngineEvents]?: Set<Listener<K>> } = {};

  constructor(profile: RaceGenderProfile, initial?: Partial<AppearanceState>) {
    this.profile = profile;
    this.state = clampAppearance(appearanceFromProfile(profile, initial), profile);
    this.morph = new MorphSculptEngine(profile);
    this.geosets = new GeosetLayer(profile);
    this.colors = new ColorLayer(profile);
    this.syncLayersFromState();
  }

  getProfile(): RaceGenderProfile { return this.profile; }
  getState(): AppearanceState { return structuredClone(this.state); }
  getMorphAxes(): MorphAxis[] { return this.morph.getAxes(); }
  getGeosetSlots(): GeosetSlot[] { return this.geosets.getSlots(); }
  getColorChannels(): ColorChannel[] { return this.colors.getChannels(); }

  on<K extends keyof EngineEvents>(event: K, fn: Listener<K>): () => void {
    if (!this.listeners[event]) (this.listeners as any)[event] = new Set();
    (this.listeners[event] as Set<Listener<K>>).add(fn);
    return () => (this.listeners[event] as Set<Listener<K>>).delete(fn);
  }

  private emit<K extends keyof EngineEvents>(event: K, payload: EngineEvents[K]): void {
    const set = this.listeners[event] as Set<Listener<K>> | undefined;
    if (!set) return;
    for (const fn of set) fn(payload);
  }

  setProfile(profile: RaceGenderProfile, keepCompatible = true): void {
    const prev = this.state;
    this.profile = profile;
    this.morph.setProfile(profile);
    this.geosets.setProfile(profile);
    this.colors.setProfile(profile);
    if (keepCompatible) {
      this.state = clampAppearance(
        appearanceFromProfile(profile, {
          morphs: prev.morphs,
          geosets: prev.geosets,
          colors: prev.colors,
          headPreset: prev.headPreset,
          makeupPreset: prev.makeupPreset,
          extras: prev.extras,
        }),
        profile,
      );
    } else {
      this.state = createDefaultAppearance(profile);
    }
    this.syncLayersFromState();
    this.emit('profile', profile);
    this.emit('change', this.getState());
  }

  setAppearance(state: AppearanceState): void {
    this.state = clampAppearance(state, this.profile);
    this.syncLayersFromState();
    this.emit('change', this.getState());
  }

  private syncLayersFromState(): void {
    this.morph.setMorphs(this.state.morphs);
    for (const [k, v] of Object.entries(this.state.geosets)) this.geosets.setOption(k, v);
    for (const [k, v] of Object.entries(this.state.colors)) this.colors.setColor(k, v as ColorValue);
  }

  setMorph(id: string, value: number): void {
    this.morph.setMorph(id, value);
    this.state.morphs[id] = this.morph.getValues()[id];
    this.emit('morph', { id, value: this.state.morphs[id] });
    this.emit('change', this.getState());
  }

  setGeoset(slotId: string, optionId: string | string[] | null): void {
    this.geosets.setOption(slotId, optionId);
    this.state.geosets[slotId] = this.geosets.getSelection()[slotId];
    this.emit('geoset', { slotId, value: this.state.geosets[slotId] });
    this.emit('change', this.getState());
  }

  cycleGeoset(slotId: string, dir: 1 | -1 = 1): void {
    this.geosets.cycle(slotId, dir);
    this.state.geosets[slotId] = this.geosets.getSelection()[slotId];
    this.emit('geoset', { slotId, value: this.state.geosets[slotId] });
    this.emit('change', this.getState());
  }

  setColor(channelId: string, value: ColorValue): void {
    this.colors.setColor(channelId, value);
    this.state.colors[channelId] = this.colors.getValues()[channelId];
    this.emit('color', { channelId, value: this.state.colors[channelId] });
    this.emit('change', this.getState());
  }

  setHeadPreset(id: number | string | null): void {
    this.state.headPreset = id;
    // Prefer HeadPreset geoset slot if present
    const slot = this.profile.geosetSlots.find((s) => s.group === 'HeadPreset' || s.id === 'head');
    if (slot && id != null) {
      const opt = slot.options.find((o) => String(o.variant) === String(id) || o.id === String(id));
      if (opt) this.setGeoset(slot.id, opt.id);
    }
    this.emit('change', this.getState());
  }

  reset(): void {
    this.state = createDefaultAppearance(this.profile);
    this.syncLayersFromState();
    this.emit('change', this.getState());
  }

  randomize(amount = 0.7): void {
    this.morph.randomize(amount);
    this.state.morphs = this.morph.getValues();
    for (const slot of this.profile.geosetSlots) {
      if (!slot.options.length) continue;
      const opt = slot.options[Math.floor(Math.random() * slot.options.length)];
      this.geosets.setOption(slot.id, opt.id);
    }
    this.state.geosets = this.geosets.getSelection();
    for (const ch of this.profile.colorChannels) {
      if (ch.palette?.length) {
        const p = ch.palette[Math.floor(Math.random() * ch.palette.length)];
        this.colors.setColor(ch.id, p.hex);
      }
    }
    this.state.colors = this.colors.getValues();
    this.emit('change', this.getState());
  }

  /** Apply morph sculpt to bound vertex data. */
  applyMorphs(verts: SculptVertex[]): void {
    this.morph.apply(verts);
  }

  applyMorphsToPositions(
    base: Float32Array,
    out: Float32Array,
    headWeights: Float32Array,
    rigid?: Uint8Array,
  ): void {
    this.morph.applyToPositions(base, out, headWeights, rigid);
  }

  bindGeosetScene(root: { traverse: (fn: (o: any) => void) => void }): void {
    this.geosets.bindFromScene(root);
  }

  bindMaterials(mats: MaterialProxy[]): void {
    this.colors.bindMaterials(mats);
  }

  toJSON(): string { return serializeAppearance(this.state); }
  fromJSON(json: string): void { this.setAppearance(deserializeAppearance(json)); }
  packCompact() { return packAppearanceCompact(this.state, this.profile); }
}

export type { AppearanceState, RaceGenderProfile, MorphAxis, GeosetSlot, ColorChannel };
