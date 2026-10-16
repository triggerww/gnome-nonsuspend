import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';

export const NonSuspendIndicator = GObject.registerClass(
class NonSuspendIndicator extends QuickSettings.SystemIndicator {
    _init(onClicked) {
        super._init();
        this._destroyed = false;
        this._panelIndicator = this._addIndicator();
        this._panelIndicator.gicon = Gio.ThemedIcon.new('system-lock-screen-symbolic');
        this._toggle = new QuickSettings.QuickToggle({
            title: 'Suspensão',
            iconName: 'system-lock-screen-symbolic',
            toggleMode: true,
        });
        this._toggle.connect('clicked', onClicked);
    }

    addToQuickSettings() {
        this.quickSettingsItems = [this._toggle];
        Main.panel.statusArea.quickSettings.addExternalIndicator(this);
    }

    setActive(active) {
        if (this._destroyed)
            return;

        this._toggle.checked = active;
        this._panelIndicator.visible = active;
    }

    destroy() {
        this._destroyed = true;
        this.quickSettingsItems = [];
        this._toggle.destroy();
        super.destroy();
    }
});