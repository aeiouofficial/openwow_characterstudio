# Asset Library — v3.4.0

The Asset Library is the shared, workspace-owned collection for studio presets, captures, media, and imported files. Open it from the dedicated **Library** button in the top toolbar or from the compact right-sidebar library panel.

## Full Library workspace
- Search by name, type, and metadata.
- Filter by asset type and sort by newest, oldest, name, or type.
- Switch between **Grid**, **List**, and **Compact** gallery layouts; the selected layout persists locally.
- Preview saved thumbnails, imported images, looping videos, scene schematics, and structured JSON.
- Inspect metadata and file size in the detail pane.
- Apply compatible appearances, scenes, and gearset collections directly to the editor.
- Rename, export, or delete individual items.
- Add multiple JSON, image, ZIP, video, or other files in one selection.
- Save the current appearance or scene without returning to a sidebar panel.

## What it stores
- **Appearances** — complete appearance JSON with model/customization state and a viewport preview.
- **Scenes** — normalized Scene Studio JSON with a viewport preview.
- **Gearsets** — equipment-set collections from the Gearset Creator.
- **Captures** — screenshots, sprite sheets, and turntables created by the capture tools.
- **Imported assets** — textures/images, videos, packs/ZIPs, JSON documents, and generic files.

## Storage
- **Browser:** IndexedDB `cs_asset_library`, persistent per browser origin.
- **Workspace mirror:** when using `node server.mjs`, each saved record is mirrored to `.character-studio-workspace/library/` through the local bridge. Browser IndexedDB remains the interactive source of truth.
- New JSON-backed appearances and scenes may include a `previewBlob` PNG stored alongside the record.

## Export
- **Export** on an individual item downloads its native JSON or binary payload.
- **Export all** creates one ZIP containing every payload, JSON-backed preview PNG sidecars, `library/library_manifest.json`, and `SHA256SUMS.txt`.

## StudioAPI
`library.list()`, `library.get(id)`, `library.save(kind,name,data)`, `library.remove(id)`, `library.exportOne(id)`, `library.exportAll()`.
