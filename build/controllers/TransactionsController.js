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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const routing_controllers_1 = require("routing-controllers");
const class_validator_1 = require("class-validator");
const eosService_1 = require("../services/eosService");
const assets_1 = require("../domain/assets");
const common_1 = require("../common");
class BuildSingleRequest {
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], BuildSingleRequest.prototype, "operationId", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], BuildSingleRequest.prototype, "fromAddress", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], BuildSingleRequest.prototype, "toAddress", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], BuildSingleRequest.prototype, "assetId", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], BuildSingleRequest.prototype, "amount", void 0);
exports.BuildSingleRequest = BuildSingleRequest;
class BuildResponse {
    constructor(transactionContext) {
        this.transactionContext = transactionContext;
    }
}
let TransactionsController = class TransactionsController {
    constructor(eosService, assetRepository) {
        this.eosService = eosService;
        this.assetRepository = assetRepository;
    }
    async buildSingle(request) {
        const asset = await this.assetRepository.get(request.assetId);
        const txctx = await this.eosService.buildTransaction(request.operationId, [{
                from: request.fromAddress,
                to: request.toAddress,
                asset: asset,
                amount: parseInt(request.amount) / Math.pow(10, asset.accuracy)
            }]);
        return new BuildResponse(common_1.toBase64(txctx));
    }
};
__decorate([
    routing_controllers_1.Post("/single"),
    __param(0, routing_controllers_1.Body({ required: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BuildSingleRequest]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "buildSingle", null);
TransactionsController = __decorate([
    routing_controllers_1.JsonController("/transactions"),
    __metadata("design:paramtypes", [eosService_1.EosService, assets_1.AssetRepository])
], TransactionsController);
exports.TransactionsController = TransactionsController;
//# sourceMappingURL=transactionsController.js.map