export * from './types';
export { FULL_MORPH_CATALOG, MORPH_CATEGORIES, morphAxesForProfile } from './MorphCatalog';
export { MorphSculptEngine } from './MorphSculptEngine';
export { GeosetLayer } from './GeosetLayer';
export { ColorLayer, hexToRgb, hsvToRgb, resolveColor } from './ColorLayer';
export {
  createDefaultAppearance,
  appearanceFromProfile,
  clampAppearance,
  serializeAppearance,
  deserializeAppearance,
  packAppearanceCompact,
} from './AppearanceState';
export { CharacterAppearanceEngine } from './CharacterAppearanceEngine';
export { orcMaleProfile } from './profiles/orc_male';
export { createGenericProfile, buildAllGenericProfiles, ALL_RACE_GENDERS } from './profiles/generic';
export { ThreeAppearanceBinding } from './three/ThreeAdapter';
export {
  FULL_BODY_MORPH_CATALOG,
  BODY_MORPH_CATEGORIES,
  BODY_SAFE_GEOSET_GROUPS,
  GEAR_GEOSET_GROUPS,
  isBodySafeGeoset,
} from './BodyMorphCatalog';
export type { BodyMorphAxis, BodyMorphCategory, BodyRegion } from './BodyMorphCatalog';
export { BodySculptEngine, estimateRegionWeights } from './BodySculptEngine';
export { CharacterStudioEngine } from './CharacterStudioEngine';
export type { StudioAppearance } from './CharacterStudioEngine';
