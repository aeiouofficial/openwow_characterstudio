/**
 * Maximum practical morph catalog for Classic-style head sculpting.
 * Axes are race-agnostic; RaceGenderProfile can clamp / hide / re-label them.
 */
import type { MorphAxis } from './types';

const axis = (
  id: string,
  label: string,
  category: MorphAxis['category'],
  strength = 0.012,
  min = -1,
  max = 1,
  def = 0,
): MorphAxis => ({ id, label, category, min, max, default: def, strength });

/** Full sculpt catalog — ~70 continuous axes. */
export const FULL_MORPH_CATALOG: MorphAxis[] = [
  // ── Skull / overall ──────────────────────────────────────────
  axis('skull_width', 'Skull Width', 'skull', 0.02),
  axis('skull_height', 'Skull Height', 'skull', 0.018),
  axis('skull_depth', 'Skull Depth', 'skull', 0.016),
  axis('skull_roundness', 'Cranium Roundness', 'skull', 0.01),
  axis('forehead_height', 'Forehead Height', 'skull', 0.014),
  axis('forehead_width', 'Forehead Width', 'skull', 0.012),
  axis('forehead_slope', 'Forehead Slope', 'skull', 0.01),
  axis('temple_width', 'Temple Width', 'skull', 0.012),
  axis('occipital_bulk', 'Back of Head', 'skull', 0.012),

  // ── Brow ─────────────────────────────────────────────────────
  axis('brow_ridge', 'Brow Ridge', 'brow', 0.014),
  axis('brow_height', 'Brow Height', 'brow', 0.01),
  axis('brow_angle', 'Brow Angle', 'brow', 0.008),
  axis('brow_inner', 'Inner Brow', 'brow', 0.008),
  axis('brow_outer', 'Outer Brow', 'brow', 0.008),
  axis('glabella', 'Glabella (between brows)', 'brow', 0.006),

  // ── Eyes ─────────────────────────────────────────────────────
  axis('eye_size', 'Eye Size', 'eyes', 0.01),
  axis('eye_height', 'Eye Height', 'eyes', 0.01),
  axis('eye_depth', 'Eye Depth / Socket', 'eyes', 0.012),
  axis('eye_spacing', 'Eye Spacing', 'eyes', 0.014),
  axis('eye_slant', 'Eye Slant', 'eyes', 0.008),
  axis('eye_openness', 'Eyelid Openness', 'eyes', 0.006),
  axis('under_eye', 'Under-Eye Bag', 'eyes', 0.006),

  // ── Nose ─────────────────────────────────────────────────────
  axis('nose_length', 'Nose Length', 'nose', 0.014),
  axis('nose_width', 'Nose Width', 'nose', 0.012),
  axis('nose_height', 'Nose Bridge Height', 'nose', 0.01),
  axis('nose_tip_up', 'Nose Tip Up/Down', 'nose', 0.01),
  axis('nose_tip_width', 'Nose Tip Width', 'nose', 0.008),
  axis('nose_bridge_width', 'Bridge Width', 'nose', 0.008),
  axis('nostril_flare', 'Nostril Flare', 'nose', 0.008),
  axis('nose_hook', 'Hook / Aquiline', 'nose', 0.01),

  // ── Cheeks ───────────────────────────────────────────────────
  axis('cheekbone_height', 'Cheekbone Height', 'cheeks', 0.01),
  axis('cheekbone_width', 'Cheekbone Width', 'cheeks', 0.014),
  axis('cheekbone_depth', 'Cheekbone Depth', 'cheeks', 0.01),
  axis('cheek_hollow', 'Cheek Hollow / Gaunt', 'cheeks', 0.01),
  axis('cheek_fullness', 'Cheek Fullness', 'cheeks', 0.01),

  // ── Mouth ────────────────────────────────────────────────────
  axis('mouth_width', 'Mouth Width', 'mouth', 0.01),
  axis('mouth_height', 'Mouth Height', 'mouth', 0.008),
  axis('lip_upper', 'Upper Lip', 'mouth', 0.006),
  axis('lip_lower', 'Lower Lip', 'mouth', 0.006),
  axis('lip_fullness', 'Lip Fullness', 'mouth', 0.006),
  axis('mouth_protrusion', 'Mouth Forward', 'mouth', 0.008),
  axis('philtrum', 'Philtrum Depth', 'mouth', 0.004),

  // ── Jaw ──────────────────────────────────────────────────────
  axis('jaw_width', 'Jaw Width', 'jaw', 0.018),
  axis('jaw_height', 'Jaw Height', 'jaw', 0.012),
  axis('jaw_angle', 'Jaw Angle / Square', 'jaw', 0.012),
  axis('jaw_forward', 'Jaw Forward (Underbite)', 'jaw', 0.014),
  axis('mandible_bulk', 'Mandible Bulk', 'jaw', 0.01),
  axis('masseter', 'Masseter / Jaw Muscle', 'jaw', 0.01),

  // ── Chin ─────────────────────────────────────────────────────
  axis('chin_width', 'Chin Width', 'chin', 0.01),
  axis('chin_height', 'Chin Length', 'chin', 0.012),
  axis('chin_depth', 'Chin Forward', 'chin', 0.01),
  axis('chin_cleft', 'Chin Cleft', 'chin', 0.005),
  axis('chin_point', 'Chin Point', 'chin', 0.008),

  // ── Ears ─────────────────────────────────────────────────────
  axis('ear_size', 'Ear Size', 'ears', 0.016),
  axis('ear_height', 'Ear Height', 'ears', 0.01),
  axis('ear_angle', 'Ear Angle / Flare', 'ears', 0.012),
  axis('ear_tip', 'Ear Point / Tip', 'ears', 0.01),
  axis('earlobe', 'Earlobe Length', 'ears', 0.006),

  // ── Neck ─────────────────────────────────────────────────────
  axis('neck_width', 'Neck Width', 'neck', 0.014),
  axis('neck_length', 'Neck Length', 'neck', 0.01),
  axis('adam_apple', 'Adam\'s Apple', 'neck', 0.006),
  axis('nape', 'Nape Bulk', 'neck', 0.008),

  // ── Asymmetry ────────────────────────────────────────────────
  axis('asym_jaw', 'Asym Jaw L/R', 'asymmetry', 0.008),
  axis('asym_eye', 'Asym Eye L/R', 'asymmetry', 0.006),
  axis('asym_brow', 'Asym Brow L/R', 'asymmetry', 0.006),
  axis('asym_mouth', 'Asym Mouth L/R', 'asymmetry', 0.005),
  axis('asym_nose', 'Asym Nose L/R', 'asymmetry', 0.005),

  // ── Age / flesh ──────────────────────────────────────────────
  axis('age_wrinkles', 'Age / Wrinkles Bias', 'age', 0.004),
  axis('age_jowls', 'Jowls', 'age', 0.008),
  axis('age_sag', 'Skin Sag', 'age', 0.006),
  axis('fleshiness', 'Overall Fleshiness', 'age', 0.01),

  // ── Expression bias (bind-pose resting expression) ───────────
  axis('expr_smile', 'Resting Smile', 'expression', 0.006),
  axis('expr_frown', 'Resting Frown', 'expression', 0.006),
  axis('expr_snarl', 'Resting Snarl', 'expression', 0.008),
  axis('expr_squint', 'Resting Squint', 'expression', 0.005),
  axis('expr_brows_raise', 'Resting Raised Brows', 'expression', 0.006),
];

export const MORPH_CATEGORIES: Array<{ id: MorphAxis['category']; label: string }> = [
  { id: 'skull', label: 'Skull' },
  { id: 'brow', label: 'Brow' },
  { id: 'eyes', label: 'Eyes' },
  { id: 'nose', label: 'Nose' },
  { id: 'cheeks', label: 'Cheeks' },
  { id: 'mouth', label: 'Mouth' },
  { id: 'jaw', label: 'Jaw' },
  { id: 'chin', label: 'Chin' },
  { id: 'ears', label: 'Ears' },
  { id: 'neck', label: 'Neck' },
  { id: 'asymmetry', label: 'Asymmetry' },
  { id: 'age', label: 'Age / Flesh' },
  { id: 'expression', label: 'Expression Bias' },
];

export function morphAxesForProfile(
  include: string[] | 'all' = 'all',
  exclude: string[] = [],
): MorphAxis[] {
  const base =
    include === 'all'
      ? FULL_MORPH_CATALOG
      : FULL_MORPH_CATALOG.filter((a) => include.includes(a.id) || include.includes(a.category));
  return base.filter((a) => !exclude.includes(a.id) && !exclude.includes(a.category));
}
