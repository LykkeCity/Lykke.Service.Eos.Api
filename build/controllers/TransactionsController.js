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
const operations_1 = require("../domain/operations");
const common_1 = require("../common");
const notImplementedError_1 = require("../errors/notImplementedError");
class BuildSingleRequest {
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    class_validator_1.IsUUID(),
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
class Input {
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], Input.prototype, "fromAddress", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], Input.prototype, "amount", void 0);
class BuildManyInputsRequest {
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    class_validator_1.IsUUID(),
    __metadata("design:type", String)
], BuildManyInputsRequest.prototype, "operationId", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", Array)
], BuildManyInputsRequest.prototype, "inputs", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], BuildManyInputsRequest.prototype, "toAddress", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], BuildManyInputsRequest.prototype, "assetId", void 0);
class Output {
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], Output.prototype, "toAddress", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], Output.prototype, "amount", void 0);
class BuildManyOutputsRequest {
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    class_validator_1.IsUUID(),
    __metadata("design:type", String)
], BuildManyOutputsRequest.prototype, "operationId", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], BuildManyOutputsRequest.prototype, "fromAddress", void 0);
__decorate([
    class_validator_1.IsArray(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", Array)
], BuildManyOutputsRequest.prototype, "outputs", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    __metadata("design:type", String)
], BuildManyOutputsRequest.prototype, "assetId", void 0);
class BroadcastRequest {
}
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    class_validator_1.IsUUID(),
    __metadata("design:type", String)
], BroadcastRequest.prototype, "operationId", void 0);
__decorate([
    class_validator_1.IsString(),
    class_validator_1.IsNotEmpty(),
    class_validator_1.IsBase64(),
    __metadata("design:type", String)
], BroadcastRequest.prototype, "signedTransaction", void 0);
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
        const items = Array.of(new operations_1.OperationItem(request.fromAddress, request.toAddress, asset, request.amount));
        const txctx = await this.eosService.buildTransaction(request.operationId, items);
        return new BuildResponse(common_1.toBase64(txctx));
    }
    async buildManyInputs(request) {
        const asset = await this.assetRepository.get(request.assetId);
        const items = request.inputs.map(vin => new operations_1.OperationItem(vin.fromAddress, request.toAddress, asset, vin.amount));
        const txctx = await this.eosService.buildTransaction(request.operationId, items);
        return new BuildResponse(common_1.toBase64(txctx));
    }
    async buildManyOutputs(request) {
        const asset = await this.assetRepository.get(request.assetId);
        const items = request.outputs.map(out => new operations_1.OperationItem(request.fromAddress, out.toAddress, asset, out.amount));
        const txctx = await this.eosService.buildTransaction(request.operationId, items);
        return new BuildResponse(common_1.toBase64(txctx));
    }
    async Rebuild() {
        throw new notImplementedError_1.NotImplementedError();
    }
    async broadcast(request) {
        return await this.eosService.broadcastTransaction(request.operationId, common_1.fromBase64(request.signedTransaction));
    }
};
__decorate([
    routing_controllers_1.Post("/single"),
    __param(0, routing_controllers_1.Body({ required: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BuildSingleRequest]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "buildSingle", null);
__decorate([
    routing_controllers_1.Post("/many-inputs"),
    __param(0, routing_controllers_1.Body({ required: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BuildManyInputsRequest]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "buildManyInputs", null);
__decorate([
    routing_controllers_1.Post("/many-outputs"),
    __param(0, routing_controllers_1.Body({ required: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BuildManyOutputsRequest]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "buildManyOutputs", null);
__decorate([
    routing_controllers_1.Put(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "Rebuild", null);
__decorate([
    routing_controllers_1.Post("/broadcast"),
    __param(0, routing_controllers_1.Body({ required: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BroadcastRequest]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "broadcast", null);
TransactionsController = __decorate([
    routing_controllers_1.JsonController("/transactions"),
    __metadata("design:paramtypes", [eosService_1.EosService, assets_1.AssetRepository])
], TransactionsController);
exports.TransactionsController = TransactionsController;
//# sourceMappingURL=transactionsController.js.map