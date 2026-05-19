# Test Plan

## Scope

- Digital clock renders local date, local timezone, and live time.
- Navigation works across Clock, Alarms, Timer, and Settings.
- Alarm creation, upcoming-alarm selection, popup behavior, stop, and snooze work.
- Countdown timer completion opens the global popup.
- Alarm and timer both call the Web Audio path and connect oscillators to the audio destination.
- Settings persist in localStorage.

## Acceptance Tests Run Locally

1. Open the app and confirm the main clock fills the viewport horizontally and updates every second.
2. Enable audio with the "Enable audio" button and confirm status changes to "Ready".
3. Add the built-in "Test alarm +5 sec" alarm.
4. Wait until the alarm popup opens, confirm the alarm sound event is emitted, then click "Stop".
5. Open the Timer page and start "3 sec test timer".
6. Wait until the timer popup opens and confirm the timer sound event is emitted.
7. Confirm no page errors are thrown during the flow.
8. Capture a screenshot at `test-results/basic-clock-e2e.png`.

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
