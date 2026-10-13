#!/usr/bin/env bash
set -euo pipefail

extension_root="${XDG_DATA_HOME:-$HOME/.local/share}/gnome-shell/extensions"
extension_dir="$extension_root/nonsuspend@local"
extension_uuid="nonsuspend@local"
mkdir -p "$extension_dir"
glib-compile-schemas schemas
cp metadata.json extension.js "$extension_dir/"
cp -r schemas "$extension_dir/"
glib-compile-schemas "$extension_dir/schemas"

printf 'Instalado em %s\n' "$extension_dir"

if gnome-extensions enable "$extension_uuid" 2>/dev/null; then
	printf 'Non Suspend foi ativado.\n'
else
	enabled_extensions="$(gsettings get org.gnome.shell enabled-extensions)"
	if [[ "$enabled_extensions" == "[]" || "$enabled_extensions" == "@as []" ]]; then
		enabled_extensions="['$extension_uuid']"
	elif [[ "$enabled_extensions" != *"'$extension_uuid'"* ]]; then
		enabled_extensions="${enabled_extensions%]}, '$extension_uuid']"
	fi
	gsettings set org.gnome.shell enabled-extensions "$enabled_extensions"
	printf 'Non Suspend será ativado após reiniciar a sessão.\n'
fi