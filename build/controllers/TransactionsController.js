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
const logService_1 = require("../services/logService");
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
let TransactionsController = TransactionsController_1 = class TransactionsController {
    constructor(logService, eosService, assetRepository, operationRepository) {
        this.logService = logService;
        this.eosService = eosService;
        this.assetRepository = assetRepository;
        this.operationRepository = operationRepository;
    }
    isFake(action) {
        return action.fromAddress.split(common_1.ADDRESS_SEPARATOR)[0] == action.toAddress.split(common_1.ADDRESS_SEPARATOR)[0];
    }
    async ensureAsset(assetId) {
        const asset = await this.assetRepository.get(assetId);
        if (!!asset) {
            return asset;
        }
        throw new routing_controllers_1.BadRequestError("Unknown asset");
    }
    async build(type, operationId, assetId, inputsOutputs) {
        const asset = await this.ensureAsset(assetId);
        const actions = inputsOutputs.map(e => (Object.assign({}, e, { amount: asset.parse(e.amount) })));
        const context = {
            chainId: await this.eosService.getChainId(),
            headers: await this.eosService.getTransactionHeaders(),
            actions: actions
                .filter(action => !this.isFake(action))
                .map(action => {
                const from = action.fromAddress.split(common_1.ADDRESS_SEPARATOR)[0];
                const memo = action.fromAddress.split(common_1.ADDRESS_SEPARATOR)[1] || "";
                const to = action.toAddress.split(common_1.ADDRESS_SEPARATOR)[0];
                const quantity = `${action.amount.toFixed(asset.Accuracy)} ${asset.AssetId}`;
                return {
                    account: asset.Address,
                    name: "transfer",
                    authorization: [{ actor: from, permission: "active" }],
                    data: { from, to, quantity, memo }
                };
            })
        };
        await this.operationRepository.upsert(operationId, type, assetId, actions, common_1.isoUTC(context.headers.expiration));
        return {
            transactionContext: common_1.toBase64(context)
        };
    }
    async buildSingle(request) {
        return await this.build(operations_1.OperationType.Single, request.operationId, request.assetId, Array.of(request));
    }
    async buildManyInputs(request) {
        return await this.build(operations_1.OperationType.MultiFrom, request.operationId, request.assetId, request.inputs.map(vin => (Object.assign({ toAddress: request.toAddress }, vin))));
    }
    async buildManyOutputs(request) {
        return await this.build(operations_1.OperationType.MultiTo, request.operationId, request.assetId, request.outputs.map(vout => (Object.assign({ fromAddress: request.fromAddress }, vout))));
    }
    async Rebuild() {
        throw new notImplementedError_1.NotImplementedError();
    }
    async broadcast(request) {
        try {
            const txId = await this.eosService.pushTransaction(common_1.fromBase64(request.signedTransaction));
            await this.operationRepository.updateSend(request.operationId, txId);
        }
        catch (error) {
            if (!!error.status && error.status == 400) {
                // HTTP 400 means transaction data is wrong,
                // it's useless to repeat so mark as failed:
                await this.operationRepository.updateFail(request.operationId, error.message);
                await this.logService.write(logService_1.LogLevel.warning, TransactionsController_1.name, this.broadcast.name, "Transaction rejected", error.message, error.name, error.stack);
            }
            else {
                throw error;
            }
        }
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
    routing_controllers_1.OnNull(200),
    routing_controllers_1.OnUndefined(200),
    __param(0, routing_controllers_1.Body({ required: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [BroadcastRequest]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "broadcast", null);
TransactionsController = TransactionsController_1 = __decorate([
    routing_controllers_1.JsonController("/transactions"),
    __metadata("design:paramtypes", [logService_1.LogService,
        eosService_1.EosService,
        assets_1.AssetRepository,
        operations_1.OperationRepository])
], TransactionsController);
exports.TransactionsController = TransactionsController;
var TransactionsController_1;
//# sourceMappingURL=transactionsController.js.map