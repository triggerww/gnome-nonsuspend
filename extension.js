import Gio from 'gi://Gio';
import GObject from 'gi://GObject';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

const INHIBITOR_ARGS = [
    'systemd-inhibit',
    '--what=handle-lid-switch',
    '--who=Non Suspend',
    '--why=Manter o notebook ligado com a tampa fechada',
    '--mode=block',
    '--no-pager',
    '/usr/bin/sleep',
    'infinity',
];

export default class NonSuspendExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._process = null;
        this._indicator = null;
        this._toggle = null;
        this._settingsChangedId = this._settings.connect('changed::enabled', () => {
            this._syncState();
        });

        this._indicator = new QuickSettings.SystemIndicator();
        this._indicator._addIndicator('computer-symbolic');

        this._toggle = new NonSuspendToggle();
        this._toggle.connect('clicked', () => {
            this._settings.set_boolean(
                'enabled',
                !this._settings.get_boolean('enabled'),
            );
        });
        this._indicator.quickSettingsItems.push(this._toggle);
        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);

        this._syncState();
    }

    disable() {
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = 0;
        }

        this._stopInhibitor();

        if (this._indicator) {
            this._indicator.quickSettingsItems = [];
            this._indicator.destroy();
            this._indicator = null;
        }

        this._toggle = null;
        this._settings = null;
    }

    _syncState() {
        const enabled = this._settings.get_boolean('enabled');
        if (enabled)
            this._startInhibitor();
        else
            this._stopInhibitor();

        if (this._toggle)
            this._toggle.checked = enabled && this._process !== null;
    }

    _startInhibitor() {
        if (this._process)
            return;

        try {
            this._process = Gio.Subprocess.new(
                INHIBITOR_ARGS,
                Gio.SubprocessFlags.NONE,
            );
            this._watchInhibitor();
        } catch (error) {
            logError(error, 'Non Suspend não conseguiu iniciar o bloqueio da tampa');
            this._settings.set_boolean('enabled', false);
        }
    }

    _watchInhibitor() {
        const process = this._process;
        process.wait_check_async(null, (subprocess, result) => {
            let exitedNormally = false;
            try {
                exitedNormally = subprocess.wait_check_finish(result);
            } catch (error) {
                if (this._process === process)
                    logError(error, 'O bloqueio da tampa do Non Suspend foi encerrado inesperadamente');
            }

            if (this._process !== process)
                return;

            this._process = null;
            if (this._settings && this._settings.get_boolean('enabled')) {
                this._settings.set_boolean('enabled', false);
                if (!exitedNormally)
                    log('Non Suspend foi desativado porque o bloqueio da tampa parou');
            }
            if (this._toggle)
                this._toggle.checked = false;
        });
    }

    _stopInhibitor() {
        if (!this._process)
            return;

        const process = this._process;
        this._process = null;
        process.force_exit();
    }
}

const NonSuspendToggle = GObject.registerClass(
class NonSuspendToggle extends QuickSettings.QuickToggle {
    constructor() {
        super({
            title: 'Non Suspend',
            iconName: 'computer-symbolic',
            toggleMode: true,
        });
    }
});