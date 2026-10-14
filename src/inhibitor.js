import Gio from 'gi://Gio';

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

export class LidInhibitor {
    constructor(onExit) {
        this._process = null;
        this._onExit = onExit;
    }

    get isRunning() {
        return this._process !== null;
    }

    start() {
        if (this.isRunning)
            return true;

        try {
            this._process = Gio.Subprocess.new(
                INHIBITOR_ARGS,
                Gio.SubprocessFlags.NONE,
            );
            this._watchProcess(this._process);
            return true;
        } catch (error) {
            logError(error, 'Non Suspend não conseguiu iniciar o bloqueio da tampa');
            return false;
        }
    }

    stop() {
        if (!this._process)
            return;

        const process = this._process;
        this._process = null;
        process.force_exit();
    }

    _watchProcess(process) {
        process.wait_check_async(null, (subprocess, result) => {
            try {
                subprocess.wait_check_finish(result);
            } catch (error) {
                if (this._process === process)
                    logError(error, 'O bloqueio da tampa do Non Suspend foi encerrado');
            }

            if (this._process !== process)
                return;

            this._process = null;
            this._onExit();
        });
    }
}