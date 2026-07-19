# QA — Character Studio v4.1.1

## Target flow

Application loads → a model enables the top-toolbar **Save Character** action → the complete character ZIP is stored as a `character` Library record → the saved record opens and restores the character → Machinima Studio opens with the Character Studio visual language and retains its eight-track production timeline.

## Automated checks

- Inline ES-module syntax: passed.
- Unit regression suite: 28 tests total; 27 passed, one optional absent fixture skipped, zero failed.
- v4.1.1 release-surface assertions: 57 passed.
- Final release command `npm run qa:release`: passed.
- Distribution ZIP integrity and root SHA-256 checksum: passed.

## Rendered interaction checks

Browser plugin classification: unavailable. Chromium was driven through the DevTools Protocol under Xvfb with software WebGL2. Local/file navigation is blocked by the managed browser policy, so the standalone HTML was injected into an `about:blank` document. QA-only in-memory IndexedDB and digest shims were used solely to exercise the complete Library save/restore interaction in that restricted origin; they are not part of the shipped application.

- Page title and v4.1.1 runtime identity: passed.
- WebGL2 context creation: passed.
- Minimal valid GLB load: passed.
- Top-row Save Character button changed from disabled to ready: passed.
- Full-character save completed: 10 packaged files and a Character Library record.
- Character Library filter, card, preview surface, metadata, Open, and Export actions: passed.
- Opening the saved Character restored its source model and current state: passed.
- Machinima workspace: eight track rows rendered.
- Workspace header height: 66 px, matching Library.
- Accent token: `#5b96e6`; control font: Segoe UI; button radius: 3 px.
- Desktop viewport: 1600 × 861, no page overflow.
- Compact viewport: 960 × 760, Save Character remains visible as an icon, no page overflow, no header overflow.
- Relevant application errors: none.

## Hardware-dependent acceptance

The full workflow should additionally be exercised on the customer workstation with the intended large GLB and texture set to validate IndexedDB quota, pack size, GPU memory, and save duration. Failures are surfaced without discarding the loaded character.
