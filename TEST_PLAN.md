# Test Plan

## Scope

- Digital clock renders local date, local timezone, and live time.
- Navigation works across Clock, Alarms, Timer, and Settings.
- The Basic Clock logo returns the user to the Clock home page.
- The Settings page renders six theme cards: Matrix, Interstellar, Midnight, Aurora, Paper, and Ember.
- Theme changes update the full app shell, clock styling, card selection, and theme-specific quote layer.
- The theme quote layer rotates automatically and can be advanced by clicking it.
- Alarm creation, upcoming-alarm selection, popup behavior, stop, and snooze work.
- Countdown timer completion opens the global popup.
- Alarm and timer both call the Web Audio path and connect oscillators to the audio destination.
- Settings persist in localStorage.
- The Electron native app packages the same web app for macOS, Windows, and Linux.

## Acceptance Tests Run Locally

1. Open the app and confirm the main clock fills the viewport horizontally and updates every second.
2. Open Settings, choose Interstellar, and confirm the document theme switches.
3. Click the Basic Clock logo and confirm the Clock page becomes active.
4. Click the quote layer and confirm the quote text changes.
5. Enable audio with the "Enable audio" button and confirm status changes to "Ready".
6. Add the built-in "Test alarm +5 sec" alarm.
7. Wait until the alarm popup opens, confirm the alarm sound event is emitted, then click "Stop".
8. Open the Timer page and start "3 sec test timer".
9. Wait until the timer popup opens and confirm the timer sound event is emitted.
10. Confirm no page errors are thrown during the flow.
11. Capture a screenshot at `test-results/basic-clock-e2e.png`.

## Visual and Interaction Checks

1. Verify all six theme cards render on desktop and mobile.
2. Switch to Interstellar and confirm the starfield background, warm rim glow, selected theme state, and quote layer are visible.
3. Confirm desktop and mobile layouts have no horizontal overflow.
4. Capture desktop and mobile screenshots:

```text
test-results/basic-clock-desktop-themes.png
test-results/basic-clock-mobile-themes.png
```

## Native App Checks

1. Build the macOS Electron app with `npm run desktop:build:mac`.
2. Install it to `/Applications/Basic Clock.app`.
3. Launch the installed app and confirm the title, theme cards, Interstellar switch, quote click, and logo-to-home flow.
4. Confirm GitHub Actions builds macOS, Windows, and Linux desktop artifacts after publishing.

## Manual Audio Notes

Browsers require a user gesture before Web Audio can play. The app unlocks the AudioContext on the first pointer or keyboard event and exposes a visible "Enable audio" button. The alarm uses a repeated 880/660/990 Hz bell pattern. The timer uses a 523/659/784 Hz triple signal. If Web Audio is unavailable, the app records the event, shows the popup, and attempts vibration as a fallback.

## Command

```bash
npm install
npm run test:e2e
```

For a visible local browser run that plays through the system audio path:

```bash
HEADED=1 npm run test:e2e
```
