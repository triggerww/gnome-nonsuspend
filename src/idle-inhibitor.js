import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const SESSION_MANAGER_NAME = 'org.gnome.SessionManager';
const SESSION_MANAGER_PATH = '/org/gnome/SessionManager';
const SESSION_MANAGER_INTERFACE = 'org.gnome.SessionManager';

export class SessionIdleInhibitor {
    constructor() {
        this._cookie = null;
        this._proxy = null;

        try {
            this._proxy = Gio.DBusProxy.new_for_bus_sync(
                Gio.BusType.SESSION,
                Gio.DBusProxyFlags.NONE,
                null,
                SESSION_MANAGER_NAME,
                SESSION_MANAGER_PATH,
                SESSION_MANAGER_INTERFACE,
                null,
            );
        } catch (error) {
            log(`Non Suspend: SessionManager indisponível (${error.message})`);
        }
    }

    get isActive() {
        return this._cookie !== null;
    }

    start() {
        if (this.isActive)
            return true;

        if (!this._proxy)
            return false;

        try {
            const result = this._proxy.call_sync(
                'Inhibit',
                new GLib.Variant('(susu)', [
                    'Non Suspend',
                    0,
                    'Manter a tela ligada com a tampa aberta',
                    8,
                ]),
                Gio.DBusCallFlags.NONE,
                -1,
                null,
            );
            this._cookie = result.get_child_value(0).get_uint32();
            return true;
        } catch (error) {
            logError(error, 'Non Suspend não conseguiu impedir o apagamento da tela');
            return false;
        }
    }

    stop() {
        if (!this.isActive || !this._proxy)
            return;

        try {
            this._proxy.call_sync(
                'Uninhibit',
                new GLib.Variant('(u)', [this._cookie]),
                Gio.DBusCallFlags.NONE,
                -1,
                null,
            );
        } catch (error) {
            logError(error, 'Non Suspend não conseguiu liberar o apagamento da tela');
        }
        this._cookie = null;
    }
}