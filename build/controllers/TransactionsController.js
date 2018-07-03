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
const blockchainError_1 = require("../errors/blockchainError");
const history_1 = require("../domain/history");
const balances_1 = require("../domain/balances");
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
var State;
(function (State) {
    State["inProgress"] = "inProgress";
    State["completed"] = "completed";
    State["failed"] = "failed";
})(State || (State = {}));
class SignedTransactionModel {
}
let TransactionsController = TransactionsController_1 = class TransactionsController {
    constructor(logService, eosService, operationRepository, assetRepository, historyRepository, balanceRepository) {
        this.logService = logService;
        this.eosService = eosService;
        this.operationRepository = operationRepository;
        this.assetRepository = assetRepository;
        this.historyRepository = historyRepository;
        this.balanceRepository = balanceRepository;
    }
    getAccount(address) {
        return address.split(common_1.ADDRESS_SEPARATOR)[0];
    }
    isSimulated(from, to) {
        return this.getAccount(from) == this.getAccount(to);
    }
    getState(operation) {
        return !!operation.FailTime ? State.failed : !!operation.CompletionTime ? State.completed : State.inProgress;
    }
    getTimestamp(operation) {
        return operation.FailTime || operation.CompletionTime || operation.SendTime;
    }
    async build(type, operationId, assetId, inOut) {
        const operation = await this.operationRepository.get(operationId);
        if (!!operation && operation.isSent()) {
            throw new blockchainError_1.BlockchainError({ status: 409, message: `Operation [${operationId}] already broadcasted` });
        }
        const asset = await this.assetRepository.get(assetId);
        if (asset == null) {
            throw new blockchainError_1.BlockchainError({ status: 400, message: `Unknown asset [${assetId}]` });
        }
        const opActions = [];
        const txActions = [];
        for (const action of inOut) {
            if (!this.eosService.validate(action.fromAddress)) {
                throw new blockchainError_1.BlockchainError({ status: 400, message: `Invalid address [${action.fromAddress}]` });
            }
            if (!this.eosService.validate(action.toAddress)) {
                throw new blockchainError_1.BlockchainError({ status: 400, message: `Invalid address [${action.toAddress}]` });
            }
            const amountInBaseUnit = parseInt(action.amount);
            if (Number.isNaN(amountInBaseUnit) || amountInBaseUnit <= 0) {
                throw new blockchainError_1.BlockchainError({ status: 400, message: `Invalid amount [${action.amount}]` });
            }
            const amount = asset.fromBaseUnit(amountInBaseUnit);
            opActions.push(Object.assign({}, action, { amountInBaseUnit: amountInBaseUnit, amount: amount }));
            let balanceInBaseUnit = 0;
            if (this.isSimulated(action.fromAddress, action.toAddress)) {
                const balanceEntity = await this.balanceRepository.get(action.fromAddress, assetId);
                balanceInBaseUnit = balanceEntity && balanceEntity.AmountInBaseUnit;
            }
            else {
                const from = this.getAccount(action.fromAddress);
                const to = this.getAccount(action.toAddress);
                const quantity = `${amount.toFixed(asset.Accuracy)} ${asset.AssetId}`;
                const memo = action.toAddress.split(common_1.ADDRESS_SEPARATOR)[1] || "";
                const balanceAmount = await this.eosService.getBalance(from, asset.Address, asset.AssetId);
                balanceInBaseUnit = asset.toBaseUnit(balanceAmount);
                txActions.push({
                    account: asset.Address,
                    name: "transfer",
                    authorization: [{ actor: from, permission: "active" }],
                    data: { from, to, quantity, memo }
                });
            }
            if (balanceInBaseUnit < amountInBaseUnit) {
                throw new blockchainError_1.BlockchainError({ status: 400, message: `Not enough balance on address [${action.fromAddress}]`, errorCode: blockchainError_1.ErrorCode.notEnoughBalance });
            }
        }
        const context = {
            chainId: await this.eosService.getChainId(),
            headers: await this.eosService.getTransactionHeaders(),
            actions: txActions
        };
        await this.operationRepository.upsert(operationId, type, assetId, opActions, common_1.isoUTC(context.headers.expiration));
        return {
            transactionContext: common_1.toBase64(context)
        };
    }
    async getHistory(category, address, take, afterHash) {
        if (take <= 0) {
            throw new routing_controllers_1.BadRequestError("Query parameter [take] is required");
        }
        if (!this.eosService.validate(address)) {
            throw new routing_controllers_1.BadRequestError(`Invalid address [${address}]`);
        }
        const history = await this.historyRepository.get(category, address, take, afterHash);
        return history.map(e => ({
            timestamp: e.BlockTime,
            fromAddress: e.From,
            toAsdress: e.To,
            assetId: e.AssetId,
            amount: e.AmountInBaseUnit.toFixed(),
            hash: e.TxId
        }));
    }
    async buildSingle(request) {
        return await this.build(operations_1.OperationType.Single, request.operationId, request.assetId, Array.of(request));
    }
    async buildManyInputs(request) {
        return await this.build(operations_1.OperationType.ManyInputs, request.operationId, request.assetId, request.inputs.map(vin => (Object.assign({ toAddress: request.toAddress }, vin))));
    }
    async buildManyOutputs(request) {
        return await this.build(operations_1.OperationType.ManyOutputs, request.operationId, request.assetId, request.outputs.map(vout => (Object.assign({ fromAddress: request.fromAddress }, vout))));
    }
    async Rebuild() {
        throw new notImplementedError_1.NotImplementedError();
    }
    async broadcast(request) {
        const operation = await this.operationRepository.get(request.operationId);
        const operationActions = await this.operationRepository.getActions(request.operationId);
        const block = await this.eosService.getLastIrreversibleBlockNumber();
        const now = new Date();
        const tx = common_1.fromBase64(request.signedTransaction);
        let txId = tx.txId;
        if (!!txId) {
            // for fully simulated transaction we mark
            // operation as completed immediately
            await this.operationRepository.update(request.operationId, { sendTime: now, txId, completionTime: now, blockTime: now, block });
        }
        else {
            if (!operation || !operation.isSent()) {
                try {
                    txId = await this.eosService.pushTransaction(tx);
                }
                catch (error) {
                    if (error.status == 400) {
                        throw new blockchainError_1.BlockchainError({ status: error.status, message: `Transaction rejected`, data: JSON.parse(error.message) });
                    }
                    else {
                        throw error;
                    }
                }
            }
            await this.operationRepository.update(request.operationId, { sendTime: now, txId });
        }
        for (const action of operationActions) {
            // record balance changes
            const balanceChanges = [
                { address: action.from, affix: -action.Amount, affixInBaseUnit: -action.AmountInBaseUnit },
                { address: action.ToAddress, affix: action.Amount, affixInBaseUnit: action.AmountInBaseUnit }
            ];
            for (const bc of balanceChanges) {
                await this.balanceRepository.upsert(bc.address, operation.AssetId, operation.OperationId, bc.affix, bc.affixInBaseUnit);
                await this.logService.write(logService_1.LogLevel.info, TransactionsController_1.name, this.broadcast.name, "Balance change recorded", JSON.stringify(Object.assign({}, bc, { assetId: operation.AssetId, txId })));
            }
            // upsert history of simulated operation actions
            if (this.isSimulated(action.FromAddress, action.ToAddress)) {
                await this.historyRepository.upsert(action.FromAddress, action.ToAddress, operation.AssetId, action.Amount, action.AmountInBaseUnit, block, now, txId, action.RowKey, operation.OperationId);
            }
        }
    }
    async getSingle(operationId) {
        const operation = await this.operationRepository.get(operationId);
        if (!!operation) {
            return {
                operationId,
                state: this.getState(operation),
                timestamp: this.getTimestamp(operation),
                amount: operation.AmountInBaseUnit.toFixed(),
                fee: "0",
                hash: operation.TxId,
                block: operation.Block,
                error: operation.Error
            };
        }
        else {
            return null;
        }
    }
    async getManyInputs(operationId) {
        const operation = await this.operationRepository.get(operationId);
        if (!!operation && operation.isNotBuiltOrDeleted()) {
            const actions = await this.operationRepository.getActions(operationId);
            return {
                operationId,
                state: this.getState(operation),
                timestamp: this.getTimestamp(operation),
                inputs: actions.map(a => ({
                    amount: a.AmountInBaseUnit.toFixed(),
                    fromAddress: a.FromAddress
                })),
                fee: "0",
                hash: operation.TxId,
                block: operation.Block,
                error: operation.Error
            };
        }
        else {
            return null;
        }
    }
    async getManyOutputs(operationId) {
        const operation = await this.operationRepository.get(operationId);
        if (!!operation) {
            const actions = await this.operationRepository.getActions(operationId);
            return {
                operationId,
                state: this.getState(operation),
                timestamp: this.getTimestamp(operation),
                outputs: actions.map(a => ({
                    amount: a.AmountInBaseUnit.toFixed(),
                    toAddress: a.ToAddress
                })),
                fee: "0",
                hash: operation.TxId,
                block: operation.Block,
                error: operation.Error
            };
        }
        else {
            return null;
        }
    }
    async deleteBroadcasted(operationId) {
        await this.operationRepository.update(operationId, {
            deleteTime: new Date()
        });
    }
    async getHistoryFrom(address, take, afterHash) {
        return await this.getHistory(history_1.HistoryAddressCategory.From, address, take, afterHash);
    }
    async getHistoryTo(address, take, afterHash) {
        return await this.getHistory(history_1.HistoryAddressCategory.To, address, take, afterHash);
    }
    async observeFrom(address) {
        // always OK due to controlling transaction tracking by node's configuration
    }
    async deleteFromObservation(address) {
        // always OK due to controlling transaction tracking by node's configuration
    }
    async observeTo(address) {
        // always OK due to controlling transaction tracking by node's configuration
    }
    async deleteToObservation(address) {
        // always OK due to controlling transaction tracking by node's configuration
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
__decorate([
    routing_controllers_1.Get("/broadcast/single/:operationId"),
    routing_controllers_1.OnNull(204),
    routing_controllers_1.OnUndefined(204),
    __param(0, routing_controllers_1.Param("operationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getSingle", null);
__decorate([
    routing_controllers_1.Get("/broadcast/many-inputs/:operationId"),
    routing_controllers_1.OnNull(204),
    routing_controllers_1.OnUndefined(204),
    __param(0, routing_controllers_1.Param("operationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getManyInputs", null);
__decorate([
    routing_controllers_1.Get("/broadcast/many-outputs/:operationId"),
    routing_controllers_1.OnNull(204),
    routing_controllers_1.OnUndefined(204),
    __param(0, routing_controllers_1.Param("operationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getManyOutputs", null);
__decorate([
    routing_controllers_1.Delete("/boradcast/:operationId"),
    routing_controllers_1.OnNull(200),
    routing_controllers_1.OnUndefined(200),
    __param(0, routing_controllers_1.Param("operationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "deleteBroadcasted", null);
__decorate([
    routing_controllers_1.Get("/history/from/:address"),
    __param(0, routing_controllers_1.Param("address")),
    __param(1, routing_controllers_1.QueryParam("take", { required: true })),
    __param(2, routing_controllers_1.QueryParam("afterHash")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getHistoryFrom", null);
__decorate([
    routing_controllers_1.Get("/history/to/:address"),
    __param(0, routing_controllers_1.Param("address")),
    __param(1, routing_controllers_1.QueryParam("take", { required: true })),
    __param(2, routing_controllers_1.QueryParam("afterHash")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getHistoryTo", null);
__decorate([
    routing_controllers_1.Post("/history/from/:address/observation"),
    routing_controllers_1.HttpCode(200),
    routing_controllers_1.OnNull(200),
    routing_controllers_1.OnUndefined(200),
    __param(0, routing_controllers_1.Param("address")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "observeFrom", null);
__decorate([
    routing_controllers_1.Delete("/history/from/:address/observation"),
    routing_controllers_1.HttpCode(200),
    routing_controllers_1.OnNull(200),
    routing_controllers_1.OnUndefined(200),
    __param(0, routing_controllers_1.Param("address")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "deleteFromObservation", null);
__decorate([
    routing_controllers_1.Post("/history/to/:address/observation"),
    routing_controllers_1.HttpCode(200),
    routing_controllers_1.OnNull(200),
    routing_controllers_1.OnUndefined(200),
    __param(0, routing_controllers_1.Param("address")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "observeTo", null);
__decorate([
    routing_controllers_1.Delete("/history/to/:address/observation"),
    routing_controllers_1.HttpCode(200),
    routing_controllers_1.OnNull(200),
    routing_controllers_1.OnUndefined(200),
    __param(0, routing_controllers_1.Param("address")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "deleteToObservation", null);
TransactionsController = TransactionsController_1 = __decorate([
    routing_controllers_1.JsonController("/transactions"),
    __metadata("design:paramtypes", [logService_1.LogService,
        eosService_1.EosService,
        operations_1.OperationRepository,
        assets_1.AssetRepository,
        history_1.HistoryRepository,
        balances_1.BalanceRepository])
], TransactionsController);
exports.TransactionsController = TransactionsController;
var TransactionsController_1;
//# sourceMappingURL=transactionsController.js.map