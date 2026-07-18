/**
 * Body morph catalog — gear-safe continuous body sculpt axes.
 * Applied ONLY to body/skin geosets (never armor/weapon meshes) so gear UVs/textures stay correct.
 */
export type BodyMorphAxis = {
  id: string;
  label: string;
  category: BodyMorphCategory;
  min: number;
  max: number;
  default: number;
  strength: number;
  /** Body regions this axis primarily affects. */
  regions: BodyRegion[];
};

export type BodyMorphCategory =
  | 'torso'
  | 'chest'
  | 'shoulders'
  | 'arms'
  | 'hands'
  | 'waist'
  | 'hips'
  | 'legs'
  | 'feet'
  | 'posture'
  | 'bulk'
  | 'proportions';

/** Soft-mask body regions (y-up classic humanoid). */
export type BodyRegion =
  | 'neck'
  | 'torso'
  | 'chest'
  | 'belly'
  | 'shoulder_l'
  | 'shoulder_r'
  | 'upper_arm_l'
  | 'upper_arm_r'
  | 'forearm_l'
  | 'forearm_r'
  | 'hand_l'
  | 'hand_r'
  | 'hips'
  | 'thigh_l'
  | 'thigh_r'
  | 'calf_l'
  | 'calf_r'
  | 'foot_l'
  | 'foot_r'
  | 'back';

const axis = (
  id: string,
  label: string,
  category: BodyMorphCategory,
  regions: BodyRegion[],
  strength = 0.02,
  min = -1,
  max = 1,
  def = 0,
): BodyMorphAxis => ({ id, label, category, regions, min, max, default: def, strength });

