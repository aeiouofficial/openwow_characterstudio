/**
 * ColorLayer — runtime recolor / palette / HSV for skin, hair, eyes, makeup.
 * Material-agnostic: applies via callbacks so it works with Three MeshStandardMaterial
 * or custom shaders.
 */
import type { ColorChannel, RaceGenderProfile } from './types';

export type ColorValue = string | { h: number; s: number; v: number } | { r: number; g: number; b: number };

export type MaterialProxy = {
  id: string;
  slot?: number;
  name?: string;
  /** Apply a CSS hex or rgb 0-1. */
  setColor?: (hexOrRgb: string | { r: number; g: number; b: number }) => void;
  setMap?: (textureId: string) => void;
  setHSV?: (h: number, s: number, v: number) => void;
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: return { r: v, g: t, b: p };
    case 1: return { r: q, g: v, b: p };
    case 2: return { r: p, g: v, b: t };
    case 3: return { r: p, g: q, b: v };
    case 4: return { r: t, g: p, b: v };
    default: return { r: v, g: p, b: q };
  }
}

export function resolveColor(value: ColorValue): { r: number; g: number; b: number; hex: string } {
  if (typeof value === 'string') {
    const rgb = hexToRgb(value);
    return { ...rgb, hex: value.startsWith('#') ? value : `#${value}` };
  }
  if ('h' in value) {
    const rgb = hsvToRgb(value.h, value.s, value.v);
    const hex =
      '#' +
      [rgb.r, rgb.g, rgb.b]
        .map((c) => Math.round(c * 255).toString(16).padStart(2, '0'))
        .join('');
    return { ...rgb, hex };
  }
  const hex =
    '#' +
    [value.r, value.g, value.b]
      .map((c) => Math.round(c * 255).toString(16).padStart(2, '0'))
      .join('');
  return { ...value, hex };
}

export class ColorLayer {
  private channels: ColorChannel[];
  private values: Record<string, ColorValue> = {};
  private materials: MaterialProxy[] = [];

  constructor(profile: RaceGenderProfile) {
    this.channels = profile.colorChannels;
    for (const c of this.channels) this.values[c.id] = c.default as ColorValue;
  }

  setProfile(profile: RaceGenderProfile): void {
    this.channels = profile.colorChannels;
    const next: Record<string, ColorValue> = {};
    for (const c of this.channels) next[c.id] = this.values[c.id] ?? (c.default as ColorValue);
    this.values = next;
  }

  getChannels(): ColorChannel[] { return this.channels; }
  getValues(): Record<string, ColorValue> { return { ...this.values }; }

  bindMaterials(mats: MaterialProxy[]): void {
    this.materials = mats;
    this.applyAll();
  }

  setColor(channelId: string, value: ColorValue): void {
    if (!this.channels.find((c) => c.id === channelId)) return;
    this.values[channelId] = value;
    this.applyChannel(channelId);
  }

  applyAll(): void {
    for (const c of this.channels) this.applyChannel(c.id);
  }

  private applyChannel(channelId: string): void {
    const ch = this.channels.find((c) => c.id === channelId);
    if (!ch) return;
    const val = this.values[channelId];
    if (val == null) return;

    const targets = this.materials.filter((m) =>
      ch.materialTargets.some((t) => {
        if (t.slot != null && m.slot === t.slot) return true;
        if (t.nameIncludes && m.name && m.name.toLowerCase().includes(t.nameIncludes.toLowerCase())) return true;
        return false;
      }),
    );

    if (ch.mode === 'textureSwap' && typeof val === 'string') {
      for (const m of targets) m.setMap?.(val);
      return;
    }
    if (ch.mode === 'hsv' && typeof val === 'object' && 'h' in val) {
      for (const m of targets) {
        if (m.setHSV) m.setHSV(val.h, val.s, val.v);
        else m.setColor?.(resolveColor(val));
      }
      return;
    }
    const rgb = resolveColor(val);
    for (const m of targets) m.setColor?.(rgb);
  }
}
