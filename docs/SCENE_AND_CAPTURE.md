# Scene Studio, Backdrops & Capture — v3.4.0

## Dedicated Scene Studio workspace
Open **Scene Studio** from the top toolbar. The workspace reparents the actual live WebGL canvas into a focused stage editor, so orbit, zoom, animation, model updates, and captures remain the same real scene rather than a duplicate preview. Closing the workspace returns the canvas to the standard editor.

The workspace includes:
- A large live stage preview with snapshot and save controls.
- Room enable/disable, green/blue chroma selection, tracking markers, marker density/strength/size, room size, and contact-shadow controls.
- Skymap upload/clear controls.
- Per-face media controls for north, south, east, west, floor, and ceiling.
- A horizontal gallery of saved scene presets; selecting a card applies it immediately to the live stage.
- Direct switching to the full Asset Library.

Saved scenes share the same IndexedDB collection as the Library and include a live PNG thumbnail when supported by the browser.

## Backdrop & Post FX (left panel)
- **Background mode:** Studio, Chroma Green (`#00B140`), Pure Green, Chroma Blue (`#0047BB`), Pure Blue, Chroma Magenta, 18% Gray, 50% Gray, Custom color, Gradient, Image, or Transparent.
- **Pixelate** 1–16: renders at reduced resolution with nearest-neighbor upscale.
- **Posterize** 0/2–32 levels with optional 4×4 Bayer dithering.
- **Outline:** depth-edge pass.
- **FOV / Orthographic:** orthographic is recommended for sprite baking.
- FX render through an offscreen framebuffer; MSAA is bypassed while an FX pass is active.

## Capture & Export (right panel)
- **Screenshot** at 1×/2×/4× supersampling.
- **Transparent PNG** with a true alpha channel.
- **Sprite sheet:** eight directions at 45° intervals, single row, JSON metadata sidecar, transparent or current background.

## Chroma room behavior
- Walls, floor, and ceiling render in broadcast green or blue chroma.
- Tracking crosses use an automatically contrasting tint and can be toggled.
- An equirectangular skymap can render behind the room.
- Each face can independently use chroma, image, video, or off. Media files are session-local; saved JSON remembers filenames and requires the files to be picked again after reload.
- The room grows to keep the camera enclosed and hides any face the camera crosses.
- With a model loaded, the floor tracks the model’s feet; an empty room uses a stable standing-height floor.
- The optional contact shadow is a soft projected blob, not a ray-traced shadow.
- Scene state persists in `localStorage` (`cs_scene`) and in appearance JSON/share links.

## StudioAPI
`setBackground(mode,color,color2)`, `getBackground()`, `setFx({pixelate,posterize,dither,outline})`, `getFx()`, `setProjection({ortho,fov})`, `captureScreenshot({scale,transparent})`, `renderSpriteSheet({directions,size,transparent})`, `scene.{state,set,enable,setChroma,setMarkers,setFaceMedia}`.
