#!/usr/bin/env bash
set -euo pipefail

extension_root="${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions"
extension_dir="$extension_root/nonsuspend@local"
gnome-extensions disable nonsuspend@local 2>/dev/null || true
rm -rf "$extension_dir"
printf 'Removido de %s\n' "$extension_dir"