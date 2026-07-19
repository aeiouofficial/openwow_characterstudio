# Machinima Studio Elite — v4.2.1

Machinima Studio Elite is the nonlinear production workspace inside Character Studio. It drives the existing live WebGL2 renderer, loaded model, animation system, Scene Studio state, post effects, Asset Library, Web Audio graph, and capture path. Opening or closing the workspace reparents the same canvas; it does not create a second renderer or fork character state.

## Workspace anatomy

- **Production Browser:** searchable scenes, model animations, audio, video, and saved machinima projects. Assets can be clicked or dragged to compatible lanes.
- **Live Stage:** current WebGL render, active camera, safe frame, rule-of-thirds overlay, snapshot action, projection controls, and synchronized reference monitor.
- **Inspector:** Camera, Scene, Edit, and Project controls for exact values and contextual operations.
- **Timeline:** time ruler, loop range, markers, playhead, camera curves/keys, clips, waveforms, snap guide, track headers, and transport.

## Track model

| Track | Purpose | Track controls |
|---|---|---|
| Camera | Position/target/lens keys and cuts | visibility, lock, handheld |
| Scene | Complete normalized stage-state cuts | visibility, lock |
| Animation | Loaded character animation clips | visibility, lock |
| Reference Video | Muted synchronized planning monitor | visibility, lock |
| Effects | Timed pixelate/posterize/dither/outline snapshots | visibility, lock |
| Music | Score and ambience | mute, solo, lock, gain, pan |
| Dialogue / Voice | Dialogue imports and microphone takes | mute, solo, lock, gain, pan |
| Sound FX | One-shots and layered effects | mute, solo, lock, gain, pan |

Track instances can be added more than once and moved up or down. Locked tracks reject edits and drops. Solo state limits audible audio tracks; visibility controls visual/camera tracks.

## Clip editing

### Pointer tools

- **Select:** click to select; drag clip body to move; drag either edge to trim.
- **Razor:** click a clip at the desired time to split it.
- **Slip:** hold **Alt** while dragging a clip body to change source-in without moving the timeline boundaries.
- **Direct drop:** drag a Production Browser card or operating-system audio/video file onto a compatible lane. Placement uses the pointer time and current snap mode.

### Commands

- Split at playhead.
- Duplicate.
- Delete or ripple delete.
- Copy, cut, and paste clips, keys, markers, or tracks.
- Exact inspector editing for start, duration, source-in, speed, volume, pan, and fades.
- Keyboard nudge by one frame or ten frames.

Long imported media automatically extends project and loop boundaries rather than being silently truncated.

## Snapping and navigation

The magnet control enables snapping to one source or all sources:

- frame boundaries
- markers
- clip edges
- scene cuts
- all available targets

A temporary vertical guide identifies the active snap target. **Fit** calculates a timeline zoom that shows the complete production. **Follow** keeps a playing playhead visible without preventing manual scrolling while stopped.

## Markers

Markers support:

- frame-accurate time
- drag repositioning
- name
- color category
- production note

Use markers for dialogue cues, musical beats, action beats, camera cuts, approvals, and review notes. Marker and scene-cut snapping are intentionally distinct.

## Camera system

### Keyframe data

Each camera key stores:

- yaw and pitch
- dolly/orbit distance
- look-at target X, Y, and Z
- field of view
- easing mode
- handheld shake amount

The inspector also displays and accepts exact world-space camera position X/Y/Z. Position values are converted back into the native orbit/look-at representation, preserving one explicit camera model throughout the renderer.

### Easing

- Smooth
- Linear
- Ease In
- Ease Out
- Hold
- Cut

### Motion presets

- Dolly In / Out
- Orbit Left / Right
- Truck Left / Right
- Crane Up / Down
- Tilt Up / Down
- Hero Reveal
- Camera Cut

Set preset duration and easing before insertion. Presets create standard editable keys, so their result can be retimed, copied, moved, or refined like manually authored camera animation.

