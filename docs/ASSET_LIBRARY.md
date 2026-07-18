# Asset Library — v3.3.0

Workspace-own library for everything you save in the studio, exportable any time.

## What it stores
- **Appearances** (full appearance JSON incl. background/FX/scene/projection state).
- **Gearsets** (equipment sets from the Gearset Creator). Optional auto-save toggle mirrors every saved gearset into the library.

## Where it lives
- **Browser**: IndexedDB `cs_asset_library` → survives reloads, per-origin.
- **Workspace mirror** (when using `node server.mjs`): every save is mirrored to `workspace/library/` on disk and listed via `GET /api/library`; files can be fetched raw via `GET /api/library/file?path=…` and removed via `DELETE /api/library?path=…`.

## Export
- **Export** on any row → single-item ZIP.
- **Export all** → one ZIP of the whole library including a `SHA256SUMS` manifest for integrity checking.

## StudioAPI
`library.list()`, `library.get(id)`, `library.save(kind,name,data)`, `library.remove(id)`, `library.exportOne(id)`, `library.exportAll()`.
