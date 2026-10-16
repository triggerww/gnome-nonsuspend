.PHONY: check install uninstall

check:
	@command -v node >/dev/null || (echo "node é necessário para verificar a sintaxe"; exit 1)
	@command -v glib-compile-schemas >/dev/null || (echo "glib-compile-schemas é necessário"; exit 1)
	@glib-compile-schemas schemas
	@node --check extension.js
	@node --check src/inhibitor.js
	@node --check src/indicator.js
	@node --check src/lid-monitor.js
	@node --check src/power-manager.js
	@node --check src/idle-inhibitor.js
	@node --check src/device-state.js
	@echo "Verificações da extensão concluídas"

install:
	@bash install.sh

uninstall:
	@bash uninstall.sh