"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const blockchainError_1 = require("./blockchainError");
class ConflictError extends blockchainError_1.BlockchainError {
    constructor(message) {
        super({ status: 409, message: message });
    }
}
exports.ConflictError = ConflictError;
//# sourceMappingURL=conflictError.js.map