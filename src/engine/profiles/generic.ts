/**
 * Generic race/gender profile factory — use when a race-specific pack
 * is not yet authored. Still gets the full morph catalog + standard slots.
 */
import type { AppearanceState, GeosetSlot, RaceGenderProfile, RaceId, GenderId } from '../types';
import { morphAxesForProfile } from '../MorphCatalog';

const DEFAULT_HEAD = { yMin: 1.55, yMax: 1.95, xMin: 0.05, headBoneHints: ['head', 'jaw', 'neck', 'face', 'eyelid'] };

/** Per-race head region overrides (y-up, approximate Classic humanoid scales). */
const HEAD_REGIONS: Record<string, RaceGenderProfile['headRegion']> = {
  human_male: { yMin: 1.55, yMax: 1.92, xMin: 0.05, headBoneHints: DEFAULT_HEAD.headBoneHints },
  human_female: { yMin: 1.48, yMax: 1.85, xMin: 0.05, headBoneHints: DEFAULT_HEAD.headBoneHints },
  orc_male: { yMin: 1.90, yMax: 2.32, xMin: 0.15, headBoneHints: DEFAULT_HEAD.headBoneHints },
  orc_female: { yMin: 1.75, yMax: 2.15, xMin: 0.12, headBoneHints: DEFAULT_HEAD.headBoneHints },
  dwarf_male: { yMin: 1.15, yMax: 1.48, xMin: 0.05, headBoneHints: DEFAULT_HEAD.headBoneHints },
  dwarf_female: { yMin: 1.10, yMax: 1.42, xMin: 0.05, headBoneHints: DEFAULT_HEAD.headBoneHints },
  nightelf_male: { yMin: 1.85, yMax: 2.25, xMin: 0.05, headBoneHints: DEFAULT_HEAD.headBoneHints },
  nightelf_female: { yMin: 1.75, yMax: 2.15, xMin: 0.05, headBoneHints: DEFAULT_HEAD.headBoneHints },
  undead_male: { yMin: 1.55, yMax: 1.95, xMin: 0.05, headBoneHints: DEFAULT_HEAD.headBoneHints },
  undead_female: { yMin: 1.50, yMax: 1.90, xMin: 0.05, headBoneHints: DEFAULT_HEAD.headBoneHints },
  tauren_male: { yMin: 2.20, yMax: 2.85, xMin: 0.1, headBoneHints: DEFAULT_HEAD.headBoneHints },
  tauren_female: { yMin: 2.05, yMax: 2.65, xMin: 0.1, headBoneHints: DEFAULT_HEAD.headBoneHints },
  gnome_male: { yMin: 0.85, yMax: 1.15, xMin: 0.03, headBoneHints: DEFAULT_HEAD.headBoneHints },
  gnome_female: { yMin: 0.82, yMax: 1.12, xMin: 0.03, headBoneHints: DEFAULT_HEAD.headBoneHints },
  troll_male: { yMin: 1.95, yMax: 2.45, xMin: 0.1, headBoneHints: DEFAULT_HEAD.headBoneHints },
  troll_female: { yMin: 1.85, yMax: 2.30, xMin: 0.1, headBoneHints: DEFAULT_HEAD.headBoneHints },
};

function basicSlots(prefix: string): GeosetSlot[] {
  return [
    {
      id: 'hair', label: 'Hair', group: 'Hair', mode: 'single', defaultOptionId: 'hair_1',
      options: Array.from({ length: 12 }, (_, i) => ({
        id: `hair_${i + 1}`, label: `Hair ${i + 1}`, variant: i + 1, nodeMatch: `${prefix}_Hair${i + 1}`,
      })),
    },
    {
      id: 'face', label: 'Face', group: 'Face', mode: 'single', defaultOptionId: 'face_1',
      options: Array.from({ length: 8 }, (_, i) => ({
        id: `face_${i + 1}`, label: `Face ${i + 1}`, variant: i + 1, nodeMatch: `${prefix}_Face${i + 1}`,
      })),
    },
    {
      id: 'facial', label: 'Facial Hair', group: 'Facial', mode: 'single', defaultOptionId: null,
      options: Array.from({ length: 8 }, (_, i) => ({
        id: `facial_${i + 1}`, label: `Facial ${i + 1}`, variant: i + 1, nodeMatch: `${prefix}_Facial${i + 1}`,
      })),
    },
    {
      id: 'ears', label: 'Ears', group: 'Ears', mode: 'single', defaultOptionId: 'ears_1',
      options: [1, 2, 3].map((v) => ({
        id: `ears_${v}`, label: `Ears ${v}`, variant: v, nodeMatch: `${prefix}_Ears${v}`,
      })),
    },
    {
      id: 'features', label: 'Features', group: 'Features', mode: 'multi', defaultOptionId: null,
      options: Array.from({ length: 6 }, (_, i) => ({
        id: `feat_${i + 1}`, label: `Feature ${i + 1}`, variant: i + 1, nodeMatch: `${prefix}_Feature${i + 1}`,
      })),
    },
  ];
}

