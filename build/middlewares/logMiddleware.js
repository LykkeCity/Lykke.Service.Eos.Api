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
Object.defineProperty(exports, "__esModule", { value: true });
const routing_controllers_1 = require("routing-controllers");
const logService_1 = require("../services/logService");
let LogMiddleware = LogMiddleware_1 = class LogMiddleware {
    constructor(log) {
        this.log = log;
    }
    async use(ctx, next) {
        // we don't need to wrap this into try..catch because
        // routing-controllers lib has built-in error handler
        // see https://github.com/typestack/routing-controllers#error-handlers for details
        await next();
        // log client and server errors
        if (ctx.status >= 400) {
            const level = ctx.status < 500 ? logService_1.LogLevel.warning
                : logService_1.LogLevel.error;
            const component = LogMiddleware_1.name;
            const process = ctx.url;
            const message = ctx.body && ctx.body.message || ctx.message;
            const context = ctx.request.body && JSON.stringify(ctx.request.body);
            const error = ctx.body && ctx.body.name;
            const stack = ctx.body && ctx.body.stack;
            await this.log.write(level, component, process, message, context, error, stack);
        }
    }
};
LogMiddleware = LogMiddleware_1 = __decorate([
    routing_controllers_1.Middleware({ type: 'before' }),
    __metadata("design:paramtypes", [logService_1.LogService])
], LogMiddleware);
exports.LogMiddleware = LogMiddleware;
var LogMiddleware_1;
//# sourceMappingURL=logMiddleware.js.map