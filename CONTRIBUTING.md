# Contributing to Such A Good Clock

Thanks for your interest! This is a single-author project so the bar for
external contributions is small but meaningful changes are welcome.

## Easiest contributions

- **Open an issue** with a new theme idea (provide hex values for the three
  color stops plus an optional quote / line).
- **Open an issue** if you find a layout, alarm, or PWA install bug — please
  include browser + OS + a screenshot.
- **Star + share** on social media if the app helped you. Linking back is
  the most useful boost.

## Code contributions

1. Fork the repo and create a branch from `main`.
2. Keep changes scoped to a single concern per PR.
3. Stack stays: vanilla JS / CSS / HTML — no frameworks. Please don't add a
   build step or framework dependency.
4. New themes: extend the theme registry in `app.js` and add a card preview.
5. Tests: there is no formal test suite yet. Please verify your change in:
   - Chrome (latest) at fullscreen
   - Mobile Safari (PWA install path)
   - The Electron wrapper (`npm run electron`)
6. Open a PR with a screenshot of the change and a one-line description.

## Native desktop builds

The Electron wrapper is in this repo and the macOS / Windows / Linux builds
are produced by the `Desktop Builds` GitHub Actions workflow on each push to
`main` and on each `v*` tag. To trigger a release build, push a tag matching
`v*` and the workflow will attach `.dmg`, `.exe`, and `.AppImage` artifacts.

## Code of conduct

Be respectful, be specific, be brief. Disagreements are fine; insults are not.
