import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const AUDIO_SINK = '@DEFAULT_AUDIO_SINK@';

export class LidDeviceState {
    constructor() {
        this._brightnessctl = GLib.find_program_in_path('brightnessctl');
        this._wpctl = GLib.find_program_in_path('wpctl');
        this._brightness = null;
        this._volume = null;
        this._wasMuted = null;
        this._applied = false;
    }

    apply() {
        if (this._applied)
            return;

        this._applied = true;
        this._applyBrightness();
        this._applyAudio();
    }

    restore() {
        if (!this._applied)
            return;

        this._restoreBrightness();
        this._restoreAudio();
        this._applied = false;
    }

    _applyBrightness() {
        if (!this._brightnessctl)
            return;

        try {
            this._brightness = this._run([
                this._brightnessctl,
                'get',
            ]);
            this._run([
                this._brightnessctl,
                'set',
                '1',
            ]);
        } catch (error) {
            log(`Non Suspend: brilho não alterado (${error.message})`);
        }
    }

    _restoreBrightness() {
        if (!this._brightnessctl || this._brightness === null)
            return;

        try {
            this._run([
                this._brightnessctl,
                'set',
                this._brightness,
            ]);
        } catch (error) {
            log(`Non Suspend: brilho não restaurado (${error.message})`);
        }
        this._brightness = null;
    }

    _applyAudio() {
        if (!this._wpctl)
            return;

        try {
            const state = this._run([this._wpctl, 'get-volume', AUDIO_SINK]);
            const match = state.match(/Volume:\s+([0-9.]+)/);
            if (!match)
                throw new Error('volume atual não reconhecido');

            this._volume = match[1];
            this._wasMuted = state.includes('[MUTED]');
        } catch (error) {
            log(`Non Suspend: áudio não alterado (${error.message})`);
            return;
        }

        try {
            this._run([this._wpctl, 'set-volume', AUDIO_SINK, '0']);
            this._run([this._wpctl, 'set-mute', AUDIO_SINK, '1']);
        } catch (error) {
            log(`Non Suspend: áudio aplicado parcialmente (${error.message})`);
        }
    }

    _restoreAudio() {
        if (!this._wpctl || this._volume === null)
            return;

        try {
            this._run([this._wpctl, 'set-volume', AUDIO_SINK, this._volume]);
            this._run([
                this._wpctl,
                'set-mute',
                AUDIO_SINK,
                this._wasMuted ? '1' : '0',
            ]);
        } catch (error) {
            log(`Non Suspend: áudio não restaurado (${error.message})`);
        }
        this._volume = null;
        this._wasMuted = null;
    }

    _run(argv) {
        const process = Gio.Subprocess.new(
            argv,
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
        );
        const [success, stdout, stderr] = process.communicate_utf8(null, null);
        if (!success)
            throw new Error(stderr.trim() || `comando falhou: ${argv[0]}`);
        return stdout.trim();
    }
}