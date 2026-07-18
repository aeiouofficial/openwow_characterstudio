/** Appearance state create / merge / validate / serialize. */
import type { AppearanceState, RaceGenderProfile } from './types';

export function createDefaultAppearance(profile: RaceGenderProfile): AppearanceState {
  return structuredClone(profile.defaultAppearance);
}

export function appearanceFromProfile(
  profile: RaceGenderProfile,
  partial?: Partial<AppearanceState>,
): AppearanceState {
  const base = createDefaultAppearance(profile);
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    version: 1,
    race: partial.race ?? profile.race,
    gender: partial.gender ?? profile.gender,
    morphs: { ...base.morphs, ...(partial.morphs || {}) },
    geosets: { ...base.geosets, ...(partial.geosets || {}) },
    colors: { ...base.colors, ...(partial.colors || {}) },
    extras: { ...(base.extras || {}), ...(partial.extras || {}) },
  };
}

export function clampAppearance(state: AppearanceState, profile: RaceGenderProfile): AppearanceState {
  const morphs: Record<string, number> = {};
  for (const a of profile.morphAxes) {
    const v = state.morphs[a.id] ?? a.default;
    morphs[a.id] = Math.min(a.max, Math.max(a.min, v));
  }
  const geosets: AppearanceState['geosets'] = {};
  for (const s of profile.geosetSlots) {
    geosets[s.id] = state.geosets[s.id] ?? s.defaultOptionId;
  }
  const colors: AppearanceState['colors'] = {};
  for (const c of profile.colorChannels) {
    colors[c.id] = state.colors[c.id] ?? (c.default as AppearanceState['colors'][string]);
  }
  return {
    version: 1,
    race: profile.race,
    gender: profile.gender,
    morphs,
    geosets,
    colors,
    headPreset: state.headPreset ?? null,
    makeupPreset: state.makeupPreset ?? null,
    extras: state.extras || {},
  };
}

export function serializeAppearance(state: AppearanceState): string {
  return JSON.stringify(state);
}

export function deserializeAppearance(json: string): AppearanceState {
  const o = JSON.parse(json);
  if (!o || o.version !== 1) throw new Error('Unsupported appearance version');
  return o as AppearanceState;
}

/** Compact binary-friendly pack for netcode (float morphs + enum geosets). */
export function packAppearanceCompact(state: AppearanceState, profile: RaceGenderProfile): {
  morphs: number[];
  geosetIndices: number[];
  colorHex: string[];
  headPreset: number | string | null;
} {
  const morphs = profile.morphAxes.map((a) => state.morphs[a.id] ?? a.default);
  const geosetIndices = profile.geosetSlots.map((s) => {
    const sel = state.geosets[s.id];
    const id = Array.isArray(sel) ? sel[0] : sel;
    const idx = s.options.findIndex((o) => o.id === id);
    return idx < 0 ? 0 : idx;
  });
  const colorHex = profile.colorChannels.map((c) => {
    const v = state.colors[c.id] ?? c.default;
    if (typeof v === 'string') return v;
    return '#888888';
  });
  return { morphs, geosetIndices, colorHex, headPreset: state.headPreset ?? null };
}
