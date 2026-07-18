# Character Studio v3.2.0 QA

## Target flow

Load a GLB/texture bundle, select any geoset, open **Texture Align & Warp**, adjust full-texture or eye-only sampling, save the appearance, and restore the same correction later.

## Results

- JavaScript module syntax: passed.
- TypeScript integration surface: passed with `tsc --noEmit`.
- Unit tests: 14 passed, 1 optional external fixture skipped.
- Exact `humanmale_hd.glb` + `humanmale_hd_texture_1.png` ZIP: loaded as 113 geosets with 113 UV editor buttons.
- Full-texture offset and nonlinear warp: persisted in `geosetTextureTransforms`.
- Eye-only pair mask, spacing, size, feather, and transform: persisted.
- StudioAPI set/get/list round trip: passed.
- Existing StudioAppearance v2 import without texture transforms: passed; optional transform map defaults empty.
- Desktop 1920×1080 and compact 1366×768 editor layouts: passed without runtime errors.
- GLB export carries active transforms in node and asset extras for game/runtime shader wiring.

## Environment note

The sandbox Chromium build exposes no WebGL/WebGL2 context. Browser interaction QA therefore used a no-op WebGL context shim while exercising the real ZIP loader, GLB parser, texture decoder, UV editor DOM, appearance state, and StudioAPI. Shader mapping is covered by shipped-code unit checks; final visual sampling should also be smoke-tested on a normal WebGL2 browser after extraction.
