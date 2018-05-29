import { Service } from "typedi";
import { Settings, APP_NAME, APP_VERSION, ENV_INFO } from "../common";
import axios from "axios"

export enum LogLevel {
    error = "error",
    warning = "warning",
    info = "info"
}

@Service()
export class LogService {

    constructor(private settings: Settings) {
    }

    /**
     * Writes log entry to all configured stores (console by default).
     * 
     * @param level Log level - `error | warning | info`
     * @param component Component or class or file name
     * @param process Process or method name
     * @param message Event description
     * @param context Event additional data
     * @param type Type of error if any
     * @param stack Stack trace of error if any
     */
    async write(level: LogLevel, component: string, process: string, message: string,
        context?: string, type?: string, stack?: string) {

        console.log(`${new Date().toISOString()} [${level}] ${component} : ${process} : ${message} : ${stack} : ${context}`);

        if (!!this.settings.EosSignService &&
            !!this.settings.EosSignService.LogAdapterUrl) {
            try {
                await axios.post(this.settings.EosSignService.LogAdapterUrl, {
                    appName: APP_NAME,
                    appVersion: APP_VERSION,
                    envInfo: ENV_INFO,
                    level,
                    component,
                    process,
                    context,
                    message,
                    callstack: stack,
                    exceptionType: type,
                    additionalSlackChannels: this.settings.EosSignService.LogSlackChannels
                });
            } catch (err) {
                console.warn("LogAdapter is configured, but throws error:");
                console.warn(err);
            }
        }
    }
}