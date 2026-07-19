# CHARACTER STUDIO — Machinima Studio Elite

**v4.2.0** turns the existing offline-first WebGL2 character editor into a production-oriented browser machinima workstation. It keeps the real Character Studio renderer, scene state, animation state, Asset Library, capture system, and IndexedDB data model while adding a frame-accurate nonlinear editor rather than a disconnected mock timeline.

## What ships in v4.2.0


### Unified docked workspace UX

- Five one-click layouts—**Edit, Animate, Camera, Audio, and Review**—show the controls needed for the current job instead of presenting every subpanel at equal weight.
- Production Browser, Properties, timeline, and stage areas can be collapsed or resized; sizes and open states persist locally.
- The Properties inspector supports search, keyboard-accessible accordions, and remembered section states.
- `Ctrl+K` opens a command palette for tools, panels, saving, Library access, markers, camera keys, and workspace switching.
- Compact widths use one dock overlay at a time with click-away dismissal, so panels no longer cover one another or render off-screen.

### Main editor panel navigation

- Character and Materials & Output docks now have sticky headers, setting search, **All / Core / Advanced** scopes, visible-section counts, and expand/collapse-all controls.
- Both side docks are collapsible and resizable on desktop, while narrow screens default to compact rails.
- Section cards use clearer open states, stronger metal hierarchy, better spacing, and reduced visual clutter.

### Animation workflow improvements

- The Animate layout filters directly to model clips and the animation track.
- Animation assets show duration and drag status, include direct viewport preview, and expose loop-versus-hold behavior for selected clips.
- Empty workspaces now teach the load → performance → camera workflow instead of showing disconnected blank panels.

### Full-character Library workflow

- A dedicated **Save Character** action is always visible in the top toolbar, becomes available after a model or bundle loads, and is also available with `Ctrl+Alt+S`.
- It stores a restorable Character asset containing the model, current textures, complete appearance/settings state, gearsets, preview, manifest, and integrity hashes.
- Library Character cards can be previewed, exported, renamed, deleted, or opened to restore the complete character.
- Appearance presets remain available for lightweight customization-only reuse.

### One Character Studio design system

- Machinima Studio now uses the same metal surfaces, blue selected states, Segoe UI/mono typography, button construction, inputs, tabs, borders, radii, shadows, and responsive header behavior as the main editor and Library. Restricted browser storage is handled with safe preference fallbacks so workspace initialization cannot be blocked.


### Professional nonlinear timeline

- Eight production track types: **Camera, Scene, Animation, Reference Video, Effects, Music, Dialogue/Voice, and SFX**.
- Any track type can be duplicated and reordered.
- Move, edge-trim, razor/split, source slip, duplicate, delete, ripple delete, copy, cut, and paste.
- Frame, marker, clip-edge, and scene-cut snapping with a visible snap guide.
- Draggable colored markers with names and production notes.
- Mute, solo, lock, visibility, gain, pan, and handheld controls where relevant.
- Fit-to-project and optional auto-follow playhead behavior.
- Exact timecode, frame stepping, loop in/out, timeline zoom, and keyboard-first editing.

### Camera direction and movement

- Camera keys store yaw, pitch, dolly distance, world-space target X/Y/Z, field of view, easing, and shake.
- Inspector exposes exact camera position and look-at target values.
- Editable motion presets: Dolly In/Out, Orbit Left/Right, Truck Left/Right, Crane Up/Down, Tilt Up/Down, Hero Reveal, and Camera Cut.
- Preset duration and interpolation are adjustable before insertion; generated keys remain normal editable timeline keys.
- Camera curves, cuts, safe-frame guides, rule-of-thirds guides, lens presets, and handheld motion are available inside the live stage.

### Layered audio and reference media

- Music, dialogue, voice, and SFX live on independent tracks.
- Browser waveform decoding, clip source-in, playback speed, gain, stereo pan, fade-in, and fade-out.
- Track gain and stereo pan, mute/solo routing, and automatic media-node cleanup.
- Microphone takes are saved to the Asset Library and inserted on the Dialogue track.
- Reference video follows the playhead as a planning monitor; scene-face video can be rendered in the WebGL stage.

### Portable productions

