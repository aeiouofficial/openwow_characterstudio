import type { AppearanceState, RaceGenderProfile } from '../types';
import { morphAxesForProfile } from '../MorphCatalog';

const morphAxes = morphAxesForProfile('all');

function makeDefault(): AppearanceState {
  const morphs: Record<string, number> = {};
  for (const a of morphAxes) morphs[a.id] = a.default;
  return {
    version: 1,
    race: 'orc',
    gender: 'male',
    morphs,
    geosets: {
      hair: 'hair_1',
      facialA: 'facialA_2',
      facialB: 'facialB_1',
      ears: 'ears_2',
      eyes: 'eyes_1',
      head: 'head_swap2',
      piercings: [],
      jewelry: null,
    },
    colors: {
      skin: '#5a8f3a',
      hair: '#1a1420',
      eyes: '#e8a020',
      makeup: '#00000000',
    },
    headPreset: null,
    makeupPreset: null,
  };
}

/** Orc male profile — matches orcmale_hd / orcbase geoset naming. */
export const orcMaleProfile: RaceGenderProfile = {
  id: 'orc_male',
  race: 'orc',
  gender: 'male',
  label: 'Orc Male',
  modelScale: 1,
  modelPathHint: 'assets/models/characters/orcbase_charactercreator_v1.0.glb',
  headRegion: {
    yMin: 1.90,
    yMax: 2.32,
    xMin: 0.15,
    headBoneHints: ['head', 'jaw', 'eyelid', 'face'],
  },
  morphAxes,
  geosetSlots: [
    {
      id: 'head',
      label: 'Head / Face Preset',
      group: 'HeadPreset',
      mode: 'single',
      defaultOptionId: 'head_swap2',
      options: [
        { id: 'head_swap2', label: 'Default HD Head', variant: 2, nodeMatch: 'orcmale_hd_HeadSwap2' },
        { id: 'head_preset1', label: 'Young Warrior', variant: 1, nodeMatch: 'orcmale_hd_HeadPreset1' },
        { id: 'head_preset2', label: 'Battle Veteran', variant: 2, nodeMatch: 'orcmale_hd_HeadPreset2' },
        { id: 'head_preset3', label: 'Scarred Veteran', variant: 3, nodeMatch: 'orcmale_hd_HeadPreset3' },
        { id: 'head_preset4', label: 'Shaman Elder', variant: 4, nodeMatch: 'orcmale_hd_HeadPreset4' },
        { id: 'head_preset5', label: 'Warchief', variant: 5, nodeMatch: 'orcmale_hd_HeadPreset5' },
      ],
    },
    {
      id: 'hair',
      label: 'Hair',
      group: 'Hair',
      mode: 'single',
      defaultOptionId: 'hair_1',
      options: Array.from({ length: 29 }, (_, i) => {
        const v = i + 1;
        if (v === 13) return null;
        const labels: Record<number, string> = {
          27: 'High Mohawk (new)',
          28: 'Pompadour (new)',
          29: 'Big Bun (new)',
        };
        return {
          id: `hair_${v}`,
          label: labels[v] || `Hair ${v}`,
          variant: v,
          nodeMatch: `orcmale_hd_Hair${v}`,
        };
      }).filter(Boolean) as any,
    },
    {
      id: 'facialA',
      label: 'Beard / Moustache',
      group: 'FacialA',
      mode: 'single',
      defaultOptionId: 'facialA_2',
      options: [
        ...Array.from({ length: 16 }, (_, i) => {
          const v = i + 2;
          return { id: `facialA_${v}`, label: `FacialA ${v}`, variant: v, nodeMatch: `orcmale_hd_FacialA${v}` };
        }),
        { id: 'facialA_18', label: 'Moustache Walrus (new)', variant: 18, nodeMatch: 'orcmale_hd_FacialA18' },
        { id: 'facialA_19', label: 'Moustache Handlebar (new)', variant: 19, nodeMatch: 'orcmale_hd_FacialA19' },
        { id: 'facialA_20', label: 'Moustache Thin Droop (new)', variant: 20, nodeMatch: 'orcmale_hd_FacialA20' },
      ],
    },
    {
      id: 'facialB',
      label: 'Sideburns / Tusks Style',
      group: 'FacialB',
      mode: 'single',
      defaultOptionId: 'facialB_1',
      options: Array.from({ length: 12 }, (_, i) => {
        const v = i + 1;
        return { id: `facialB_${v}`, label: `FacialB ${v}`, variant: v, nodeMatch: `orcmale_hd_FacialB${v}` };
      }),
    },
    {
      id: 'ears',
      label: 'Ears',
      group: 'Ears',
      mode: 'single',
      defaultOptionId: 'ears_2',
      options: [1, 2, 3].map((v) => ({
        id: `ears_${v}`, label: `Ears ${v}`, variant: v, nodeMatch: `orcmale_hd_Ears${v}`,
      })),
    },
    {
      id: 'eyes',
      label: 'Eyes',
      group: 'Eyes',
      mode: 'single',
      defaultOptionId: 'eyes_1',
      options: [{ id: 'eyes_1', label: 'Eyes', variant: 1, nodeMatch: 'orcmale_hd_Eyes1' }],
    },
    {
      id: 'piercings',
      label: 'Piercings',
      group: 'Piercings',
      mode: 'multi',
      defaultOptionId: null,
      options: [1, 2, 3, 4, 5].map((v) => ({
        id: `piercings_${v}`, label: `Piercing ${v}`, variant: v, nodeMatch: `orcmale_hd_Piercings${v}`,
      })),
    },
    {
      id: 'jewelry',
      label: 'Facial Jewelry',
      group: 'FacialJewelry',
      mode: 'single',
      defaultOptionId: null,
      options: [1, 2, 3].map((v) => ({
        id: `jewelry_${v}`, label: `Jewelry ${v}`, variant: v, nodeMatch: `orcmale_hd_FacialJewelry${v}`,
      })),
    },
    {
      id: 'eyeglow',
      label: 'Eye Glow',
      group: 'Eyeglow',
      mode: 'single',
      defaultOptionId: null,
      options: [1, 2, 3, 4, 5].map((v) => ({
        id: `eyeglow_${v}`, label: `Eyeglow ${v}`, variant: v, nodeMatch: `orcmale_hd_Eyeglow${v}`,
      })),
    },
  ],
  colorChannels: [
    {
      id: 'skin',
      label: 'Skin',
      category: 'skin',
      materialTargets: [{ slot: 0 }, { nameIncludes: 'data-1' }, { nameIncludes: 'mat_preset' }, { nameIncludes: 'mat_skin' }],
      mode: 'palette',
      default: '#5a8f3a',
      palette: [
        { id: 'green', label: 'Green', hex: '#5a8f3a' },
        { id: 'olive', label: 'Olive', hex: '#6b8f3a' },
        { id: 'brown', label: 'Brown', hex: '#8a5a32' },
        { id: 'grey', label: 'Grey', hex: '#8a8a8a' },
        { id: 'red', label: 'Red', hex: '#a04030' },
        { id: 'sallow', label: 'Sallow', hex: '#9aaa55' },
        { id: 'darkgreen', label: 'Dark Green', hex: '#3a6a28' },
        { id: 'teal', label: 'Teal-Green', hex: '#3a8a6a' },
      ],
    },
    {
      id: 'hair',
      label: 'Hair / Facial Hair',
      category: 'hair',
      materialTargets: [{ slot: 1 }, { nameIncludes: 'data-6' }, { nameIncludes: 'mat_hair' }],
      mode: 'palette',
      default: '#1a1420',
      palette: [
        { id: 'black', label: 'Black', hex: '#1a1420' },
        { id: 'brown', label: 'Brown', hex: '#5a3a22' },
        { id: 'blonde', label: 'Blonde', hex: '#d4a85a' },
        { id: 'white', label: 'White', hex: '#e8e8f0' },
        { id: 'crimson', label: 'Crimson', hex: '#a02828' },
        { id: 'teal', label: 'Teal', hex: '#2a9a9a' },
        { id: 'pink', label: 'Pink', hex: '#e070b0' },
        { id: 'purple', label: 'Purple', hex: '#6a3a8a' },
        { id: 'orange', label: 'Orange', hex: '#c86820' },
      ],
    },
    {
      id: 'eyes',
      label: 'Eye Color',
      category: 'eyes',
      materialTargets: [{ slot: 2 }, { nameIncludes: 'data-19' }, { nameIncludes: 'mat_eyes' }],
      mode: 'palette',
      default: '#e8a020',
      palette: [
        { id: 'amber', label: 'Amber', hex: '#e8a020' },
        { id: 'blue', label: 'Blue', hex: '#3080e0' },
        { id: 'green', label: 'Green', hex: '#40c040' },
        { id: 'purple', label: 'Purple', hex: '#a040e0' },
        { id: 'crimson', label: 'Crimson', hex: '#e02020' },
        { id: 'ice', label: 'Ice', hex: '#c0e8ff' },
        { id: 'gold', label: 'Gold', hex: '#f0d040' },
        { id: 'fel', label: 'Fel Green', hex: '#80ff40' },
      ],
    },
    {
      id: 'makeup',
      label: 'Warpaint / Makeup Tint',
      category: 'makeup',
      materialTargets: [{ nameIncludes: 'makeup' }],
      mode: 'palette',
      default: '#00000000',
      palette: [
        { id: 'none', label: 'None', hex: '#00000000' },
        { id: 'blood', label: 'Blood Red', hex: '#a01818' },
        { id: 'white', label: 'Bone White', hex: '#e8e0d0' },
        { id: 'black', label: 'Black', hex: '#101010' },
        { id: 'blue', label: 'Shaman Blue', hex: '#2858c0' },
        { id: 'gold', label: 'Gold', hex: '#c0a030' },
      ],
    },
  ],
  headPresets: [
    { id: 1, label: 'Young Warrior', nodeName: 'orcmale_hd_HeadPreset1', materialIndex: 7 },
    { id: 2, label: 'Battle Veteran', nodeName: 'orcmale_hd_HeadPreset2', materialIndex: 8 },
    { id: 3, label: 'Scarred Veteran', nodeName: 'orcmale_hd_HeadPreset3', materialIndex: 9 },
    { id: 4, label: 'Shaman Elder', nodeName: 'orcmale_hd_HeadPreset4', materialIndex: 10 },
    { id: 5, label: 'Warchief', nodeName: 'orcmale_hd_HeadPreset5', materialIndex: 11 },
  ],
  defaultAppearance: makeDefault(),
};
