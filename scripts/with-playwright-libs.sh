#!/usr/bin/env bash
# scripts/with-playwright-libs.sh
#
# Ensures Chromium's shared libraries (libnspr4/libnss3/libasound2) resolve
# before running Playwright, then exec's the given command.
#
# Why: on hosts without passwordless sudo, `npx playwright install-deps`
# cannot install the system packages, so the headless shell fails with
# "error while loading shared libraries: libnspr4.so". This script extracts
# the needed .debs into ~/.local/share/playwright-libs (user-owned, no root)
# and prepends them to LD_LIBRARY_PATH.
#
# It is a fast no-op when nothing is missing (e.g. CI runners after
# `playwright install --with-deps`, or machines with the libs installed).
#
# Usage (usually via package.json):
#   bash scripts/with-playwright-libs.sh playwright test

set -euo pipefail

LIB_ROOT="$HOME/.local/share/playwright-libs"
LIB_DIR="$LIB_ROOT/usr/lib/x86_64-linux-gnu"

find_browser_bin() {
  find "$HOME/.cache/ms-playwright" -name 'chrome-headless-shell' -type f 2>/dev/null | head -1
}

missing_libs() {
  local bin
  bin="$(find_browser_bin)"
  [ -z "$bin" ] && return 0 # browser not installed yet — nothing to check
  ldd "$bin" 2>/dev/null | grep -q "not found"
}

bootstrap_libs() {
  local tmp
  tmp="$(mktemp -d)"
  echo "with-playwright-libs: downloading Chromium shared libraries (no sudo required)"
  # Package name changed to -t64 in newer Ubuntu (24.04+); try both.
  (cd "$tmp" && apt-get download libnspr4 libnss3 2>/dev/null || true)
  (cd "$tmp" && apt-get download libasound2 2>/dev/null || apt-get download libasound2t64 2>/dev/null || true)
  local debs
  debs="$(find "$tmp" -name '*.deb' | wc -l)"
  if [ "$debs" -eq 0 ]; then
    echo "with-playwright-libs: could not download .debs (apt unavailable?)" >&2
    echo "with-playwright-libs: run 'npx playwright install-deps chromium' with sudo instead" >&2
    rm -rf "$tmp"
    return 1
  fi
  mkdir -p "$LIB_ROOT"
  for deb in "$tmp"/*.deb; do
    dpkg-deb -x "$deb" "$LIB_ROOT"
  done
  rm -rf "$tmp"
  echo "with-playwright-libs: libraries installed in $LIB_ROOT"
}

if missing_libs; then
  if [ ! -d "$LIB_DIR" ]; then
    bootstrap_libs
  fi
  if [ -d "$LIB_DIR" ]; then
    export LD_LIBRARY_PATH="$LIB_DIR${LD_LIBRARY_PATH:+:$LD_LIBRARY_PATH}"
  fi
fi

exec "$@"
