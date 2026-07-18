# QA Report — v3.4.0 Library and Scene Studio Workspaces

Date: 2026-07-19

## Automated checks
- Inline module syntax check: passed.
- `npm test`: 28 tests; 27 passed; one optional external pack-fixture test skipped.
- Runtime version and dedicated workspace markup are covered by the unit suite.

## Rendered interaction checks
Playwright Chromium was used because the Browser plugin was not available. The app was exercised through its local `file://` entry under Xvfb with software WebGL.

Validated flow:
1. App loads and exposes `StudioAPI.version === "3.4.0"`.
2. Library opens from the dedicated header button.
3. Seed records render as preview cards.
4. Search/filtering, list layout, selection, and the detail inspector update correctly.
5. Scene Studio opens from the dedicated header button.
6. The real `#gl` canvas moves into `#csSceneCanvasDock`.
7. Chroma controls and saved scene cards update/apply scene state.
8. Closing the workspace restores `#gl` to `#vp`.
9. Desktop 1440×900 and compact desktop 960×760 layouts render without overlap after the responsive placement fix.

## Console
No application errors were recorded. Chromium emitted software-WebGL readback/context warnings in the virtualized QA environment; these did not block rendering or interactions.

## Remaining manual coverage
- Hardware-accelerated Firefox/Chromium with a production GLB and large real-world library.
- Native operating-system file picker behavior for every media type.
