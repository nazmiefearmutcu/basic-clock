#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-run}"
APP_NAME="Such A Good Clock"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DIST_DIR="$ROOT_DIR/dist-native"

cd "$ROOT_DIR"

if [ ! -d "$ROOT_DIR/node_modules/electron" ]; then
  npm install
fi

pkill -f "Such A Good Clock.app/Contents/MacOS/Such A Good Clock" >/dev/null 2>&1 || true

build_app() {
  npm run desktop:build:dir -- --mac
}

find_app() {
  find "$DIST_DIR" -maxdepth 4 -type d -name "$APP_NAME.app" | head -n 1
}

open_app() {
  local app_bundle
  app_bundle="$(find_app)"
  if [ -z "$app_bundle" ]; then
    echo "Such A Good Clock.app was not found in $DIST_DIR" >&2
    exit 1
  fi
  /usr/bin/open -n "$app_bundle"
}

verify_app() {
  sleep 2
  pgrep -f "Such A Good Clock.app/Contents/MacOS/Such A Good Clock" >/dev/null
}

case "$MODE" in
  run)
    build_app
    open_app
    ;;
  --verify|verify)
    build_app
    open_app
    verify_app
    ;;
  --logs|logs)
    build_app
    open_app
    /usr/bin/log stream --info --style compact --predicate 'process == "Such A Good Clock"'
    ;;
  --debug|debug)
    npm run desktop:run
    ;;
  --telemetry|telemetry)
    build_app
    open_app
    /usr/bin/log stream --info --style compact --predicate 'process == "Such A Good Clock"'
    ;;
  *)
    echo "usage: $0 [run|--verify|--logs|--debug|--telemetry]" >&2
    exit 2
    ;;
esac
