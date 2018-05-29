"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routing_controllers_1 = require("routing-controllers");
class NotImplementedError extends routing_controllers_1.HttpError {
    constructor(message) {
        super(501, message);
    }
}
exports.NotImplementedError = NotImplementedError;
//# sourceMappingURL=notImplementedError.js.map