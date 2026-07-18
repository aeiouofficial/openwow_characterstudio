# QA Report — v3.3.0 "Backdrop, Capture, Scene & Library"

Date: 2026-07-18 · Environment: sandbox Linux, headless Chromium + SwiftShader (real WebGL2 rasterization, not a shim)

## Unit tests (`npm test`)
- 28 tests: **27 pass, 0 fail, 1 skipped** (pack fixture not present — expected).
- 9 new v3.3.0 tests: chroma preset colors, background resolution, cover-scale math, orthographic matrix, sprite-sheet yaw steps, FX normalization, scene defaults, scene normalization, library record validation.

## Headless integration (`node qa/v330-check.mjs`) — ALL PASSED
- Studio boots, `StudioAPI.version === "3.3.0"`, GL context has `alpha:true, premultipliedAlpha:false`.
- All 12 background modes render without GL/console errors; `getBackground`/`getFx` round-trip.
- Post FX (pixelate 6 + posterize 8 + dither + outline) renders; orthographic renders.
- Scene Studio: green room + markers renders, blue room renders, scene state round-trips and **persists across reload** (`cs_scene`).
- Asset Library: save → list → get → delete round-trip (IndexedDB).
- Appearance JSON contains `background`, `fx`, `scene`, `projection`.
- Transparent PNG capture produces a non-trivial data URL; 8-direction sprite sheet + meta.
- All 4 new UI panels present; 1366×768 layout renders; zero unexpected console errors.

## Visual QA (screenshots reviewed by hand)
- `scene-greenscreen-markers-v3.3.0.png`: full chroma-green room, tracking crosses on walls **and floor**, no gaps.
- `scene-bluescreen-v3.3.0.png`, `scene-1366x768-v3.3.0.png`.

## Bug found & fixed during QA
- **Empty-room floor near-plane clipping**: with no model, the orbit target is y=0 and the floor sat 9 mm under the eye — the bottom ~25% of the frame clipped to backdrop. Fix: empty-room floor sits at standing height below the orbit target; with a model it stays exactly at the model's feet. Also added: room auto-grows to enclose the camera; dollhouse hiding of faces the camera is outside of.

## Known limitations (honest)
- Contact shadow is a soft radial blob, not raytraced.
- MSAA is bypassed while post FX are active.
- Sky backdrop uses perspective-style rays in orthographic mode (cosmetic).
- Per-face media files are session-only; persisted scene JSON restores assignments by name after re-pick.
- Outstanding manual check: real Orc GLB on Windows Firefox (same as v3.2.1).
