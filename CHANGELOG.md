# Changelog

All notable changes to this project are documented here. This project adheres to [Semantic Versioning](https://semver.org/).

## [2.0.0] - 2026-07-18

### Added
- **Branding**: application titled “CHARACTER STUDIO - made by AEiOU”.
- **Content-pack ZIP support**: open or drag-drop a pack `.zip`. Built-in ZIP reader (stored + deflate, no libraries); largest GLB auto-loads, all images auto-wire into the texture library, `customization_manifest.json` is parsed, and text docs are viewable in the new **Content Pack** panel with a full file inventory.
- **StudioAPI**: full scriptable surface on `window.StudioAPI` (load, appearance, view modes, geosets, cyclers, sliders, textures, gearsets, pack docs, settings, screenshot) plus `studio:ready` / `studio:modelloaded` / `studio:packloaded` events. Documented in `docs/API.md`.
- **Headless mode**: `?headless=1` renders viewport-only for agents/CI; bundled `qa/headless-runner.mjs` produces a JSON report + screenshot from any model or pack.
- **Viewport Settings**: FOV, turntable auto-rotate + speed, background level, persisted to localStorage.
- Screenshot-accurate rendering (`preserveDrawingBuffer`) for `StudioAPI.screenshot()`.

### Changed
- Verified content-pack loading against a real 89 MB pack; all v1.x features regression-tested.

## [1.6.0] - 2026-07-18

### Added
- **Metal finish** visual pass: machined-gradient controls, bevel highlights, pressed states, recessed wells, procedural noise grain, engraved text, depth shadows, custom scrollbars and slider thumbs. Layout and features unchanged.

## [1.5.0] - 2026-07-18

### Added
- **Flat professional UI** (reference-matched): removed rounded pill/tag chrome; collapsible chevron sections, squared controls, segmented button groups, path-row inputs.
- **View modes**: Textured / Material ID / Geosets with color-separated regions and an on-screen legend.
- **Gearset Creator**: save/apply/delete named gearsets (slot variants + textures), export/import as JSON, persisted to localStorage.
- Group ID color chips on geoset list and equipper slots.

## [1.4.0] - 2026-07-18

### Added
- wow.export-style layout: left-side customization + geoset visibility, right-side character equipper with folder-loaded textures.
- External gear-texture folder loading and per-slot assignment.

## [1.3.0] - 2026-07-18
### Added
- Interactive + external-texture browser QA harness (`qa/browser-smoke.mjs`).

## [1.2.0] - 2026-07-18
### Fixed
- Sideways preview caused by an up-vector cross-product error in `lookAt`.

## [1.1.0] - 2026-07-18
### Added
- Initial Character Studio prototype: pure WebGL2 renderer, geoset panel, appearance JSON.

[2.0.0]: https://github.com/AEiOU/character-studio/releases/tag/v2.0.0
[1.6.0]: https://github.com/AEiOU/character-studio/releases/tag/v1.6.0
[1.5.0]: https://github.com/AEiOU/character-studio/releases/tag/v1.5.0
[1.4.0]: https://github.com/AEiOU/character-studio/releases/tag/v1.4.0
[1.3.0]: https://github.com/AEiOU/character-studio/releases/tag/v1.3.0
[1.2.0]: https://github.com/AEiOU/character-studio/releases/tag/v1.2.0
[1.1.0]: https://github.com/AEiOU/character-studio/releases/tag/v1.1.0
