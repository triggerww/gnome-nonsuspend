import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {LidDeviceState} from './device-state.js';
import {SessionIdleInhibitor} from './idle-inhibitor.js';

const POWER_PROFILES_NAME = 'org.freedesktop.PowerProfiles';
const POWER_PROFILES_PATH = '/org/freedesktop/PowerProfiles';
const POWER_PROFILES_INTERFACE = 'org.freedesktop.PowerProfiles';
const TUNED_NAME = 'com.redhat.tuned';
const TUNED_PATH = '/Tuned';
const TUNED_INTERFACE = 'com.redhat.tuned.control';
const TUNED_POWER_SAVER = 'powersave';
const POWER_PROFILES_POWER_SAVER = 'power-saver';

export class LidPowerManager {
    constructor() {
        this._deviceState = new LidDeviceState();
        this._tunedProxy = this._createTunedProxy();
        this._profileProxy = this._createProfileProxy();
        this._idleInhibitor = new SessionIdleInhibitor();
        this._previousTunedProfile = null;
        this._previousPowerProfile = null;
        this._activeBackend = null;
        this._applied = false;
    }

    apply() {
        if (this._applied)
            return;

        this._applied = true;
        this._idleInhibitor.stop();
        this._deviceState.apply();
        this._applyPowerSaver();
    }

    restore() {
        if (!this._applied)
            return;

        this._applied = false;
        this._deviceState.restore();
        this._restorePowerProfile();
    }

    keepScreenAwake() {
        this.restore();
        return this._idleInhibitor.start();
    }

    stopKeepingScreenAwake() {
        this._idleInhibitor.stop();
    }

    _createProfileProxy() {
        try {
            return Gio.DBusProxy.new_for_bus_sync(
                Gio.BusType.SYSTEM,
                Gio.DBusProxyFlags.NONE,
                null,
                POWER_PROFILES_NAME,
                POWER_PROFILES_PATH,
                POWER_PROFILES_INTERFACE,
                null,
            );
        } catch (error) {
            log(`Non Suspend: power-profiles-daemon indisponível (${error.message})`);
            return null;
        }
    }

    _createTunedProxy() {
        try {
            return Gio.DBusProxy.new_for_bus_sync(
                Gio.BusType.SYSTEM,
                Gio.DBusProxyFlags.NONE,
                null,
                TUNED_NAME,
                TUNED_PATH,
                TUNED_INTERFACE,
                null,
            );
        } catch (error) {
            log(`Non Suspend: TuneD indisponível (${error.message})`);
            return null;
        }
    }

    _applyPowerSaver() {
        if (this._tunedProxy) {
            try {
                const activeProfile = this._tunedProxy.call_sync(
                    'active_profile',
                    null,
                    Gio.DBusCallFlags.NONE,
                    -1,
                    null,
                );
                this._previousTunedProfile = activeProfile
                    .get_child_value(0)
                    .deep_unpack();
                const result = this._tunedProxy.call_sync(
                    'switch_profile',
                    new GLib.Variant('(s)', [TUNED_POWER_SAVER]),
                    Gio.DBusCallFlags.NONE,
                    -1,
                    null,
                );
                const response = result.get_child_value(0);
                if (!response.get_child_value(0).get_boolean())
                    throw new Error(response.get_child_value(1).deep_unpack());
                this._activeBackend = 'tuned';
                return;
            } catch (error) {
                logError(error, 'Non Suspend não conseguiu ativar o perfil powersave do TuneD');
                this._previousTunedProfile = null;
            }
        }

        if (!this._profileProxy)
            return;

        try {
            this._previousPowerProfile = this._profileProxy
                .get_cached_property('ActiveProfile')?.deep_unpack() ?? null;
            this._setProfile(POWER_PROFILES_POWER_SAVER);
            this._activeBackend = 'power-profiles-daemon';
        } catch (error) {
            logError(error, 'Non Suspend não conseguiu ativar o perfil econômico');
            this._previousPowerProfile = null;
        }
    }

    _restorePowerProfile() {
        if (this._activeBackend === 'tuned' && this._previousTunedProfile) {
            try {
                this._tunedProxy.call_sync(
                    'switch_profile',
                    new GLib.Variant('(s)', [this._previousTunedProfile]),
                    Gio.DBusCallFlags.NONE,
                    -1,
                    null,
                );
            } catch (error) {
                logError(error, 'Non Suspend não conseguiu restaurar o perfil do TuneD');
            }
            this._previousTunedProfile = null;
            this._activeBackend = null;
            return;
        }

        if (this._activeBackend !== 'power-profiles-daemon' ||
            !this._profileProxy || !this._previousPowerProfile)
            return;

        try {
            this._setProfile(this._previousPowerProfile);
        } catch (error) {
            logError(error, 'Non Suspend não conseguiu restaurar o perfil de energia');
        }
        this._previousPowerProfile = null;
        this._activeBackend = null;
    }

    _setProfile(profile) {
        this._profileProxy.call_sync(
            'org.freedesktop.DBus.Properties.Set',
            new GLib.Variant('(ssv)', [
                POWER_PROFILES_INTERFACE,
                'ActiveProfile',
                new GLib.Variant('s', profile),
            ]),
            Gio.DBusCallFlags.NONE,
            -1,
            null,
        );
    }
}