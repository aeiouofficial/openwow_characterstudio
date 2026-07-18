/**
 * GeosetLayer — discrete mesh-variant visibility (Hair, FacialA/B, Ears, HeadPreset, …).
 * Works with any naming scheme via RaceGenderProfile.geosetSlots.
 */
import type { GeosetSlot, RaceGenderProfile } from './types';

export type GeosetNodeInfo = {
  name: string;
  group?: string;
  variant?: number | string;
  /** Three.js Object3D or any object with .visible */
  object: { visible: boolean; name?: string; userData?: Record<string, unknown> };
};

export class GeosetLayer {
  private slots: GeosetSlot[];
  private selection: Record<string, string | string[] | null> = {};
  private nodes: GeosetNodeInfo[] = [];

  constructor(profile: RaceGenderProfile) {
    this.slots = profile.geosetSlots;
    for (const s of this.slots) this.selection[s.id] = s.defaultOptionId;
  }

  setProfile(profile: RaceGenderProfile): void {
    this.slots = profile.geosetSlots;
    const next: Record<string, string | string[] | null> = {};
    for (const s of this.slots) next[s.id] = this.selection[s.id] ?? s.defaultOptionId;
    this.selection = next;
  }

  getSlots(): GeosetSlot[] { return this.slots; }
  getSelection(): Record<string, string | string[] | null> { return { ...this.selection }; }

  /** Register scene nodes (call after GLTF load). */
  bindNodes(nodes: GeosetNodeInfo[]): void {
    this.nodes = nodes;
    this.applyVisibility();
  }

  /** Auto-bind from a Three scene graph using node.userData or name patterns. */
  bindFromScene(root: { traverse: (fn: (o: any) => void) => void }): void {
    const nodes: GeosetNodeInfo[] = [];
    root.traverse((o: any) => {
      if (!o.isMesh && !o.isSkinnedMesh) return;
      const ud = o.userData || {};
      const group = ud.geosetGroup as string | undefined;
      const variant = ud.geosetVariant as number | string | undefined;
      nodes.push({
        name: o.name || '',
        group,
        variant,
        object: o,
      });
    });
    this.bindNodes(nodes);
  }

  setOption(slotId: string, optionId: string | string[] | null): void {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot) return;
    if (slot.mode === 'multi') {
      this.selection[slotId] = Array.isArray(optionId) ? optionId : optionId ? [optionId] : [];
    } else {
      this.selection[slotId] = Array.isArray(optionId) ? optionId[0] ?? null : optionId;
    }
    // exclusive groups
    if (slot.exclusiveWith) {
      for (const other of slot.exclusiveWith) {
        if (other !== slotId) this.selection[other] = null;
      }
    }
    this.applyVisibility();
  }

  cycle(slotId: string, dir: 1 | -1 = 1): void {
    const slot = this.slots.find((s) => s.id === slotId);
    if (!slot || slot.options.length === 0) return;
    const cur = this.selection[slotId];
    const curId = Array.isArray(cur) ? cur[0] : cur;
    let idx = slot.options.findIndex((o) => o.id === curId);
    if (idx < 0) idx = 0;
    idx = (idx + dir + slot.options.length) % slot.options.length;
    this.setOption(slotId, slot.options[idx].id);
  }

  applyVisibility(): void {
    // Build set of node names that should be visible from selections
    const wantNames = new Set<string>();
    const wantGroupVariant = new Map<string, Set<string>>();

    for (const slot of this.slots) {
      const sel = this.selection[slot.id];
      const ids = sel == null ? [] : Array.isArray(sel) ? sel : [sel];
      for (const id of ids) {
        const opt = slot.options.find((o) => o.id === id);
        if (!opt) continue;
        wantNames.add(opt.nodeMatch);
        if (!wantGroupVariant.has(slot.group)) wantGroupVariant.set(slot.group, new Set());
        wantGroupVariant.get(slot.group)!.add(String(opt.variant));
      }
    }

    for (const n of this.nodes) {
      const ud = n.object.userData || {};
      const group = n.group ?? (ud.geosetGroup as string | undefined);
      const variant = n.variant ?? ud.geosetVariant;

      // HeadPreset special: only show selected preset
      if (group === 'HeadPreset' || group === 'HeadSwap') {
        const set = wantGroupVariant.get(group) || wantGroupVariant.get('HeadPreset');
        if (set && set.size) {
          n.object.visible = set.has(String(variant));
          continue;
        }
      }

      if (group && wantGroupVariant.has(group)) {
        const set = wantGroupVariant.get(group)!;
        // if slot has a selection for this group, enforce it
        n.object.visible = set.has(String(variant));
        continue;
      }

      // name pattern match
      let matchedSlot = false;
      for (const slot of this.slots) {
        if (slot.group !== group && !n.name.includes(slot.group)) continue;
        matchedSlot = true;
        const sel = this.selection[slot.id];
        const ids = sel == null ? [] : Array.isArray(sel) ? sel : [sel];
        let vis = false;
        for (const id of ids) {
          const opt = slot.options.find((o) => o.id === id);
          if (!opt) continue;
          if (n.name === opt.nodeMatch || n.name.includes(opt.nodeMatch) || this.wildcard(n.name, opt.nodeMatch)) {
            vis = true;
            break;
          }
        }
        n.object.visible = vis;
        break;
      }

      // body / defaultVisible from userData when not part of a controlled slot
      if (!matchedSlot && ud.defaultVisible !== undefined && group) {
        // leave non-customization geosets alone unless we manage that group
        const managed = this.slots.some((s) => s.group === group);
        if (!managed && ud.defaultVisible === false) {
          // keep hidden gear off by default
        }
      }

      // name direct want
      if (wantNames.has(n.name)) n.object.visible = true;
    }
  }

  private wildcard(name: string, pattern: string): boolean {
    if (!pattern.includes('*')) return name === pattern;
    const re = new RegExp('^' + pattern.split('*').map(escapeRe).join('.*') + '$');
    return re.test(name);
  }
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
