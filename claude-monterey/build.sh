#!/bin/bash
# Compila "Claude Monterey.app" para macOS 12 Monterey.
# Uso:  ./build.sh            -> crea build/Claude Monterey.app
#       ./build.sh --install  -> además la copia a /Applications y la abre
set -euo pipefail
cd "$(dirname "$0")"

if ! xcrun --find swiftc >/dev/null 2>&1; then
  echo "Faltan las Command Line Tools de Xcode. Ejecuta:  xcode-select --install"
  echo "y vuelve a correr este script cuando termine la instalación."
  exit 1
fi

APP="build/Claude Monterey.app"
ARCH="$(uname -m)"   # arm64 (Apple Silicon) o x86_64 (Intel)
rm -rf build
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"

echo "→ Compilando ($ARCH)…"
xcrun swiftc -O -target "$ARCH-apple-macos12.0" \
  -framework Cocoa -framework WebKit \
  Sources/main.swift -o "$APP/Contents/MacOS/Claude"

cp Info.plist "$APP/Contents/Info.plist"

echo "→ Generando icono…"
ICONSET="build/AppIcon.iconset"
mkdir -p "$ICONSET"
for s in 16 32 128 256 512; do
  sips -z $s $s icon/icon-1024.png --out "$ICONSET/icon_${s}x${s}.png" >/dev/null
  d=$((s * 2))
  sips -z $d $d icon/icon-1024.png --out "$ICONSET/icon_${s}x${s}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"

echo "→ Firmando (ad-hoc)…"
codesign --force --deep --sign - "$APP"

echo "✓ Listo: $APP"

if [[ "${1:-}" == "--install" ]]; then
  rm -rf "/Applications/Claude Monterey.app"
  cp -R "$APP" /Applications/
  echo "✓ Instalada en /Applications/Claude Monterey.app"
  open "/Applications/Claude Monterey.app"
fi
