# Asset Library — v4.2.0

The Asset Library is the IndexedDB-backed media and preset collection shared by Character Studio, Scene Studio, and Machinima Studio Elite.

## Record types

- `character` — restorable full-character content pack with source model, textures, current settings, preview, manifest, and checksums

- `appearance` — complete character state and preview
- `scene` — normalized stage state and preview
- `gearset` — equipment preset collection
- `machinima` — complete nonlinear project JSON and preview
- `audio` — music, dialogue, voice recordings, or SFX blob with role/duration metadata
- `video` — reference or scene video with duration metadata
- `screenshot`, `spritesheet`, `turntable` — capture results
- `texture`, `pack`, `json`, `file` — imported source material

## Full Library workspace

- Search names, types, and metadata.
- Filter and sort by newest, oldest, name, or type.
- Grid, List, and Compact layouts.
- Preview images, video, audio, scene schematics, JSON, and live thumbnails.
- Open full Character assets or apply compatible appearances, scenes, gearsets, and machinima projects.
- Rename, inspect, export, or delete records.
- Add multiple files in one selection.
- Export the complete Library with manifest, previews, and checksums.

## Machinima integration

The Production Browser uses the same records. Scene records create scene clips, model animations create animation clips, audio records become Music/Dialogue/SFX clips according to role metadata, video records become Reference Video clips, and machinima records open complete projects.

Library cards are draggable. Dropping a card on a compatible lane inserts it at the pointer time and respects the current snap mode. Audio/video files can also be dropped directly from the operating system.

## Portable project bundles

A project JSON references media by Library ID and stays lightweight. **Export Portable** packages the project and every referenced audio/video/scene payload into one ZIP. Import creates destination Library records and remaps:

- audio/video clip `sourceId`
- scene skymap `sourceId`
- scene face image/video `sourceId`

The bundle includes `SHA256SUMS.txt` for payload verification.

## Storage behavior

- Browser source of truth: IndexedDB database `cs_asset_library`.
- Optional local mirror: `.character-studio-workspace/library/` under the local server.
- Origins are isolated: `file://`, `http://127.0.0.1`, and other hosts do not automatically share IndexedDB.
- The runtime revokes obsolete object URLs and disconnects stale media nodes when project references change.

## StudioAPI

```js
await StudioAPI.library.list()
await StudioAPI.library.get(id)
await StudioAPI.library.save(kind, name, data)
await StudioAPI.library.saveCharacter()
await StudioAPI.library.openCharacter(record)
await StudioAPI.library.remove(id)
await StudioAPI.library.exportOne(id)
await StudioAPI.library.exportAll()
```

## Animation workflow in v4.2

When a model contains animation clips, the Animate workspace shows draggable animation assets with duration badges and a viewport-preview action. Added animation clips expose loop or play-once/hold-last behavior in the Properties inspector.
