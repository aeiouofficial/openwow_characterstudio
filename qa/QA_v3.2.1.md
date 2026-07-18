# Character Studio v3.2.1 QA

Date: 2026-07-18

## Scope

Targeted regression pass for the Texture Align & Warp sidebar, geoset subset controls, and safe default visibility.

## Automated results

- `npm test`: 19 tests total; 18 passed and 1 optional external fixture skipped.
- Safe defaults fixture: visible startup set was `Geoset0`, `HeadSwap2`, `Eyes1`, and `Ears2`; hair, facial, cloak, boots, torso replacement, and HeadPreset stayed off.
- Per-subset controls: Hair **All On** enabled exactly 3 Hair variants and did not affect Boots; Hair **All Off** returned the subset to zero visible variants.
- Eye pair state: numeric Position X persisted as `0.125` with eye-only correction enabled.
- Eye-pair interaction helper: normal drag changes pair texture offset; Shift-drag changes mask center.
- Firefox CSS regression: custom `::-moz-range-track`, `::-moz-range-progress`, and `::-moz-range-thumb` rules are present.

## Browser validation

Browser plugin was unavailable, so Playwright Chromium was used with a no-op WebGL2 QA shim and a generated GLB fixture. The real shipped loader, UI rendering, geoset state, appearance export, and interaction handlers were exercised.

Viewports:

- 2048 × 920 desktop
- 1366 × 768 compact desktop

Checks passed:

- Page initialized without framework overlays or application console errors.
- Right-side editor used themed controls instead of browser-default white buttons.
- Four scopes rendered in a readable 2 × 2 layout.
- UV preview remained usable at both viewports.
- Slider geometry was 164 × 18 CSS pixels at desktop; header buttons remained at least 22 pixels high.
- One subset header and one pair of All On/All Off controls rendered for every fixture group.

## Remaining environment check

The final release should receive one visual smoke test with a real character GLB and hardware/WebGL2 rendering on the target Windows Firefox setup. Shader transform logic and persisted state are covered; the sandbox browser does not expose production WebGL.
