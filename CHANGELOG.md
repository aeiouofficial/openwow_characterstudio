# Changelog

## 4.2.0 — 2026-07-19

### Unified professional workspace
- Added five task-focused Machinima layouts: Edit, Animate, Camera, Audio, and Review.
- Added collapsible and pointer-resizable Production Browser, Properties, stage, and timeline docks with persisted dimensions.
- Added a searchable command palette, panel visibility controls, keyboard layout switching, richer tool grouping, and accessible delayed tooltips.
- Rebuilt the Properties inspector as searchable, keyboard-accessible accordion sections with persisted open states.
- Added compact single-panel overlays with click-away dismissal instead of off-screen or overlapping docks.

### Main editor usability
- Added sticky Character and Materials & Output panel headers with setting search, All/Core/Advanced scopes, visible-section counts, expand/collapse-all actions, and dock collapse controls.
- Added resizable main-editor side docks and a public `StudioAPI.panels` surface.
- Improved section hierarchy, spacing, active-state visibility, metal textures, borders, depth, controls, empty states, and reduced-motion behavior throughout.

### Animation and workflow polish
- Added a dedicated Animation workspace, draggable duration badges, direct viewport animation preview, loop/hold behavior controls for selected animation clips, and guided first-shot onboarding.
- Updated desktop and compact responsive behavior, release assertions, docs, screenshots, and QA evidence.
- Prioritized Open Model, Save Character, Library, and Scene Studio in the compact top bar so primary workspace actions never scroll out of view.
- Routed Machinima autosave through storage-safe helpers so restricted contexts degrade silently instead of logging repeated persistence warnings.

## 4.1.1 — 2026-07-19

- Added a dedicated top-bar Save Character action and full `character` Library record type.
- Character saves now package the model, textures, complete current state, gearsets, preview, manifest, and SHA-256 checksums.
- Added one-click Character restoration and public Library API methods.
- Unified Machinima Studio with the main Character Studio visual system across desktop and responsive layouts.
- Added the Character Library filter, `Ctrl+Alt+S` shortcut, restricted-storage fallbacks, compact header cleanup, release assertions, and documentation for the new workflows.

## 4.1.0 — 2026-07-19

### Machinima Studio Elite
- Added world-space camera targets, exact camera transforms, editable movement presets, richer keys, and camera API controls.
- Added direct timeline drops, source slip, marker dragging, track reordering, clipboard operations, fit/follow navigation, and extended shortcuts.
- Added clip/track stereo pan, media lifecycle cleanup, and long-media project auto-extension.
- Added persistent scene media and portable project ZIPs with media remapping and SHA-256 checksums.
- Added 1080p/1440p/4K/custom WebM render settings, project/loop ranges, progress, cancellation, and canvas restoration.
- Hardened responsive layout, inspector controls, runtime API, schema normalization, documentation, and release QA.

## 4.0.0 — 2026-07-19

### Machinima Studio Pro
- Rebuilt Scene Studio as a full nonlinear machinima workspace around the real WebGL renderer.
- Added layered camera, scene, animation, reference-video, effects, music, dialogue/voice, and SFX tracks with support for multiple tracks of each type.
- Added frame ruler, timecode, playhead, editable duration and 24/25/30/50/60 fps projects, visible loop in/out range, markers, timeline zoom, and project autosave.
- Added selection and razor tools, dragging, edge trimming, exact start/duration/source-in/speed controls, clip gain and fades, split, duplicate, delete, ripple delete, and keyboard nudging.
- Added snapping to frames, markers, clip edges, or scene-cut boundaries.

### Camera production
- Added timeline camera keyframes for yaw, pitch, dolly distance, target height, field of view, interpolation, and shake.
- Added Smooth, Linear, Ease In, Ease Out, Hold, and Cut interpolation plus track-level handheld motion.
- Added Dolly In/Out, Orbit 90°, Crane Up, Hero Reveal, Camera Cut, and lens presets.
- Added safe-frame/rule-of-thirds stage overlay and derived Cartesian camera-position readout.

### Audio, video and output
- Added music, dialogue/voice, and SFX imports backed by persistent Asset Library records.
- Added waveform previews, overlapping synchronized playback, clip speed/source-in/gain/fades, track gain, mute, and solo.
- Added browser microphone recording to the Dialogue track.
- Added synchronized picture-in-picture reference-video clips.
- Added real-time WebM export from `canvas.captureStream()` with mixed timeline audio attached through `MediaStreamDestination`.

### Persistence and integration
- Added `machinima`, `audio`, and `video` Asset Library record types and full Library previews/filtering/apply behavior.
- Added local project recovery, portable JSON import/export, Library project saves with viewport previews, and public `StudioAPI.machinima` methods.
- Added undo/redo history for project editing and context menus for clips, keys, markers, and tracks.

