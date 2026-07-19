# Character Studio v4.1.0 — Machinima Studio Elite

Released: 2026-07-19  
Base: v4.0.0 Machinima Studio Pro

## Release summary

v4.1.0 completes the interrupted machinima-editor build as a coherent premium browser production surface. The timeline now drives the real renderer and media graph with world-space camera targets, precise camera transforms, professional clip operations, portable media bundles, persistent scene media, stereo audio controls, and configurable master rendering.

## Major additions

- World-space camera target X/Y/Z and exact derived camera position.
- Adjustable camera motion presets with editable duration and interpolation.
- Clip source slip, direct timeline drops, draggable markers, track reordering, and clipboard operations.
- Fit-to-project and auto-follow timeline navigation.
- Long media automatically extends project boundaries.
- Music/dialogue/SFX stereo pan at clip and track level.
- Audio/media resource cleanup after edits and project replacement.
- Persistent skymap and room-face media by Library source ID.
- Portable ZIP export/import with media ID remapping and SHA-256 checksums.
- 1080p, 1440p, 4K, and custom WebM capture with range, bitrate, progress, and cancel controls.
- Updated StudioAPI, in-app shortcuts, release checks, documentation, and responsive editor polish.

## Compatibility

Existing v4.0 project JSON is normalized into the v4.1 project schema. Existing Character Studio appearance, scene, asset-library, source-preset, and content-pack workflows remain available.

## Browser limits

The integrated master renderer remains real-time WebM. Browser codec support, microphone permissions, GPU memory, and sustained WebGL frame rate vary by browser and machine. MP4/H.264/ProRes and offline frame rendering are outside this dependency-free browser release.
