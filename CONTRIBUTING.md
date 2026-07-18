# Contributing

Thanks for your interest in Character Studio!

## Ground rules

- **Do not commit game assets.** No models, textures, animations or content-pack ZIPs. `.glb`, `.gltf`, `.zip` and QA screenshots are gitignored on purpose.
- Keep the shipped app (`demo/character-studio.html`) **dependency-free** — raw WebGL2, no CDN, no runtime packages. It must keep working offline from `file://`.
- Match the existing flat metal UI language (see `demo/character-studio.html` `<style>` block).

## Development setup

```bash
npm install        # dev-only: playwright for QA
npm run qa         # headless regression smoke test on a local model
```

Provide your own local test model (e.g. any `.glb`) — none are shipped.

## Before opening a PR

1. Run `npm run qa` against a real model and confirm exit code 0 with `errors: []`.
2. If you changed the UI, attach before/after screenshots (do not commit them).
3. Update `CHANGELOG.md` under an *Unreleased* heading.
4. Keep commits focused and describe the user-facing effect.

## Reporting bugs

Open an issue with: the model/pack shape (not the asset itself), steps to reproduce, browser + version, and any console errors.
