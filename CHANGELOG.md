# Changelog

## 3.2.1 — 2026-07-18

- Rebuilt the right-side **Texture Align & Warp** controls with fully themed buttons, a readable 2×2 scope selector, a larger UV preview, live-state feedback, and Firefox-specific range styling.
- Fixed **Eye pair** preview dragging so normal drag repositions the texture inside both eye masks; Shift-drag now moves the mask pair itself.
- Added **Solo** behavior when selecting a geoset for UV editing so overlapping variants in the same subset are hidden automatically.
- Added independent **All On**, **All Off**, and **Default** controls to every geoset subset.
- Normal checkbox selection is now exclusive inside a subset; Shift-click and the subset **All On** control remain available for intentional overlaps.
- Replaced the old “everything head/body on” startup rule with safe base defaults: one core body, one head family, one eye variant, and one ear variant, with hair, facial, equipment, and other overlapping variants off.
- Added regression coverage for safe startup visibility, subset controls, eye-pair drag semantics, Firefox control styling, and desktop/compact sidebar layouts.

## 3.2.0 — 2026-07-18

- Added a live per-geoset **Texture Align & Warp** editor.
- Added full-texture offset, independent X/Y scale, rotation, pivot, shear, and nonlinear X/Y warp controls.
- Added eye-only correction with draggable paired eye masks, configurable UV centers/spacing/size/feather, shared pair transforms, and independent left/right fine transforms.
- Added UV-wireframe texture preview, drag-to-position, wheel-to-scale, scope reset, copy/paste, group propagation, and left-to-right mirroring.
- Appearance JSON, undo/redo projects, content packs, StudioAPI, and exported GLB metadata now preserve per-geoset texture transforms.
- Added typed `TextureTransform.ts` integration contracts for Vite/game runtimes.
- Kept StudioAppearance v2 imports backward compatible; `geosetTextureTransforms` is optional.

## 3.1.0 — 2026-07-18

### Model and texture bundles
- The model picker and viewport drop zone now accept multiple files in one action.
- `.glb` / `.gltf` companion images are indexed together; external `.bin` and image URIs resolve from the selected bundle.
- Strong base-texture names such as `*_texture_1` auto-bind to the base body material.
- Model ZIPs containing a GLB/GLTF and companion textures load through the same auto-wiring path.
- Corrected glTF texture-to-image source mapping.
- Removed the unintended green default skin multiplier; neutral white now preserves authored base textures.
- Appearance JSON now records `baseTexture`.

### Reusable asset sources
- Added separate `objectcomponents` and `texturecomponents` source roots and named presets.
- Added browser folder indexing and source ZIP indexing for serverless use.
- Added a local Node workspace bridge (`START_CHARACTER_STUDIO.cmd` / `npm start`) for exact filesystem paths, persistent presets, safe ZIP extraction, managed source copies, asset listing, and asset serving.
- Combined source archives are split by their folder roots instead of cross-importing unrelated files.
- Added an **Asset Sources** header shortcut and first-run source setup focus.

## 3.0.0 — 2026-07-18

Complete 24-item roadmap implementation, tier by tier, each gated by automated QA.

### Tier 1 — Correctness
- Unlimited-bone skinning: RGBA32F bone texture + `texelFetch` (220-joint clips play fully; no `uBones[80]` cap, no rest-pose fallback).
- Full animation playback: timeline scrubber, play/pause/loop/speed, crossfade between clips, per-clip loop metadata, scrub-while-paused.
- PBR: metallic-roughness + normal/AO/emissive maps, Cook-Torrance GGX, hemisphere ambient, ACES tone mapping + exposure, sRGB-correct pipeline.

### Tier 2 — Studio completeness
- Projects persisted to IndexedDB + portable `.studio` export/import.
- Undo/redo snapshot stack across all edits (Ctrl+Z / Ctrl+Y).
- 17 race/gender profiles with validated per-profile morph catalogs and geoset groups.
- Texture layer compositor with runtime atlas baking (skin/makeup/warpaint/tattoo stacking).
- Content-pack authoring: manifest validation, SHA256SUMS, versioned ZIP export.

### Tier 3 — Robustness & integration
- ZIP64 reading + streaming pack loading (slice-based; 4 GB cap lifted).
- Draco/Meshopt/KTX2 detection with explicit, actionable rejection (no decoders bundled offline — documented gap).
- GLB export: morphs + sculpt baked into geometry, hidden geosets stripped, round-trip verified.
- MCP server (`qa/mcp-server.mjs`): 14 tools over newline JSON-RPC 2.0 stdio.
- Visual regression harness (`qa/visual-regression.mjs`): pure-node PNG diff against goldens, wired into CI.

### Tier 4 — Pro polish & UX
- Mirror sculpt brush: on-mesh soft-falloff push/pull with X-symmetry, gear-safe.
- Camera shot presets (6) + light presets (4) + turntable WebM render.
- Preset browser with auto-rendered thumbnails (gearsets + head presets).
- Seeded, constraint-respecting randomize (reproducible).
- Color management: exposure control, HDR eye-glow, palette import/export.
- Accessibility: keyboard nav + ARIA on all controls, gamepad input, i18n scaffolding.
- Performance HUD (draw calls / triangles). LOD/frustum culling documented as N/A for a single-character studio.

### Tier 5 — Reach
- Share links: full character state deflate-compressed into the URL fragment; auto-applies on model load.
- Plugin API: `registerPlugin` with custom panels, StudioAPI access, event hooks, locale registration; `.js` plugin file loader.
- Onboarding tour + in-app help/documentation modal.
- Unit test suite (`node --test`) that extracts and tests functions from the shipped HTML itself.

## 2.0.0 — 2026-07-18
- Branding: “CHARACTER STUDIO - made by AEiOU”.
- Content-pack ZIP reader with drag & drop, pack auto-wiring.
- StudioAPI + DOM events, headless mode (`?headless=1`), `qa/headless-runner.mjs`.

## 1.x — 2026-07-18
- 1.6 metal-finish UI · 1.5 flat Blender-style UI, view modes, gearset creator · 1.4 wow.export-style layout · 1.3 QA harness · 1.2 camera fix · 1.1 first prototype.
