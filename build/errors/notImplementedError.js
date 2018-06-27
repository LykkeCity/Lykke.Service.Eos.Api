"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blockchainError_1 = require("./blockchainError");
class NotImplementedError extends blockchainError_1.BlockchainError {
    constructor(message) {
        super({ status: 501, message: message });
    }
}
exports.NotImplementedError = NotImplementedError;
//# sourceMappingURL=notImplementedError.js.map