# CHARACTER STUDIO - made by AEiOU — API reference (v3.2.1)

Everything below is available on `window.StudioAPI` in `demo/character-studio.html`.
The same surface is exposed to agents via the MCP server (`qa/mcp-server.mjs`) and
usable headlessly (`?headless=1`, no auto-tour, automation-friendly).

## Events (dispatched on `document`)
- `studio:ready` — app booted (`window.__studioReady === true`)
- `studio:modelloaded` — model parsed and first frame rendered
- `studio:packloaded` — content-pack ZIP wired

## Core
| Function | Description |
|---|---|
| `getAppearance()` / `appearance()` | Full appearance state (JSON v2, see Formats) |
| `applyAppearance(json)` | Apply an appearance JSON string/object |
| `getStatus()` | Status-bar text |
| `listGeosets()` / `setGeosetVisible(name, on)` | Geoset tick boxes (prefix-stripped display names) |
| `listTextures()` / `equipTexture(slot, name)` | Gear texture slots from the loaded folder/pack |
| `setSlider(axis, value)` / `cycle(name, dir)` / `getCyclerValue(name)` | Morph controls |
| `saveGearset(name)` / `applyGearsetByName(name)` | Gearsets (localStorage) |
| `setViewMode(mode)` | `texture` \| `matid` \| `groups` |

## Bundle and source-library API (v3.2.1)
| Function | Description |
|---|---|
| `loadFile(file)` | Load one GLB/GLTF file. |
| `loadBundle(files)` | Load a model together with companion images / `.bin`, or a model/source ZIP. |
| `getAssetSources()` | Return named source presets and the active `objectcomponents` / `texturecomponents` roots. |
| `refreshAssetSources()` | Re-read persistent source presets from the local workspace bridge. |
| `openAssetSources()` | Open and focus the source preset editor in the right sidebar. |
| `listBrowserSourceAssets(kind)` | List browser-indexed source paths for `objectcomponents` or `texturecomponents`. |

Local bridge endpoints: `GET /api/health`, `GET|PUT|DELETE /api/source-presets`,
`POST /api/import-zip`, `GET /api/assets`, and `GET /api/asset`. Raw filesystem paths
are intentionally available only through `npm start` / `START_CHARACTER_STUDIO.cmd`;
a `file://` page cannot read arbitrary operating-system paths.

## Animation (Tier 1)
`listAnimations() · playAnimation(index) · getAnimState()` — crossfades automatically;
timeline UI: `#tlPlay #tlScrub #tlLoop #tlSpeed`. Bone matrices live in an RGBA32F
texture (`texelFetch`), so joint count is unlimited.

## Projects, undo, profiles, layers, packs (Tier 2)
- `undo() / redo()` — snapshot command stack (also Ctrl+Z / Ctrl+Y)
- `saveProject(name) / loadProject(name) / listProjects()` — IndexedDB `character-studio/projects`
- `.studio` export/import — portable project file (see Formats)
- `listProfiles() / setProfile(id)` — 17 race/gender profiles, validated geoset groups
- Texture layers: add/reorder/bake to atlas (right panel “Texture Layers”)
- `buildPack(opts)` — authored ZIP with manifest + SHA256SUMS; `validateManifest(m)` → `{ok, errors}`

## Export & integration (Tier 3)
- `exportGlb({includeHidden})` — GLB with morphs + sculpt baked, hidden geosets stripped; result in `window.__glbExport`
- ZIP64 packs load via streaming slices; Draco/Meshopt/KTX2 inputs are rejected with guidance
- MCP: `node qa/mcp-server.mjs` — 14 tools, newline JSON-RPC 2.0, protocol 2024-11-05, env `CS_APP` / `CHROMIUM_PATH`

## Polish (Tier 4)
- Sculpt: `sculptSetEnabled(on) · setSculptBrush({radius,strength,dir,mirror}) · sculptStroke(px,py) · sculptClear() · sculptStats()`
- Shots: `listShotPresets() · applyShotPreset(name) · listLightPresets() · applyLightPreset(name) · getCamera() · renderTurntable(seconds)` (WebM → `window.__turntable`)
- Thumbnails: `generateThumbnails() · listThumbnails()` (gearsets + head presets, localStorage `cs_thumbs`)
- Random: `randomizeSeeded(seed) · getLastSeed()` — deterministic, constraint-respecting
- Color: `setExposure(v) · setEyeGlow(v) · exportPalette() · importPalette(json)`
- Perf: `getPerfStats()` → `{drawCalls, triangles}`

## Reach (Tier 5)
- `buildShareLink()` → URL with `#share=<deflate+base64url>`; auto-applies after the model loads; `applyShareString(link)` applies directly
- `registerPlugin({id, name, onload(api), panel:{title, render(container, api)}})` · `listPlugins()` — plugin `api`: `{studio, on(event,cb), t(key,fallback), registerLocale(lang,dict)}`
- `startTour() / endTour() / openHelp()` — onboarding + in-app docs (auto-start suppressed for `navigator.webdriver` and `?headless=1`)

## Formats
- **Appearance (v2)**: `{version:2, engine:'character-studio_v3.2.1', model, headMorphs, bodyMorphs, geosetVisibility, colors, equippedTextures, baseTexture, textureFolder, viewMode, geosetTextureTransforms?, materialTextureOverrides, animationIndex}`
- **Project**: `{format:'character-studio/project', version:1, project:{…}}` (`.studio`)
- **Palette**: `{format:'character-studio/palette', version:1, colors, exposure, eyeGlow}`
- **Share**: `{format:'character-studio/share', version:1, appearance}` — deflate-raw + base64url in the URL fragment
- **Pack manifest**: `customization_manifest.json` validated by `validateManifest`; packs ship `SHA256SUMS`

## Known limitations
See README “Known limitations” — Draco/Meshopt/KTX2 (detection only), GLB export texture
handling, sculpt persistence, LOD rationale, share links carry state not assets.


## Per-geoset texture transform API (v3.2.1)

`StudioAPI.getGeosetTextureTransform(name)` returns the full/eye transform state.
`StudioAPI.setGeosetTextureTransform(name, state)` applies it live.
`StudioAPI.resetGeosetTextureTransform(name)` clears it.
`StudioAPI.selectTextureGeoset(name)` opens the editor selection.
`StudioAPI.listGeosetTextureTransforms()` returns non-default transforms.

Appearance JSON adds the optional `geosetTextureTransforms` map. Existing StudioAppearance v2 files without that field remain valid. Exported GLBs store each active transform in `node.extras.characterStudioTextureTransform` and a complete map in `asset.extras.characterStudio`.

### v3.2.1 editor behavior

- **Eye pair** drag changes the pair texture offset; Shift-drag changes eye-mask center placement.
- Selecting a geoset for UV editing solos mutually exclusive variants in that subset.
- Each geoset subset exposes independent **All On**, **All Off**, and **Default** controls.
- Safe defaults intentionally activate no more than one variant per subset and leave optional hair/facial/equipment groups disabled.
