import type { GeosetTextureTransform, GeosetTextureTransformMap } from './TextureTransform';

/**
 * Head Customization Engine — shared types
 * Race/gender agnostic. Drop onto any Classic-style character pipeline.
 */

export type RaceId =
  | 'orc' | 'human' | 'dwarf' | 'nightelf' | 'undead' | 'tauren'
  | 'gnome' | 'troll' | 'goblin' | 'bloodelf' | 'draenei' | string;

export type GenderId = 'male' | 'female' | string;

/** Continuous morph slider — applied as smooth spatial field on head verts. */
export type MorphAxis = {
  id: string;
  label: string;
  category: MorphCategory;
  min: number;
  max: number;
  default: number;
  /** Units of displacement at strength=1 (meters, model space). */
  strength: number;
  /** Optional race/gender clamp overrides. */
  clamps?: Partial<Record<`${RaceId}:${GenderId}`, { min?: number; max?: number }>>;
};

export type MorphCategory =
  | 'skull'
  | 'brow'
  | 'eyes'
  | 'nose'
  | 'cheeks'
  | 'mouth'
  | 'jaw'
  | 'chin'
  | 'ears'
  | 'neck'
  | 'asymmetry'
  | 'age'
  | 'expression';

/** Discrete geoset slot (Hair, FacialA, HeadPreset, …). */
export type GeosetSlot = {
  id: string;
  label: string;
  group: string;
  /** multi = allow several visible (piercings); single = exclusive variant */
  mode: 'single' | 'multi' | 'toggle';
  options: GeosetOption[];
  defaultOptionId: string | null;
  exclusiveWith?: string[];
};

export type GeosetOption = {
  id: string;
  label: string;
  variant: number | string;
  /** Node name pattern or exact mesh name on the GLB. */
  nodeMatch: string;
  preview?: string;
};

/** Material / color channel that can be recolored at runtime. */
export type ColorChannel = {
  id: string;
  label: string;
  category: 'skin' | 'hair' | 'eyes' | 'makeup' | 'tattoo' | 'jewelry' | 'glow' | 'custom';
  /** Material slot indices OR material name matchers this channel drives. */
  materialTargets: Array<{ slot?: number; nameIncludes?: string }>;
  mode: 'palette' | 'hsv' | 'rgb' | 'textureSwap';
  palette?: Array<{ id: string; label: string; hex: string }>;
  default: string | { h: number; s: number; v: number } | { r: number; g: number; b: number };
};

/** Full serializable appearance blob — store on character / send over net. */
export type AppearanceState = {
  version: 1;
  race: RaceId;
  gender: GenderId;
  /** Morph slider values keyed by MorphAxis.id */
  morphs: Record<string, number>;
  /** Geoset selections keyed by GeosetSlot.id */
  geosets: Record<string, string | string[] | null>;
  /** Color channel values keyed by ColorChannel.id */
  colors: Record<string, string | { h: number; s: number; v: number } | { r: number; g: number; b: number }>;
  /** Face / head art preset (from character creator packs). */
  headPreset?: number | string | null;
  /** Makeup / warpaint texture overlay id. */
  makeupPreset?: string | null;
  /** Optional per-mesh/geoset texture sampling corrections. */
  textureTransforms?: GeosetTextureTransformMap;
  /** Freeform extras for race-specific systems. */
  extras?: Record<string, unknown>;
};

export type RaceGenderProfile = {
  id: string;
  race: RaceId;
  gender: GenderId;
  label: string;
  /** Model root scale hint. */
  modelScale: number;
  /** Head region gate in model space (y-up). */
  headRegion: {
    yMin: number;
    yMax: number;
    xMin?: number;
    /** Bone name substrings that mark head-weighted verts. */
    headBoneHints: string[];
  };
  morphAxes: MorphAxis[];
  geosetSlots: GeosetSlot[];
  colorChannels: ColorChannel[];
  headPresets?: Array<{ id: number | string; label: string; nodeName?: string; materialIndex?: number }>;
  defaultAppearance: AppearanceState;
  /** Optional path hint for default GLB (game assets). */
  modelPathHint?: string;
};

export type EngineEvents = {
  change: AppearanceState;
  morph: { id: string; value: number };
  geoset: { slotId: string; value: string | string[] | null };
  color: { channelId: string; value: AppearanceState['colors'][string] };
  textureTransform: { geosetName: string; value: GeosetTextureTransform | null };
  profile: RaceGenderProfile;
};

export type Listener<K extends keyof EngineEvents> = (payload: EngineEvents[K]) => void;