### Stage interaction

- LMB drag: orbit.
- RMB or Shift-drag: truck/pedestal the world-space target.
- Wheel: dolly.
- Exact inspector fields: camera position and target.

## Scene and effect clips

A scene clip stores the complete normalized stage state, including chroma, markers, room scale, shadow, skymap, and every face mode. Image/video/skymap assignments include Asset Library source IDs and MIME metadata, allowing portable bundles to restore actual media instead of filenames only.

An effects clip snapshots pixelate, posterize, dither, outline, outline color, and threshold. Effects apply while the clip is active.

## Audio, voice, and video

Audio clips support source-in, speed, gain, stereo pan, fade-in, and fade-out. Audio tracks add gain, pan, mute, and solo. The runtime uses one managed media element/node graph per clip and disposes obsolete object URLs and nodes after edits or project changes.

**Record Voice** requests a microphone through `getUserMedia`, records through `MediaRecorder`, saves the take as an Asset Library audio record, and inserts it on a Dialogue track. Permission and a secure/localhost origin may be required.

Reference video is synchronized to timeline time and displayed over the stage as a planning monitor. It remains muted and is not composited into the master unless the video is assigned to a rendered room face.

## Project persistence and portability

- Continuous recovery save: `localStorage` key `cs_machinima_project_v1`.
- UI preferences: `cs_machinima_ui_v1`.
- Reusable project records: IndexedDB Asset Library type `machinima`.
- Lightweight interchange: project JSON.
- Complete transfer: Portable Machinima ZIP.

A portable ZIP contains:

```text
project.json
media/...
SHA256SUMS.txt
```

`project.json` includes a bundle manifest mapping old media IDs to payload paths. Import saves those payloads into the destination Asset Library and rewrites clip, scene-face, and skymap source IDs before loading the normalized project.

## Master rendering

**Render WebM** uses `canvas.captureStream(projectFps)` plus the live Web Audio mix destination. Choose project or loop range, 1080p, 1440p, 4K, or custom dimensions, and a video bitrate. The renderer reports progress, supports cancellation, and restores the previous canvas dimensions and edit state afterward.

Rendering is real time. Keep the tab visible and test a short loop range before a long master.

## Public API

```js
StudioAPI.machinima.getProject()
StudioAPI.machinima.setProject(project)
StudioAPI.machinima.play()
StudioAPI.machinima.pause()
StudioAPI.machinima.seek(seconds)
StudioAPI.machinima.addMarker(name, time)
StudioAPI.machinima.addCameraKey(time, cameraState)
StudioAPI.machinima.addSceneClip(name, time, duration)
StudioAPI.machinima.addAnimationClip(animationNameOrIndex, time, duration)
StudioAPI.machinima.copy()
StudioAPI.machinima.cut()
StudioAPI.machinima.paste()
StudioAPI.machinima.fitTimeline()
StudioAPI.machinima.getCamera()
StudioAPI.machinima.setCamera(camera)
StudioAPI.machinima.save()
StudioAPI.machinima.exportPortable()
StudioAPI.machinima.renderWebM(options)
```

## Shipping checklist

1. Confirm model textures and animation names.
2. Save all external scene media to Library.
3. Place markers and set FPS before final camera polish.
4. Test mute/solo, fades, pan, source-in, and reference-video sync.
5. Save a Library milestone and export a portable ZIP.
6. Render a short loop proof at final dimensions and bitrate.
7. Render the full master and verify duration, audio, cuts, and final frame.

## v4.2 workspace layouts

Machinima Studio now exposes Edit, Animate, Camera, Audio, and Review layouts. The browser, properties inspector, timeline, and stage are independently collapsible and resizable. `Ctrl+K` opens the command palette; number keys 1–5 switch layouts when an input is not focused. Inspector sections are searchable accordions and compact widths use one overlay dock at a time.
