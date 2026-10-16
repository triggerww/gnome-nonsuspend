import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import {NonSuspendIndicator} from './src/indicator.js';
import {LidInhibitor} from './src/inhibitor.js';
import {LidMonitor} from './src/lid-monitor.js';
import {LidPowerManager} from './src/power-manager.js';

export default class NonSuspendExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._indicator = null;
        this._powerManager = new LidPowerManager();
        this._lidMonitor = null;
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
        this._lidMonitor = new LidMonitor((closed) => this._handleLidState(closed));

        this._syncState();
    }

    disable() {
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }

        this._inhibitor?.stop();
        this._inhibitor = null;
        this._lidMonitor?.destroy();
        this._lidMonitor = null;
        this._powerManager.stopKeepingScreenAwake();
        this._powerManager.restore();
        this._powerManager = null;

        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }

        this._settings = null;
    }

    _syncState() {
        const enabled = this._settings.get_boolean('enabled');
        if (!enabled) {
            this._stopFeatures();
            this._indicator.setActive(false);
            return;
        }

        if (!this._inhibitor.start()) {
            this._stopFeatures();
            this._settings.set_boolean('enabled', false);
            return;
        }

        if (this._lidMonitor?.isClosed)
            this._powerManager.apply();
        else
            this._powerManager.keepScreenAwake();

        this._indicator.setActive(this._inhibitor.isRunning);
    }

    _handleLidState(closed) {
        if (!this._settings?.get_boolean('enabled'))
            return;

        if (closed)
            this._powerManager.apply();
        else {
            this._powerManager.restore();
            this._powerManager.keepScreenAwake();
        }
    }

    _stopFeatures() {
        this._inhibitor.stop();
        this._powerManager.stopKeepingScreenAwake();
        this._powerManager.restore();
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