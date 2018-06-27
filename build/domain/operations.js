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
const azure_storage_1 = require("azure-storage");
const common_1 = require("../common");
const queries_1 = require("./queries");
const typedi_1 = require("typedi");
var OperationType;
(function (OperationType) {
    OperationType["Single"] = "Single";
    OperationType["ManyInputs"] = "ManyInputs";
    OperationType["ManyOutputs"] = "ManyOutputs";
})(OperationType = exports.OperationType || (exports.OperationType = {}));
class OperationEntity extends queries_1.AzureEntity {
    get OperationId() {
        return this.PartitionKey;
    }
    isNotBuiltOrDeleted() {
        return !this.DeleteTime && (this.isSent() || this.isFailed());
    }
    isSent() {
        return !!this.SendTime;
    }
    isFailed() {
        return !!this.FailTime;
    }
}
__decorate([
    queries_1.Ignore(),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], OperationEntity.prototype, "OperationId", null);
__decorate([
    queries_1.Double(),
    __metadata("design:type", Number)
], OperationEntity.prototype, "Amount", void 0);
__decorate([
    queries_1.Int64(),
    __metadata("design:type", Number)
], OperationEntity.prototype, "Block", void 0);
exports.OperationEntity = OperationEntity;
class OperationActionEntity extends queries_1.AzureEntity {
    get OperationId() {
        return this.PartitionKey;
    }
}
__decorate([
    queries_1.Ignore(),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], OperationActionEntity.prototype, "OperationId", null);
__decorate([
    queries_1.Double(),
    __metadata("design:type", Number)
], OperationActionEntity.prototype, "Amount", void 0);
exports.OperationActionEntity = OperationActionEntity;
class OperationByExpiryTimeEntity extends queries_1.AzureEntity {
    get ExpiryTime() {
        return new Date(this.PartitionKey);
    }
    get OperationId() {
        return this.RowKey;
    }
}
__decorate([
    queries_1.Ignore(),
    __metadata("design:type", Date),
    __metadata("design:paramtypes", [])
], OperationByExpiryTimeEntity.prototype, "ExpiryTime", null);
__decorate([
    queries_1.Ignore(),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], OperationByExpiryTimeEntity.prototype, "OperationId", null);
exports.OperationByExpiryTimeEntity = OperationByExpiryTimeEntity;
class OperationByTxIdEntity extends queries_1.AzureEntity {
    get TxId() {
        return this.PartitionKey;
    }
}
__decorate([
    queries_1.Ignore(),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], OperationByTxIdEntity.prototype, "TxId", null);
exports.OperationByTxIdEntity = OperationByTxIdEntity;
let OperationRepository = class OperationRepository extends queries_1.AzureRepository {
    constructor(settings) {
        super(settings.EosApi.DataConnectionString);
        this.settings = settings;
        this.operationTableName = "EosOperations";
        this.operationActionTableName = "EosOperationActions";
        this.operationByExpiryTimeTableName = "EosOperationsByExpiryTime";
        this.operationByTxIdTableName = "EosOperationsByTxId";
    }
    async upsert(operationId, type, assetId, actions, expiryTime) {
        const operationEntity = new OperationEntity();
        operationEntity.PartitionKey = operationId;
        operationEntity.RowKey = "";
        operationEntity.Type = type;
        operationEntity.AssetId = assetId;
        operationEntity.Amount = actions.reduce((sum, action) => sum + action.amount, 0);
        operationEntity.BuildTime = new Date();
        operationEntity.ExpiryTime = expiryTime;
        const operationActionEntities = actions.map((action, i) => {
            const entity = new OperationActionEntity();
            entity.PartitionKey = operationId;
            entity.RowKey = i.toString().padStart(4, "0");
            entity.From = action.fromAddress;
            entity.To = action.toAddress;
            entity.Amount = action.amount;
            return entity;
        });
        const operationByExpiryTimeEntity = new OperationByExpiryTimeEntity();
        operationByExpiryTimeEntity.PartitionKey = expiryTime.toISOString();
        operationByExpiryTimeEntity.RowKey = operationId;
        await this.insertOrMerge(this.operationTableName, operationEntity);
        await this.insertOrMerge(this.operationActionTableName, operationActionEntities);
        await this.insertOrMerge(this.operationByExpiryTimeTableName, operationByExpiryTimeEntity);
    }
    async updateSend(operationId, txId) {
        const operationEntity = new OperationEntity();
        operationEntity.PartitionKey = operationId;
        operationEntity.RowKey = "";
        operationEntity.SendTime = new Date();
        operationEntity.TxId = txId;
        await this.insertOrMerge(this.operationTableName, operationEntity);
    }
    async updateFail(operationId, error) {
        const operationEntity = new OperationEntity();
        operationEntity.PartitionKey = operationId;
        operationEntity.RowKey = "";
        operationEntity.FailTime = new Date();
        operationEntity.Error = error;
        await this.insertOrMerge(this.operationTableName, operationEntity);
    }
    async get(operationId) {
        return await this.select(OperationEntity, this.operationTableName, operationId, "");
    }
    async getActions(operationId) {
        return await this.selectAll(async (c) => await this.select(OperationActionEntity, this.operationActionTableName, new azure_storage_1.TableQuery().where("PartitionKey == ?", operationId), c));
    }
};
OperationRepository = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [common_1.Settings])
], OperationRepository);
exports.OperationRepository = OperationRepository;
//# sourceMappingURL=operations.js.map