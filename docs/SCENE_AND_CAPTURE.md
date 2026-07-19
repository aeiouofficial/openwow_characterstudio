# Scene Studio, Stage, and Capture — v4.2.1

Scene Studio combines the real Character Studio WebGL2 stage with the Machinima Studio Elite timeline. The canvas is reparented into the production workspace and restored when closed, so scene edits, camera changes, model animation, and captures operate on one renderer.

## Stage controls

- Room enablement
- Broadcast green or blue chroma
- Tracking crosses and density
- Room scale and contact shadow
- Equirectangular skymap
- Independent north/south/east/west/floor/ceiling modes: chroma, image, video, or open
- Perspective or orthographic projection
- Safe frame and rule-of-thirds overlay
- Snapshot capture and synchronized reference-video monitor

## Persistent scene media

Scene skymaps and per-face image/video selections are saved to the Asset Library. Normalized scene state stores `sourceId`, filename, and MIME metadata. Loading a scene resolves the actual Library blob; portable project import remaps those IDs on the destination machine.

A scene clip captures the complete normalized stage state at the playhead and acts as an instantaneous stage cut. Scene-cut snapping uses those clip boundaries without mixing them with unrelated clip edges.

## Backdrop and post effects

The standard editor retains Studio, chroma, gray, custom color, gradient, image, and transparent backgrounds plus pixelation, posterization, dithering, and depth outlines. An Effects timeline clip captures those settings for timed playback.

## Camera interaction

- LMB drag: orbit around the target.
- RMB or Shift-drag: move the look-at target in world X/Y/Z.
- Wheel: dolly.
- Inspector: exact world camera position, exact target, lens, easing, and shake.

Camera keys and movement presets use the same camera state as the live renderer.

## Capture and render

- PNG screenshot at 1×/2×/4×
- True-alpha PNG
- Directional sprite sheet and JSON sidecar
- Turntable WebM
- Machinima WebM with mixed timeline audio
- 1080p, 1440p, 4K, or custom machinima dimensions
- project or loop-range render, bitrate, progress, and cancellation

## StudioAPI scene controls

```js
StudioAPI.setBackground(mode, color, color2)
StudioAPI.getBackground()
StudioAPI.setFx(fx)
StudioAPI.getFx()
StudioAPI.setProjection({ortho, fov})
StudioAPI.captureScreenshot({scale, transparent})
StudioAPI.renderSpriteSheet({directions, size, transparent})
StudioAPI.scene.state()
StudioAPI.scene.set(scene)
StudioAPI.scene.enable(value)
StudioAPI.scene.setChroma('green' | 'blue')
StudioAPI.scene.setMarkers(value)
StudioAPI.scene.setFaceMedia(face, media, name)
StudioAPI.getCamera()
StudioAPI.machinima.setCamera(camera)
```
