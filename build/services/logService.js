"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
}
Object.defineProperty(exports, "__esModule", { value: true });
const typedi_1 = require("typedi");
const common_1 = require("../common");
const axios_1 = __importDefault(require("axios"));
var LogLevel;
(function (LogLevel) {
    LogLevel["error"] = "error";
    LogLevel["warning"] = "warning";
    LogLevel["info"] = "info";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
let LogService = class LogService {
    constructor(settings) {
        this.settings = settings;
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
    async write(level, component, process, message, context, type, stack) {
        console.log(`${new Date().toISOString()} [${level}] ${component} : ${process} : ${message} : ${stack} : ${context}`);
        if (!!this.settings.EosSignService &&
            !!this.settings.EosSignService.LogAdapterUrl) {
            try {
                await axios_1.default.post(this.settings.EosSignService.LogAdapterUrl, {
                    appName: common_1.APP_NAME,
                    appVersion: common_1.APP_VERSION,
                    envInfo: common_1.ENV_INFO,
                    level,
                    component,
                    process,
                    context,
                    message,
                    callstack: stack,
                    exceptionType: type,
                    additionalSlackChannels: this.settings.EosSignService.LogSlackChannels
                });
            }
            catch (err) {
                console.warn("LogAdapter is configured, but throws error:");
                console.warn(err);
            }
        }
    }
};
LogService = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [common_1.Settings])
], LogService);
exports.LogService = LogService;
//# sourceMappingURL=logService.js.map