- Continuous local autosave plus reusable `machinima` records in the Asset Library.
- Plain project JSON for light interchange.
- **Portable Machinima ZIP** includes project JSON, referenced audio/video/scene media, a remapping manifest, and `SHA256SUMS.txt`.
- Scene skymaps and per-face image/video assignments persist by Asset Library ID and survive portable project import.
- Drag files or Library assets directly onto a compatible track at the intended timeline time.

### Master rendering

- Real-time browser WebM master with the live WebGL stage and mixed timeline audio.
- Project or loop-range rendering.
- 1920×1080, 2560×1440, 3840×2160, or custom output dimensions.
- Configurable video bitrate, progress display, cancellation, and automatic canvas restoration.

## Quick start

### Recommended local workspace

```bash
npm start
```

Open `http://127.0.0.1:4173/`, or double-click `START_CHARACTER_STUDIO.cmd` on Windows. Localhost is recommended for microphone permissions, source-folder presets, ZIP extraction, and workspace mirroring.

### Serverless use

Open `demo/character-studio.html` directly in a current Chromium or Firefox build. IndexedDB, timeline editing, project autosave, Library records, and most import/export workflows remain available. Browser security rules may limit microphone and filesystem behavior under `file://`.

## Recommended production workflow

1. Load a GLB/GLTF character and companion textures or an authored content pack.
2. Save recurring room states in **Scene Studio** and media in **Library**.
3. Open **Scene Studio**, set project FPS and duration, then place beat/dialogue markers.
4. Block scene and animation clips before adding camera keys.
5. Refine camera movement, cuts, clip trims, source slips, fades, gain, and pan.
6. Save milestone projects to Library and export a **Portable ZIP** before transfer or review.
7. Render a short loop-range proof, then render the complete WebM master.

## Keyboard map

| Shortcut | Action |
|---|---|
| Space | Play / pause |
| Left / Right | Step one frame |
| Shift + Left / Right | Step one second |
| Alt + Left / Right | Nudge selection one frame |
| Alt + Shift + Left / Right | Nudge selection ten frames |
| S | Split selected clip at playhead |
| M | Add marker |
| K | Capture camera key |
| I / O | Set loop in / out |
| F | Fit complete project in timeline |
| Delete / Backspace | Delete selection |
| Ctrl/Cmd + C / X / V | Copy / cut / paste selection |
| Ctrl/Cmd + D | Duplicate selection |
| Ctrl/Cmd + Z / Y | Undo / redo |
| Ctrl/Cmd + S | Save project to Library |
| Home / End | Project start / end |

The in-app **?** panel contains the complete context-aware shortcut list.

## QA

```bash
npm test             # 27 passed + 1 optional fixture skip
npm run qa:v411      # v4.1.1 character-save + UI-fidelity assertions
npm run qa:release   # unit + release checks
```

Rendered QA validates application identity, WebGL2 startup, no framework overlay, console health, workspace launch, timeline controls, camera world fields, key and marker insertion, fit/follow behavior, and desktop/compact layouts.

## Browser-scope limitations

- Master output is browser-native **WebM** and renders in real time. MP4/H.264/ProRes, background render farms, and offline frame rendering require a separate encoder pipeline.
- Codec decoding and MediaRecorder formats depend on the browser and operating system.
- Microphone recording requires permission and generally a secure or localhost context.
- Reference-monitor HTML video is not automatically composited into the WebGL canvas; assign media to a Scene Studio face when it must appear in the rendered stage.
- Very high-resolution 4K output still depends on GPU memory, model complexity, texture sizes, browser limits, and sustained real-time frame rate.
- Draco, Meshopt, and KTX2 compressed model inputs are detected but not decoded in this dependency-free build.

## Documentation

- [`docs/MACHINIMA_STUDIO.md`](docs/MACHINIMA_STUDIO.md)
- [`docs/ASSET_LIBRARY.md`](docs/ASSET_LIBRARY.md)
- [`docs/SCENE_AND_CAPTURE.md`](docs/SCENE_AND_CAPTURE.md)
- [`docs/API.md`](docs/API.md)
- [`RELEASE_NOTES_v4.2.0.md`](RELEASE_NOTES_v4.2.0.md)
- [`RELEASE_NOTES_v4.1.1.md`](RELEASE_NOTES_v4.1.1.md)

## License

MIT for the code. Production owners remain responsible for the rights and licenses of all models, textures, music, voices, video, and other imported assets.
