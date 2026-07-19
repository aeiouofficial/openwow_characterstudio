# QA Report — v4.1.0 Machinima Studio Elite

Date: 2026-07-19

## Target flow

`app loads → Scene Studio opens → timeline and live WebGL stage render → camera/marker/edit controls modify real project state → desktop and compact layouts remain usable without application errors`

## Environment

- Local server: `http://127.0.0.1:4181/`
- Browser: Playwright Chromium under Xvfb
- WebGL: WebGL2 through Chromium software ANGLE/SwiftShader
- Browser plugin classification: unavailable; Playwright fallback used
- Viewports: 1440×900 and 960×760

## Automated checks

| Check | Result |
|---|---|
| Inline ES-module syntax | Pass |
| Unit suite | 27 pass, 1 optional fixture skip |
| v4.1 release-surface assertions | Pass |
| Page identity and non-blank app | Pass |
| Framework/error overlay | None |
| WebGL2 context | Pass |
| Scene Studio open/close | Pass |
| Eight production tracks | Pass |
| Camera world position/target fields | Pass |
| Camera keys and markers update project state | Pass |
| Timeline Fit and Follow | Pass |
| Desktop layout | Pass |
| Compact layout | Pass |
| Relevant page/console errors | None |

## Interaction evidence

The rendered browser pass opened Scene Studio and verified the live canvas. It then:

- dropped a real generated WAV Library record onto the Music lane (one clip inserted),
- created a camera motion preset (camera keys increased from four to five),
- copied and pasted a real Dialogue clip (one clip increased to two),
- verified four markers, two scene clips, four layered audio clips, and all eight track rows,
- fitted the project into the timeline with Follow enabled,
- opened the visible Render WebM button and verified 1080p, 1440p, 4K, custom, project-range, and loop-range controls,
- inspected normalized camera world fields, and
- captured desktop and compact screenshots.

## Environment-only warnings

Chromium software rendering emitted `ReadPixels` performance warnings. These are expected from the QA software-WebGL path and were not application exceptions. The microphone permission path and render UI were validated, but physical microphone capture was not exercised because the managed QA browser disallows audio capture.

## Remaining platform risk

Real-time 4K WebM performance, hardware microphone quality, browser-specific codec availability, and sustained capture of production-scale GLB scenes must be acceptance-tested on the customer’s target workstation and browser.

## Screenshots

- `qa/screenshots/machinima-elite-desktop-v4.1.0.png`
- `qa/screenshots/machinima-elite-compact-v4.1.0.png`
