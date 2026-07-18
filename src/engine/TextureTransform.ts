/**
 * Serializable per-geoset texture transform state.
 * The demo renderer applies this in its fragment shader; game runtimes can bind the
 * same values per mesh/geoset or read the metadata embedded by the GLB exporter.
 */
export type TextureTransformLayer = {
  offsetX: number; offsetY: number;
  scaleX: number; scaleY: number;
  rotation: number;
  shearX: number; shearY: number;
  warpX: number; warpY: number;
  pivotX?: number; pivotY?: number;
};
export type EyeRegionTextureTransform = {
  enabled: boolean;
  centerX: number; centerY: number; spacing: number;
  width: number; height: number; feather: number;
  pair: TextureTransformLayer;
  left: TextureTransformLayer;
  right: TextureTransformLayer;
};
export type GeosetTextureTransform = {
  full: TextureTransformLayer;
  eyes: EyeRegionTextureTransform;
};
export type GeosetTextureTransformMap = Record<string, GeosetTextureTransform>;

export const createTextureTransformLayer = (withPivot = false): TextureTransformLayer => ({
  offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1, rotation: 0,
  shearX: 0, shearY: 0, warpX: 0, warpY: 0,
  ...(withPivot ? { pivotX: 0.5, pivotY: 0.5 } : {}),
});

export const createGeosetTextureTransform = (): GeosetTextureTransform => ({
  full: createTextureTransformLayer(true),
  eyes: {
    enabled: false, centerX: 0.5, centerY: 0.5, spacing: 0.28,
    width: 0.16, height: 0.12, feather: 0.28,
    pair: createTextureTransformLayer(),
    left: createTextureTransformLayer(),
    right: createTextureTransformLayer(),
  },
});
