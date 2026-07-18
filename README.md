# CHARACTER STUDIO - made by AEiOU

Offline, dependency-free WebGL2 character customization studio for glTF/GLB characters
(WoW-style geoset models), with content-pack authoring, headless automation, and an MCP
server for agents. Single-file app: `demo/character-studio.html` — open it in a browser.
No internet access is ever required or used.

### Per-geoset texture alignment and eye correction (v3.4.0)

Select any geoset in **Geoset Visibility** and press **UV**. The **Texture Align & Warp** panel supports:

- Full-texture position, independent X/Y scale, rotation, pivot, shear, and nonlinear warp.
- Eye-only masks with center, spacing, width, height, and feather controls.
- Pair transforms plus independent left/right eye fine alignment.
- In **Eye pair**, drag moves the sampled eye texture; Shift-drag moves the mask pair.
- UV-wireframe preview, drag positioning, wheel scaling, copy/paste, mirror, apply-to-group, and one-click **Solo** preview.
- The right sidebar uses compact themed controls in Chromium and Firefox instead of browser-default sliders and buttons.
- Appearance JSON persistence and GLB node/asset metadata for runtime shader wiring.

The feature modifies sampling in the studio shader; it does not destructively edit the source PNG.

## Feature overview (v3.4.0)

### Rendering & animation
- **Unlimited-bone skinning** — joint matrices in an RGBA32F bone texture read via
  `texelFetch`; 220-joint WoW skins play every clip (no uniform-array cap).
- **Full animation timeline** — scrubber, play/pause, loop toggle, playback speed,
  automatic crossfade between clips, per-clip loop metadata.
- **PBR** — metallic-roughness with normal / AO / emissive maps, hemisphere ambient,
  ACES tone mapping with exposure control, proper sRGB/linear pipeline, HDR eye-glow.

### Studio
- Head + body customization with gear-safe morphs, geoset tick boxes (wow.export-style),
  17 race/gender profiles with validated morph catalogs and geoset maps.
- Safe startup visibility enables only the base body/head/eyes/ears instead of stacking every
  hairstyle or equipment variant. Every subset has **All On / All Off / Default** controls;
  ordinary selection is exclusive, while Shift-click allows intentional overlaps.
- **Mirror sculpt brush** — direct on-mesh sculpting with soft falloff, X-symmetry,
  push/pull, gear-safe (body/head vertices only). Session-only; baked into GLB export.
- Undo/redo command stack (Ctrl+Z / Ctrl+Y) across all edits.
- Texture layer compositor — stack skin/makeup/warpaint/tattoo layers, bake to atlas.
- Projects in IndexedDB + portable `.studio` export/import.
- Seeded constrained randomize, palette import/export, preset browser with
  auto-rendered thumbnails, camera/light shot presets, turntable WebM render.
- Accessibility: full keyboard nav, ARIA labels, gamepad support, i18n scaffolding,
  onboarding tour + in-app help (`?` in the header).
- Performance HUD (draw calls / triangles).

### Dedicated Library and Scene Studio workspaces (v3.4.0)
- Two permanent top-toolbar buttons open full-width **Library** and **Scene Studio** workspaces without leaving the editor.
- **Library** provides visual thumbnails and file previews, search, type filters, sorting, grid/list/compact layouts, a detail inspector, rename/apply/export/delete actions, direct multi-file intake, and a full-library ZIP export.
- Saved appearances and scenes capture a live viewport thumbnail. Imported images and videos preview directly; scene JSON falls back to a readable stage schematic.
- **Scene Studio** moves the real WebGL viewport into a focused stage editor with room, chroma, marker, shadow, sky, and per-face media controls plus a saved-scene gallery. Closing the workspace restores the canvas to the normal editor.
- Both workspaces reuse the existing IndexedDB library and optional Node workspace mirror, so sidebar saves and full-workspace saves stay in one coherent collection.

### Asset bundle and source-library workflow (v3.4.0)
- Open or drag a `.glb` / `.gltf` together with its `.png` / `.jpg` / `.webp` images.
  Strongly named base textures such as `humanmale_hd_texture_1.png` are detected and
  auto-bound to the base body material. External `.gltf` `.bin` and image URIs resolve
  from the same multi-file selection.
- Open a model ZIP containing the model plus companion images for the same automatic flow.
- **Asset Source Presets** keep separate `objectcomponents` and `texturecomponents` roots.
  Presets can reference existing folders or import either source as a ZIP.
- `START_CHARACTER_STUDIO.cmd` / `npm start` runs the local workspace bridge required for
  exact Windows paths, persistent presets, automatic ZIP extraction, and `/api/assets`.
  Plain `file://` mode remains supported with browser folder/ZIP indexing for the session.

### I/O & integration
- Loads `.glb` / `.gltf` and **content-pack ZIPs** (drag & drop), including **ZIP64**;
  entries stream via `File.slice` — packs are not fully buffered in memory.
- **Content-pack authoring**: manifest schema validation, SHA256SUMS, versioned filename.
- **GLB export** of the customized character (morphs + sculpt baked, hidden geosets stripped).
- **Share links** — the full character state deflate-compressed into a URL fragment.
- **Plugin API** — `StudioAPI.registerPlugin({id, name, onload(api), panel})`.
- **Headless mode** (`?headless=1`) and **MCP server** (`qa/mcp-server.mjs`, 14 tools).

## Quick start

For the full reusable source-library workflow on Windows, double-click:

```
START_CHARACTER_STUDIO.cmd
```

Or run `npm start`, then open `http://127.0.0.1:4173/`. The bridge writes imported
source ZIPs and preset metadata to `.character-studio-workspace/` inside the app root.

The original serverless mode still works:

```
open demo/character-studio.html     # any Chromium/Firefox, no server needed
```

Select a model and its companion texture images together, or drag a model ZIP anywhere
in the viewport. Use **Asset Sources** in the header to configure item model and texture roots.

## QA

```
npm test                                            # unit tests (extracted from shipped HTML)
node qa/browser-smoke.mjs <model.glb> [texDir]      # end-to-end browser smoke
CS_TEST_MODEL=<model.glb> node qa/visual-regression.mjs [--update]
node qa/mcp-test.mjs                                # MCP server conformance
node qa/headless-runner.mjs <model.glb>             # headless automation example
```

## MCP server

```
node qa/mcp-server.mjs        # newline JSON-RPC 2.0 on stdio (protocol 2024-11-05)
```
Env: `CS_APP` (path to the HTML), `CHROMIUM_PATH`. Tools: load_model, get_appearance,
apply_appearance, list_geosets, set_geoset, list_animations, play_animation,
get_anim_state, randomize, screenshot, save_project, list_projects, export_glb, build_pack.

## Known limitations (deliberate, offline-first)

- **Draco / Meshopt / KTX2** compressed assets are *detected* and rejected with a clear
  message — no decoders are bundled offline. Re-export uncompressed (e.g. gltf-transform).
- **GLB export** keeps the originally embedded textures; baked texture-layer atlases are
  distributed via content packs, not re-embedded into the GLB.
- **Sculpt deltas** are session-only: included in GLB export, not persisted in `.studio`.
- **LOD / frustum culling**: not applicable to a single-character studio; geoset
  visibility toggles are the LOD mechanism. The perf HUD shows live draw-call/tri counts.
- **Share links** carry state, not assets — the recipient loads the same model/pack file.

## File formats

See `docs/API.md` for the appearance JSON (v2), `.studio` project, palette, share-link,
and content-pack manifest formats, plus the full StudioAPI and plugin API reference.

## License

MIT (code). Bundled demo art is original work — see LICENSE notes in the release repo.
