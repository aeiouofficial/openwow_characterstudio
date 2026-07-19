# Character Studio v4.1.1 — Character Library & UI Fidelity

Released: 2026-07-19  
Base: v4.1.0 Machinima Studio Elite

## Release summary

v4.1.1 closes the two visible product gaps in v4.1.0: Character Studio now has a dedicated top-toolbar action for saving the **actual loaded character asset with its current settings**, and Machinima Studio now uses the same visual design system as the main editor instead of looking like a separate application.

## Full-character Library assets

- New top-row **Save Character** button with model-aware disabled, ready, and saving states.
- Saves a reusable `character` Library record rather than only an appearance JSON preset.
- The stored ZIP includes the source model, current texture library and baked atlases, appearance state, geoset visibility, texture assignments and transforms, backdrop/Post FX/projection/scene state, animation state, gearsets, preview image, manifest, integration notes, and `SHA256SUMS.txt`.
- Character records have their own Library filter, category, icon, preview, metadata, export path, and **Open character** action.
- Opening a saved Character restores the model/bundle first, then reapplies its appearance, settings, gearsets, animation state, and viewport state.
- `StudioAPI.library.saveCharacter()` and `StudioAPI.library.openCharacter(record)` expose the workflow programmatically.

## Unified Machinima UI

- Removed the separate cyan/near-black editor theme.
- Machinima panel heads, asset rows, toolbar controls, tabs, inspector sections, inputs, timeline lanes, playhead, dialogs, progress surfaces, toasts, and selected states now use Character Studio’s metal gradients, blue selection treatment, typography, radii, borders, shadows, and spacing.
- The Machinima workspace header now matches the Library and main editor header dimensions and hierarchy.
- Responsive top-bar behavior keeps Save Character available while collapsing its label at narrower widths. At compact editor widths, unrelated character-edit controls are suppressed so the header remains clean and scroll-free.
- Added `Ctrl+Alt+S` as a keyboard-first Save Character shortcut.
- Hardened workspace preference reads/writes so restricted browser storage cannot prevent Library or Machinima initialization.

## Compatibility

Existing v4.0/v4.1 machinima projects, appearances, scenes, captures, media records, and content packs remain compatible. The new `character` record type is additive.
