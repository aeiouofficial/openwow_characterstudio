# Scene Studio, Backdrops & Capture — v3.3.0

## Backdrop & Post FX (left panel)
- **Background mode**: Studio, Chroma Green (#00B140), Pure Green, Chroma Blue (#0047BB), Pure Blue, Chroma Magenta, 18% Gray, 50% Gray, Custom color, Gradient (two colors), Image (flat, cover-fit), Transparent (checkerboard preview, true alpha).
- **Pixelate** 1–16: renders at reduced resolution, nearest-neighbor upscale.
- **Posterize** 0/2–32 levels + **Dither** (4×4 Bayer) for retro looks.
- **Outline**: depth-edge pass.
- **FOV / Orthographic**: ortho is recommended for sprite baking. Note: the sky backdrop keeps perspective-style rays in ortho (cosmetic).
- FX render via an offscreen framebuffer; MSAA is bypassed while any FX is active.

## Capture & Export (right panel)
- **Screenshot** at 1×/2×/4× supersampling.
- **Transparent PNG**: exports with a real alpha channel — no keying required.
- **Sprite sheet**: 8 directions (45° steps), single row, JSON meta sidecar, transparent or current background.

## Scene Studio (Chroma Room)
- Enable the room, pick **green** or **blue**; walls, floor and ceiling render in broadcast chroma.
- **Tracking markers**: cross pattern per face, auto-contrast tint, toggleable — for camera tracking in post.
- **Skymap**: equirect image drawn as the backdrop.
- **Per-face media**: assign an image or a looping muted video to any wall, the floor, or the ceiling. Media files live in the session; the persisted scene JSON remembers assignments by file name, so re-pick files after a reload.
- **Room sizing**: the room always encloses the camera (auto-grows on zoom-out). Faces the camera moves outside of are hidden automatically so the view is never walled off.
- **Floor**: with a model loaded the floor sits at the model's feet; empty room floor sits at standing height below the orbit target (prevents near-plane clipping).
- **Contact shadow**: soft radial blob under the model (not raytraced), toggleable.
- Scene state persists in `localStorage` (`cs_scene`) and in appearance JSON / share links.

## StudioAPI
`setBackground(mode,color,color2)`, `getBackground()`, `setFx({pixelate,posterize,dither,outline})`, `getFx()`, `setProjection({ortho,fov})`, `captureScreenshot({scale,transparent})`, `renderSpriteSheet({directions,size,transparent})`, `scene.{state,set,enable,setChroma,setMarkers,setFaceMedia}`.
