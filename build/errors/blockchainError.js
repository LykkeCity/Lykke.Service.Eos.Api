"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const routing_controllers_1 = require("routing-controllers");
var ErrorCode;
(function (ErrorCode) {
    ErrorCode["unknown"] = "unknown";
    ErrorCode["amountIsTooSmall"] = "amountIsTooSmall";
    ErrorCode["notEnoughBalance"] = "notEnoughBalance";
})(ErrorCode = exports.ErrorCode || (exports.ErrorCode = {}));
class BlockchainError extends routing_controllers_1.HttpError {
    constructor(params) {
        super(params.status || 500, params.message);
        this.errorCode = params.errorCode || ErrorCode.unknown;
        this.data = params.data;
    }
}
exports.BlockchainError = BlockchainError;
//# sourceMappingURL=blockchainError.js.map