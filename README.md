# Basic Clock

Professional responsive digital clock, alarm, and countdown timer app with in-browser Web Audio alerts.

## Features

- Full-width digital clock with local date and timezone.
- Clock, Alarms, Timer, and Settings pages.
- Daily alarms plus quick one-time alarms for +1 minute, +10 minutes, and +5 second testing.
- Alarm popup follows the user across pages and supports stop plus 5 minute snooze.
- Countdown timer with a 3 second test flow.
- Web Audio alarm and timer sounds generated in-app with volume, mute, and sound selection.
- localStorage persistence for alarms and settings.
- Static GitHub Pages-ready deployment: no build step required.

## Run

```bash
python3 -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173
```

## Test

```bash
npm install
npm run test:e2e
```

The automated test creates one alarm and one timer, verifies that both trigger Web Audio sound events, and writes a screenshot to `test-results/basic-clock-e2e.png`.