### UI and hardening
- Added a modern three-region production layout with Production Browser, live stage, inspector, and full-width timeline.
- Added compact-desktop and mobile-width responsive behavior with an inspector drawer and reduced workspace chrome.
- Added input validation, project normalization, safe media caches, cancellation-safe render finalization, and browser capability fallbacks.
- Automated regression suite: 28 tests total, 27 passed, one optional fixture skipped. `qa:v400` release assertions pass.

## 3.4.0 — 2026-07-19

### Dedicated top-level workspaces
- Added permanent **Library** and **Scene Studio** buttons to the top toolbar. Each opens as a full-width workspace while preserving the existing editor and right-sidebar shortcuts.
- The live WebGL canvas is moved into Scene Studio while it is open and restored to the normal viewport on close; no duplicate renderer or disconnected preview state is created.

### Professional Asset Library
- Added searchable visual browsing with type filters, newest/oldest/name/type sorting, persistent Grid/List/Compact layouts, collection counts and storage totals.
- Added thumbnail, image, video, scene-schematic, and structured JSON previews plus a metadata detail inspector.
- Added apply, rename, individual export, delete, direct multi-file intake, save-current-appearance, save-current-scene, and export-all actions.
- Appearances and scenes now save live viewport preview PNGs. Full-library ZIPs include preview sidecars in the manifest and integrity hashes.

### Scene Studio
- Added a focused live stage editor with room, chroma, tracking-marker, room-size, contact-shadow, skymap, and six-face media controls.
- Added a saved-scene gallery that applies presets directly to the live stage and links into the full Library.
- Added explicit responsive grid placement so the preview, controls, and scene rail remain ordered without overlap at compact desktop widths.

### Quality
- Added cancel-safe save dialogs, focus-preserving debounced Library search, selected-state styling, keyboard Escape close behavior, responsive QA, and v3.4.0 regression assertions.
- Existing automated suite remains green: 28 tests total, 27 pass and one optional fixture test skipped.

## 3.3.0 — 2026-07-18

### Backdrop & Post FX
- Added 12 background modes: Studio (legacy dark blue + brightness), Chroma Green `#00B140`, Pure Green `#00FF00`, Chroma Blue `#0047BB`, Pure Blue `#0000FF`, Chroma Magenta `#FF00FF`, 18% Gray, 50% Gray, custom color picker, two-color vertical gradient, flat/equirect backdrop image, and Transparency (live checkerboard).
- GL context now uses `alpha: true` with non-premultiplied output; the Transparency mode shows a true alpha checkerboard behind the model.
- Added post FX: Pixelate/Rasterize (1–16 px), Posterize (2–32 levels) with optional ordered Bayer dithering, and a depth-edge Outline pass. FX render through an offscreen target; MSAA is bypassed while FX are active.
- Added FOV slider (20–90°) and Orthographic projection toggle (sprite-friendly). The sky backdrop uses perspective-style rays even in ortho — cosmetic only.

### Capture & Export
- Screenshot at 1×/2×/4× supersampling to PNG.
- Transparent PNG export (true alpha, no chroma keying needed).
- 8-direction sprite-sheet renderer (single row, fixed yaw steps, transparent or current background) with a JSON meta sidecar.

### Scene Studio (Chroma Room)
- Full recording-studio room around the character: floor, ceiling and four walls in Chroma Green or Chroma Blue.
- Tracking markers (cross pattern) can be toggled per scene; marker color is an auto-contrast tint of the chroma color.
- Skymap (equirect image) can be enabled as the backdrop outside/instead of the room.
- Any face (walls, floor, ceiling) can individually show an image or a video (videos loop muted). Media files are session-only: persisted scene JSON restores face assignments by name but files must be re-picked after reload.
- Room auto-grows to always enclose the camera; faces the camera moves outside of are hidden automatically (dollhouse behavior) so the set never blocks the view.
- With no model loaded the floor sits at standing height below the orbit target to avoid near-plane clipping; with a model it sits exactly at the model's feet.
- Contact shadow (soft radial blob, not raytraced) under the model on the floor, toggleable.

### Asset Library
- Workspace-own asset library backed by IndexedDB: save appearances and gearsets, list, re-apply, delete.
- Every item is exportable any time: single-item ZIP or full-library ZIP with a `SHA256SUMS` manifest.
- When running through `server.mjs`, saves are mirrored to `workspace/library/` on disk and served back via `/api/library`.
- Optional auto-save toggle mirrors every saved gearset into the library.

### State & API
- Background, FX, projection, and scene state are stored in appearance JSON and share links.
- StudioAPI additions: `setBackground/getBackground`, `setFx/getFx`, `setProjection`, `captureScreenshot`, `renderSpriteSheet`, `scene.*`, `library.*`.
- 9 new regression tests (28 total: 27 pass, 1 skipped pack fixture).

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
