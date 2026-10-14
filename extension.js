import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {NonSuspendIndicator} from './src/indicator.js';
import {LidInhibitor} from './src/inhibitor.js';

export default class NonSuspendExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._indicator = null;
        this._inhibitor = new LidInhibitor(() => this._handleInhibitorExit());
        this._settingsChangedId = this._settings.connect('changed::enabled', () => {
            this._syncState();
        });

        this._indicator = new NonSuspendIndicator(() => {
            this._settings.set_boolean(
                'enabled',
                !this._settings.get_boolean('enabled'),
            );
        });
        this._indicator.addToQuickSettings();

        this._syncState();
    }

    disable() {
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }

        this._inhibitor?.stop();
        this._inhibitor = null;

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        this._settings = null;
    }

    _syncState() {
        const enabled = this._settings.get_boolean('enabled');
        if (enabled) {
            if (!this._inhibitor.start()) {
                this._settings.set_boolean('enabled', false);
                return;
            }
        } else {
            this._inhibitor.stop();
        }

        this._indicator.setActive(enabled && this._inhibitor.isRunning);
    }

    _handleInhibitorExit() {
        if (!this._settings)
            return;

        if (this._settings.get_boolean('enabled')) {
            log('Non Suspend foi desativado porque o bloqueio da tampa parou');
            this._settings.set_boolean('enabled', false);
        }
    }
}