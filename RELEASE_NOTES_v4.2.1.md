# Character Studio v4.2.1 — Automatic Alpha Matte Transparency

This maintenance release fixes opaque black or white texture cards on glow, flame, smoke, particle, hair-card, foliage, and similar billboard materials. The repair is enabled by default for newly loaded assets and remains inactive on ordinary opaque materials unless the texture analysis finds a real alpha channel or a card-style matte.

## Renderer

- Detects real alpha channels, black mattes, and white mattes from texture content.
- Separates opaque and transparent draw passes.
- Renders transparent geometry after opaque geometry with blending, disabled depth writes, approximate back-to-front ordering, and double-sided material support.
- Uses additive blending automatically for glow-like black-matte cards while retaining normal alpha blending for ordinary transparency.

## Material controls

The **Alpha Mattes & Transparency** inspector provides:

- Global default-on automatic repair.
- Per-material Auto, Texture Alpha, Black Matte, White Matte, and Force Opaque modes.
- Auto, Normal Alpha, and Additive Glow blending.
- Matte threshold, edge softness, and alpha-cutoff controls.
- Checkerboard preview and material source diagnosis.
- Bulk reset to automatic behavior.

## Persistence and game use

- Appearance state and Character Studio manifests retain the global policy and every per-material override.
- GLB material and asset `extras` include the transparency policy.
- **Export GLB** and `StudioAPI.exportGlbRuntime()` bake resolved mattes into actual PNG alpha channels embedded in the GLB.
- Saved Character/content packs include the original source model, `*_runtime_alpha_ready.glb`, and `runtime/material_alpha.json`.
- Reopening a Character/content pack prioritizes the alpha-ready runtime GLB, so the editor and downstream game integration use the corrected result.

## Compatibility

Existing v4.0 machinima, v4.1.1 Character Library, and v4.2.0 unified-workspace workflows remain covered by release assertions. A material can always be forced opaque if automatic classification is unsuitable for an unusual texture.
