# CHARACTER STUDIO API — v4.1.0

The browser API is available on `window.StudioAPI` in `demo/character-studio.html`. The app also exposes automation events and the existing MCP bridge.

## Events

- `studio:ready`
- `studio:modelloaded`
- `studio:packloaded`
- `studio:machinima-ready`

## Core appearance and editor API

```js
StudioAPI.getAppearance()
StudioAPI.applyAppearance(json)
StudioAPI.getStatus()
StudioAPI.listGeosets()
StudioAPI.setGeosetVisible(name, on)
StudioAPI.listTextures()
StudioAPI.equipTexture(slot, name)
StudioAPI.setSlider(axis, value)
StudioAPI.saveGearset(name)
StudioAPI.setViewMode(mode)
```

## Machinima Studio Elite

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

`renderWebM(options)` accepts fields from the persisted export block:

```js
{
  resolution: '1080p' | '1440p' | '4k' | 'custom',
  width: 1920,
  height: 1080,
  bitrateMbps: 18,
  range: 'project' | 'loop'
}
```

## Project schema

Projects normalize to `engine: "character-studio_v4.1.0"`, `version: 2` and contain FPS, duration, playhead, zoom, loop range, snap state, auto-follow state, motion-preset defaults, export settings, markers, a base scene, and ordered tracks.

Track types:

```text
camera · scene · animation · video · effect · music · dialogue · sfx
```

Camera key state:

```js
{
  yaw, pitch, dist,
  panX, panY, panZ,
  fov, ease, shake
}
```

Clip state includes `start`, `duration`, `sourceIn`, `speed`, `volume`, `pan`, `fadeIn`, `fadeOut`, `sourceId`, `sourceDuration`, and type-specific `data`. Audio tracks also store `gain` and `pan`.

Marker state includes `time`, `name`, `color`, and `note`.

## Portable bundle

Format identifier:

```text
character-studio/machinima-bundle
```

The ZIP contains `project.json`, referenced `media/...` payloads, and `SHA256SUMS.txt`. During import, media records are recreated and source IDs are rewritten before project normalization.

## Asset Library

```js
await StudioAPI.library.list()
await StudioAPI.library.get(id)
await StudioAPI.library.save(kind, name, data)
await StudioAPI.library.remove(id)
await StudioAPI.library.exportOne(id)
await StudioAPI.library.exportAll()
```

Supported kinds include `appearance`, `scene`, `gearset`, `machinima`, `audio`, `video`, capture types, `texture`, `pack`, `json`, and `file`.

## Camera and capture

```js
StudioAPI.getCamera()
StudioAPI.setProjection({ortho, fov})
StudioAPI.captureScreenshot({scale, transparent})
StudioAPI.renderSpriteSheet({directions, size, transparent})
StudioAPI.renderTurntable(seconds)
```

`getCamera()` returns the native orbit/look-at fields plus derived world `position`.

## Scene and effects

```js
StudioAPI.scene.state()
StudioAPI.scene.set(scene)
StudioAPI.scene.enable(value)
StudioAPI.scene.setChroma(value)
StudioAPI.scene.setMarkers(value)
StudioAPI.scene.setFaceMedia(face, media, name)
StudioAPI.setBackground(mode, color, color2)
StudioAPI.getBackground()
StudioAPI.setFx(fx)
StudioAPI.getFx()
```

## Local bridge

When started with `npm start`, the server exposes source-preset and asset bridge endpoints including `/api/health`, `/api/source-presets`, `/api/import-zip`, `/api/assets`, and `/api/asset`. Arbitrary filesystem paths are intentionally unavailable to a `file://` page.

## Other established surfaces

The release preserves GLB/GLTF loading, morph and gear-safe body controls, animation playback, content-pack validation, GLB export, source presets, texture transforms, project profiles, plugin hooks, MCP automation, share links, screenshots, sprite sheets, turntables, and deterministic randomization.
