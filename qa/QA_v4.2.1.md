# QA — Character Studio v4.2.1

## Target flow

Load an opaque black-matte billboard asset → automatic texture analysis classifies only the card material → the live WebGL renderer removes the matte without affecting opaque geometry → per-material overrides remain usable → runtime GLB and Character pack preserve the correction.

## Environment

- Viewport: 1440×900
- Browser: Playwright Chromium under Xvfb
- Rendering: software WebGL2 through SwiftShader
- Browser plugin: unavailable
- Direct local navigation: blocked by managed-browser policy, so the complete HTML was loaded with `page.setContent()`

## Automated checks

| Check | Result |
|---|---:|
| Inline ES-module syntax | Passed |
| Unit suite | 27 passed, 1 optional fixture skipped |
| Retained v4.0 surfaces | 27 passed |
| Retained v4.1.1 surfaces | 57 passed |
| Retained v4.2.0 surfaces | 52 passed |
| New v4.2.1 alpha surfaces | 46 passed |
| Relevant browser console errors | 0 |

## Rendered interaction proof

A generated two-material GLB was used for deterministic validation. One material is a normal opaque backdrop; the second is an opaque PNG card with a black background and a bright soft glow.

- Global automatic matte repair was checked by default.
- The opaque material resolved to `opaque` with normal blending.
- The glow card resolved to `black` with additive blending.
- Forcing the glow material to `opaque` reproduced the black rectangle.
- Restoring Auto removed the rectangle and preserved the soft glow.
- The material inspector displayed a checkerboard preview and identified the source as a detected black matte.

## Runtime export proof

`StudioAPI.exportGlbRuntime()` produced a GLB whose corrected material:

- uses glTF `alphaMode: "BLEND"`;
- contains `characterStudioAlphaMatte.bakedIntoTexture: true`;
- embeds a new PNG with alpha baked into its pixels;
- measured alpha `0` at the black corner and `255` at the glow center;
- records the alpha-ready runtime metadata in the glTF asset extras.

## Character/content-pack proof

The generated pack contained:

- `models/source/alpha_matte_test.glb`;
- `models/alpha_matte_test_runtime_alpha_ready.glb`;
- `runtime/material_alpha.json`;
- appearance/customization state and `SHA256SUMS.txt`.

The ZIP loader prioritizes `*_runtime_alpha_ready.glb` when both source and runtime models are present.

## Remaining risk

Automatic black/white matte classification is intentionally heuristic. Highly unusual artistic textures can be overridden with Texture Alpha, Black Matte, White Matte, or Force Opaque. Final acceptance should include the user’s production character and a representative set of glow, hair-card, smoke, flame, foliage, and particle textures.
