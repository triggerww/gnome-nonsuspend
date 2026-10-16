import Gio from 'gi://Gio';

const UPOWER_NAME = 'org.freedesktop.UPower';
const UPOWER_PATH = '/org/freedesktop/UPower';
const UPOWER_INTERFACE = 'org.freedesktop.UPower';

export class LidMonitor {
    constructor(onChanged) {
        this._onChanged = onChanged;
        this._lastState = null;
        this._proxy = null;

        try {
            this._proxy = Gio.DBusProxy.new_for_bus_sync(
                Gio.BusType.SYSTEM,
                Gio.DBusProxyFlags.NONE,
                null,
                UPOWER_NAME,
                UPOWER_PATH,
                UPOWER_INTERFACE,
                null,
            );
        } catch (error) {
            log(`Non Suspend: UPower indisponível (${error.message})`);
            return;
        }

        this._propertiesChangedId = this._proxy.connect(
            'g-properties-changed',
            () => this._notifyIfChanged(),
        );
        this._notifyIfChanged();
    }

    get isClosed() {
        return this._proxy?.get_cached_property('LidIsClosed')?.get_boolean() ?? false;
    }

    destroy() {
        if (this._propertiesChangedId) {
            this._proxy.disconnect(this._propertiesChangedId);
            this._propertiesChangedId = 0;
        }
        this._proxy = null;
        this._onChanged = null;
    }

    _notifyIfChanged() {
        if (!this._proxy || !this._onChanged)
            return;

        const closed = this.isClosed;
        if (closed === this._lastState)
            return;

        this._lastState = closed;
        this._onChanged(closed);
    }
}