export const FULL_BODY_MORPH_CATALOG: BodyMorphAxis[] = [
  // bulk / overall
  axis('body_scale', 'Overall Body Scale', 'proportions', ['torso', 'chest', 'hips', 'thigh_l', 'thigh_r', 'upper_arm_l', 'upper_arm_r'], 0.04),
  axis('height_bias', 'Height Bias', 'proportions', ['torso', 'thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'neck'], 0.03),
  axis('muscle_bulk', 'Muscle Bulk', 'bulk', ['chest', 'shoulder_l', 'shoulder_r', 'upper_arm_l', 'upper_arm_r', 'thigh_l', 'thigh_r', 'back'], 0.025),
  axis('body_fat', 'Body Fat / Softness', 'bulk', ['belly', 'hips', 'chest', 'thigh_l', 'thigh_r'], 0.022),
  axis('bone_frame', 'Bone Frame / Width', 'proportions', ['shoulder_l', 'shoulder_r', 'hips', 'torso'], 0.02),

  // torso / chest
  axis('torso_width', 'Torso Width', 'torso', ['torso', 'chest', 'back'], 0.025),
  axis('torso_depth', 'Torso Depth', 'torso', ['torso', 'chest', 'back'], 0.02),
  axis('torso_length', 'Torso Length', 'torso', ['torso', 'chest', 'belly'], 0.02),
  axis('chest_size', 'Chest Size', 'chest', ['chest'], 0.03),
  axis('chest_width', 'Chest Width', 'chest', ['chest', 'shoulder_l', 'shoulder_r'], 0.022),
  axis('pec_definition', 'Pec / Chest Shape', 'chest', ['chest'], 0.015),
  axis('belly_size', 'Belly Size', 'torso', ['belly'], 0.028),
  axis('belly_depth', 'Belly Depth', 'torso', ['belly'], 0.02),
  axis('back_width', 'Back Width', 'torso', ['back'], 0.02),
  axis('lats', 'Lats / V-Taper', 'torso', ['back', 'torso'], 0.018),

  // shoulders / arms
  axis('shoulder_width', 'Shoulder Width', 'shoulders', ['shoulder_l', 'shoulder_r'], 0.03),
  axis('shoulder_height', 'Shoulder Height', 'shoulders', ['shoulder_l', 'shoulder_r'], 0.015),
  axis('shoulder_bulk', 'Shoulder Bulk', 'shoulders', ['shoulder_l', 'shoulder_r'], 0.02),
  axis('arm_length', 'Arm Length', 'arms', ['upper_arm_l', 'upper_arm_r', 'forearm_l', 'forearm_r'], 0.02),
  axis('upper_arm_size', 'Upper Arm Size', 'arms', ['upper_arm_l', 'upper_arm_r'], 0.022),
  axis('forearm_size', 'Forearm Size', 'arms', ['forearm_l', 'forearm_r'], 0.018),
  axis('arm_definition', 'Arm Definition', 'arms', ['upper_arm_l', 'upper_arm_r', 'forearm_l', 'forearm_r'], 0.012),
  axis('hand_size', 'Hand Size', 'hands', ['hand_l', 'hand_r'], 0.015),

  // waist / hips
  axis('waist_size', 'Waist Size', 'waist', ['belly', 'hips'], 0.025),
  axis('waist_height', 'Waist Height', 'waist', ['belly', 'hips'], 0.012),
  axis('hip_width', 'Hip Width', 'hips', ['hips'], 0.028),
  axis('hip_depth', 'Hip Depth', 'hips', ['hips'], 0.018),
  axis('glute_size', 'Glute Size', 'hips', ['hips'], 0.022),

  // legs / feet
  axis('leg_length', 'Leg Length', 'legs', ['thigh_l', 'thigh_r', 'calf_l', 'calf_r'], 0.025),
  axis('thigh_size', 'Thigh Size', 'legs', ['thigh_l', 'thigh_r'], 0.025),
  axis('calf_size', 'Calf Size', 'legs', ['calf_l', 'calf_r'], 0.02),
  axis('leg_definition', 'Leg Definition', 'legs', ['thigh_l', 'thigh_r', 'calf_l', 'calf_r'], 0.012),
  axis('stance_width', 'Stance Width', 'legs', ['thigh_l', 'thigh_r', 'calf_l', 'calf_r', 'foot_l', 'foot_r'], 0.02),
  axis('foot_size', 'Foot Size', 'feet', ['foot_l', 'foot_r'], 0.015),

  // posture
  axis('posture_chest_up', 'Chest Up / Pride', 'posture', ['chest', 'torso', 'back'], 0.012),
  axis('posture_slouch', 'Slouch', 'posture', ['torso', 'back', 'shoulder_l', 'shoulder_r'], 0.012),
  axis('shoulder_forward', 'Shoulders Forward', 'posture', ['shoulder_l', 'shoulder_r'], 0.012),
];

export const BODY_MORPH_CATEGORIES: Array<{ id: BodyMorphCategory; label: string }> = [
  { id: 'proportions', label: 'Proportions' },
  { id: 'bulk', label: 'Bulk' },
  { id: 'torso', label: 'Torso' },
  { id: 'chest', label: 'Chest' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'hands', label: 'Hands' },
  { id: 'waist', label: 'Waist' },
  { id: 'hips', label: 'Hips' },
  { id: 'legs', label: 'Legs' },
  { id: 'feet', label: 'Feet' },
  { id: 'posture', label: 'Posture' },
];

/**
 * Geoset groups that are SAFE to body-morph (skin/body).
 * Everything else (armor, cloak, weapons…) is left untouched so item textures stay correct.
 */
export const BODY_SAFE_GEOSET_GROUPS = new Set([
  'Geoset', 'Geoset0', 'Body', 'Skin', 'Torso', 'Legs', 'Feet', 'Hands',
  'HeadSwap', 'HeadPreset', 'Ears', 'Eyes', // head handled by head sculpt; still "body" skin family
]);

/** Groups that must NEVER receive body morph (gear / attachments). */
export const GEAR_GEOSET_GROUPS = new Set([
  'Gloves', 'Boots', 'Wrists', 'Kneepads', 'Chest', 'Pants', 'Tabard', 'Trousers',
  'Cloak', 'Belt', 'FacialJewelry', 'Piercings', 'Eyeglow', 'EyeGlowB', 'MiscFeature',
  'Shoulder', 'Helm', 'Weapon', 'Shield', 'Quiver', 'Cape',
]);

export function isBodySafeGeoset(group: string | undefined, nodeName: string): boolean {
  const g = group || '';
  const n = nodeName || '';
  if (GEAR_GEOSET_GROUPS.has(g)) return false;
  if (/glove|boot|cloak|tabard|belt|wrist|kneepad|chest|pants|trouser|shoulder|helm|weapon|shield|cape|armor|mail|plate|leather/i.test(n) && !/Geoset0|Torso|Body|Skin/i.test(n)) {
    // armor-like name but allow pure body shells
    if (!/Geoset0$|Torso\d*$|Body/i.test(n)) return false;
  }
  if (BODY_SAFE_GEOSET_GROUPS.has(g)) return true;
  if (/Geoset0|Torso|Body|Skin|HeadSwap|HeadPreset|Ears|Eyes/i.test(n)) return true;
  // Hair / facial hair: optional — morph with head field only, not body bulk
  if (/Hair|Facial/i.test(n) || g === 'Hair' || g.startsWith('Facial')) return false;
  return false;
}