const SKIN_PALETTES: Record<string, Array<{ id: string; label: string; hex: string }>> = {
  human: [
    { id: 'fair', label: 'Fair', hex: '#f0d0b0' }, { id: 'tan', label: 'Tan', hex: '#d0a070' },
    { id: 'brown', label: 'Brown', hex: '#8a5a38' }, { id: 'dark', label: 'Dark', hex: '#4a2e1c' },
  ],
  orc: [
    { id: 'green', label: 'Green', hex: '#5a8f3a' }, { id: 'brown', label: 'Brown', hex: '#8a5a32' },
    { id: 'grey', label: 'Grey', hex: '#8a8a8a' }, { id: 'red', label: 'Red', hex: '#a04030' },
  ],
  nightelf: [
    { id: 'purple', label: 'Purple', hex: '#6a5a9a' }, { id: 'blue', label: 'Blue', hex: '#4a6a9a' },
    { id: 'pink', label: 'Pink', hex: '#9a6a8a' }, { id: 'teal', label: 'Teal', hex: '#4a8a8a' },
  ],
  undead: [
    { id: 'pale', label: 'Pale', hex: '#c0c8b8' }, { id: 'grey', label: 'Grey', hex: '#8a9088' },
    { id: 'green', label: 'Sickly', hex: '#7a9a6a' }, { id: 'blue', label: 'Blue', hex: '#7a8a9a' },
  ],
  default: [
    { id: 'a', label: 'Tone A', hex: '#c0a080' }, { id: 'b', label: 'Tone B', hex: '#8a6a4a' },
    { id: 'c', label: 'Tone C', hex: '#5a8f3a' }, { id: 'd', label: 'Tone D', hex: '#6a6a8a' },
  ],
};

export function createGenericProfile(race: RaceId, gender: GenderId): RaceGenderProfile {
  const key = `${race}_${gender}`;
  const morphAxes = morphAxesForProfile('all');
  const prefix = `${race}${gender === 'female' ? 'female' : 'male'}_hd`;
  const skinPal = SKIN_PALETTES[race] || SKIN_PALETTES.default;
  const morphs: Record<string, number> = {};
  for (const a of morphAxes) morphs[a.id] = a.default;

  const defaultAppearance: AppearanceState = {
    version: 1,
    race,
    gender,
    morphs,
    geosets: { hair: 'hair_1', face: 'face_1', facial: null, ears: 'ears_1', features: [] },
    colors: {
      skin: skinPal[0].hex,
      hair: '#2a2018',
      eyes: '#4080c0',
      makeup: '#00000000',
    },
    headPreset: null,
    makeupPreset: null,
  };

  return {
    id: key,
    race,
    gender,
    label: `${race[0].toUpperCase()}${race.slice(1)} ${gender[0].toUpperCase()}${gender.slice(1)}`,
    modelScale: race === 'tauren' ? 1.15 : race === 'gnome' ? 0.7 : race === 'dwarf' ? 0.85 : 1,
    headRegion: HEAD_REGIONS[key] || { ...DEFAULT_HEAD },
    morphAxes,
    geosetSlots: basicSlots(prefix),
    colorChannels: [
      {
        id: 'skin', label: 'Skin', category: 'skin',
        materialTargets: [{ slot: 0 }, { nameIncludes: 'skin' }, { nameIncludes: 'body' }],
        mode: 'palette', default: skinPal[0].hex, palette: skinPal,
      },
      {
        id: 'hair', label: 'Hair', category: 'hair',
        materialTargets: [{ slot: 1 }, { nameIncludes: 'hair' }],
        mode: 'palette', default: '#2a2018',
        palette: [
          { id: 'black', label: 'Black', hex: '#1a1420' }, { id: 'brown', label: 'Brown', hex: '#5a3a22' },
          { id: 'blonde', label: 'Blonde', hex: '#d4a85a' }, { id: 'red', label: 'Red', hex: '#a04028' },
          { id: 'white', label: 'White', hex: '#e8e8f0' }, { id: 'blue', label: 'Blue', hex: '#3050a0' },
          { id: 'green', label: 'Green', hex: '#308050' }, { id: 'purple', label: 'Purple', hex: '#6a3a8a' },
        ],
      },
      {
        id: 'eyes', label: 'Eyes', category: 'eyes',
        materialTargets: [{ slot: 2 }, { nameIncludes: 'eye' }],
        mode: 'palette', default: '#4080c0',
        palette: [
          { id: 'blue', label: 'Blue', hex: '#3080e0' }, { id: 'brown', label: 'Brown', hex: '#6a4020' },
          { id: 'green', label: 'Green', hex: '#40a040' }, { id: 'hazel', label: 'Hazel', hex: '#a08040' },
          { id: 'purple', label: 'Purple', hex: '#a040e0' }, { id: 'glow', label: 'Glow', hex: '#80ff40' },
        ],
      },
      {
        id: 'makeup', label: 'Makeup / Markings', category: 'makeup',
        materialTargets: [{ nameIncludes: 'makeup' }, { nameIncludes: 'tattoo' }],
        mode: 'palette', default: '#00000000',
        palette: [
          { id: 'none', label: 'None', hex: '#00000000' },
          { id: 'red', label: 'Red', hex: '#a01818' },
          { id: 'black', label: 'Black', hex: '#101010' },
          { id: 'blue', label: 'Blue', hex: '#2858c0' },
          { id: 'white', label: 'White', hex: '#e8e0d0' },
        ],
      },
    ],
    defaultAppearance,
  };
}

export const ALL_RACE_GENDERS: Array<{ race: RaceId; gender: GenderId }> = [
  'human', 'orc', 'dwarf', 'nightelf', 'undead', 'tauren', 'gnome', 'troll',
].flatMap((race) => ([{ race, gender: 'male' as GenderId }, { race, gender: 'female' as GenderId }]));

export function buildAllGenericProfiles(): RaceGenderProfile[] {
  return ALL_RACE_GENDERS.map(({ race, gender }) => createGenericProfile(race, gender));
}
