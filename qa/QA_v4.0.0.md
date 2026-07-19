# QA Report — v4.0.0 Machinima Studio Pro

## Result

**PASS** for the implemented offline browser scope.

## Automated checks

- `npm test`: 28 tests, 27 passed, 1 optional fixture skipped, 0 failed.
- `npm run qa:v400`: 24 required v4 release surfaces verified.
- Inline ES-module syntax: passed with `node --check` after extraction from the shipped HTML.

## Rendered browser verification

Environment:

- Chromium 144 under Xvfb
- software WebGL2 through SwiftShader/ANGLE
- 1600×1000 primary viewport
- 1024×820 compact desktop
- 760×900 compact/mobile-width layout
- Browser plugin unavailable; Playwright Python was used as the fallback

Verified flow:

1. App booted with `StudioAPI.version === "4.0.0"` and no console/page errors.
2. Dedicated Scene Studio opened and displayed eight default production tracks.
3. A scene clip was added and split at an exact playhead position into two clips.
4. Two camera keys with different transforms were added and rendered on the camera curve.
5. A timeline marker was added and persisted.
6. WAV music and WebM reference video were imported through the real file inputs.
7. Audio waveform decoding/rendering completed and the reference monitor synchronized.
8. Playback advanced frame timecode and paused cleanly.
9. Project save created a `machinima` Asset Library record with `audio` and `video` source records.
10. Library grid previewed and filtered all three new record types.
11. Responsive inspector drawer and compact timeline layouts remained usable without runtime errors.

## Evidence files

- `qa/screenshots/machinima-empty-v4.0.0.png`
- `qa/screenshots/machinima-populated-v4.0.0.png`
- `qa/screenshots/library-machinima-assets-v4.0.0.png`
- `qa/screenshots/machinima-responsive-v4.0.0.png`
- `qa/screenshots/machinima-compact-v4.0.0.png`

## Known environment notes

- Headless Chromium in this sandbox exposes no WebGL context; rendered QA therefore used headed Chromium under Xvfb with SwiftShader.
- Microphone capture was not permission-tested in the sandbox because browser audio-capture policy is disabled. The permission/error path and `MediaRecorder` integration are present; normal localhost browsers can exercise it.
- WebM capture was capability-checked in code. A full 30-second render was not retained in the release package to avoid unnecessary binary QA output.
