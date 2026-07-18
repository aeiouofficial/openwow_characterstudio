<h1 align="center">CHARACTER STUDIO</h1>
<p align="center"><em>made by AEiOU</em></p>
<p align="center">
  A zero-dependency, offline, browser-based character customization studio for Classic-style MMORPGs.<br>
  Load GLB/GLTF models or content-pack ZIPs, sculpt heads &amp; bodies, toggle geosets, equip gear textures, and script everything headlessly.
</p>

<p align="center">
  <img alt="version" src="https://img.shields.io/badge/version-2.0.0-3d7fd6">
  <img alt="license" src="https://img.shields.io/badge/license-MIT-7dbb63">
  <img alt="runtime" src="https://img.shields.io/badge/runtime-WebGL2%20%C2%B7%20no%20deps-c99a5a">
</p>

---

## Highlights

- **Runs anywhere, offline.** The studio is a single self-contained HTML file using raw WebGL2 — no build step, no CDN, no network. Just open it in Chrome/Edge.
- **Loads real assets.** GLB / GLTF out of the box, plus **content-pack `.zip`** drag-and-drop (built-in ZIP reader, no libraries).
- **Gear-safe morphing.** Head and body sculpting only displaces body/skin geosets — armor, cloak, gloves and boots never move, so item textures stay correct.
- **Professional flat UI** with machined-metal styling, collapsible sections, and color-separated geoset/material view modes.
- **Fully scriptable.** `window.StudioAPI` + a headless mode (`?headless=1`) and a Node runner make it drivable by agents and CI.

## Quick start

```bash
# 1. clone
git clone https://github.com/AEiOU/character-studio.git
cd character-studio

# 2. open the app — no build required
#    macOS:  open demo/character-studio.html
#    Linux:  xdg-open demo/character-studio.html
#    or just double-click it in a file browser
```

Then **Open GLB / GLTF / ZIP** (or drag a file onto the viewport) and start customizing.

> Tip: any WoW-export-style content pack (a `.zip` with `models/`, `textures/`, and a `customization_manifest.json`) auto-wires its model, textures and docs into the studio.

## Features

| Area | What you get |
|---|---|
| **Model loading** | GLB / GLTF, drag-drop or file picker; content-pack ZIP auto-wiring |
| **Head sculpt** | ~70 morph axes (skull, brow, jaw, cheeks, nose, eyes, ears, mouth) |
| **Body sculpt** | ~28 gear-safe body morph axes (torso, chest, shoulders, arms, waist, hips, legs, posture, bulk) |
| **Geoset control** | Every mesh node listed with per-geoset visibility, group color chips, All On/Off/Defaults |
| **View modes** | Textured · Material ID · Geosets — the ID modes color-separate the model with an on-screen legend |
| **Customization cyclers** | Face, hair, facial hair, sideburns, ears, eyes + skin/hair/eye color |
| **Character Equipper** | Per-slot gear model variants + external image textures |
| **Gearset Creator** | Save/apply/delete named gearsets, export/import as JSON, persisted to localStorage |
| **Viewport settings** | FOV, turntable auto-rotate + speed, background level (persisted) |
| **Appearance JSON** | Portable state: head/body morphs, geoset visibility, colors, texture overrides, view mode, anim index |
| **Automation** | `window.StudioAPI`, lifecycle events, headless mode, Node CI runner |

## Content-pack ZIP format

Drop any `.zip` onto the app. Wiring is by convention:

```
mypack_v1.0.zip
├─ models/…            → largest .glb/.gltf loads as the model
├─ textures/*.png      → added to the texture library (equippable per slot)
├─ customization/customization_manifest.json  → parsed manifest
└─ *.txt / *.json / *.md / *.csv (<512 KB)     → readable in the Content Pack panel
```

Stored and deflate entries are supported. ZIP64 (archives &gt; 4 GB) is not.

## Automation &amp; headless

Every control is scriptable through `window.StudioAPI`. Open the app with `?headless=1` to render viewport-only for agents and CI, or use the bundled runner:

```bash
node qa/headless-runner.mjs <model.glb|pack.zip> \
  [--appearance=file.json] [--viewmode=tex|matid|groups] \
  [--out=shot.png] [--json=report.json]
```

Full API reference: [`docs/API.md`](docs/API.md).

## Repository layout

```
demo/     self-contained studio app (open this) + standalone head-sculpt editor
src/      TypeScript engine modules (appearance, morphs, geosets, three adapter, glTF runtime)
docs/     API.md (automation) + GEAR_SAFE_BODY.md (morph safety design)
qa/       browser-smoke.mjs (regression) + headless-runner.mjs (CI/agent runner)
```

## Development

```bash
npm install            # dev-only: playwright for QA
npm run qa             # headless regression smoke test
npm run headless -- model.glb --out=shot.png
```

The shipped app has **no runtime dependencies**; `src/` is provided as a typed engine for embedding into a Vite/Three.js project (`three` is a peer dependency there).

## Known limitations

- The demo shader supports up to **80 bones**; skins with more joints (e.g. 220-joint WoW rips) fall back to the rest pose for very heavy animation clips.
- ZIP64 content packs (&gt; 4 GB) are not yet supported.

## Assets &amp; licensing

The **code** in this repository is released under the [MIT License](LICENSE).

This repository does **not** include any game assets. Models, textures and content packs you load are your own responsibility — do not distribute copyrighted game data (e.g. Blizzard/WoW assets) with this tool.

## Changelog

See [CHANGELOG.md](CHANGELOG.md).
