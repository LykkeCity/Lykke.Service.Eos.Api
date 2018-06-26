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
const common_1 = require("../common");
const queries_1 = require("./queries");
const util_1 = require("util");
const azure_storage_1 = require("azure-storage");
const typedi_1 = require("typedi");
class BalanceEntity extends queries_1.AzureEntity {
    get Address() {
        return this.PartitionKey;
    }
    get AssetId() {
        return this.RowKey;
    }
}
__decorate([
    queries_1.Ignore(),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], BalanceEntity.prototype, "Address", null);
__decorate([
    queries_1.Ignore(),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], BalanceEntity.prototype, "AssetId", null);
__decorate([
    queries_1.Double(),
    __metadata("design:type", Number)
], BalanceEntity.prototype, "Balance", void 0);
exports.BalanceEntity = BalanceEntity;
let BalanceRepository = class BalanceRepository extends queries_1.AzureRepository {
    constructor(settings) {
        super(settings.EosApi.DataConnectionString);
        this.settings = settings;
        this.tableName = "EosBalances";
    }
    /**
     * Updates or creates balance record for address.
     * @param address Address
     * @param asset Asset
     * @param affix Amount to add (if positive) or subtract (if negative)
     */
    async upsert(address, asset, affix) {
        let entity = await this.select(BalanceEntity, this.tableName, address, asset.AssetId);
        if (entity) {
            entity.Balance += affix;
        }
        else {
            entity = new BalanceEntity();
            entity.PartitionKey = address;
            entity.RowKey = asset.AssetId;
            entity.Balance = affix;
        }
        await this.insertOrMerge(this.tableName, entity);
        return entity.Balance;
    }
    async get(idOrTake, continuation) {
        if (util_1.isString(idOrTake)) {
            return await this.select(BalanceEntity, this.tableName, idOrTake, "");
        }
        else {
            return await this.select(BalanceEntity, this.tableName, new azure_storage_1.TableQuery().top(idOrTake || 100), continuation);
        }
    }
    async all() {
        return await this.selectAll(c => this.get(100, c));
    }
};
BalanceRepository = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [common_1.Settings])
], BalanceRepository);
exports.BalanceRepository = BalanceRepository;
//# sourceMappingURL=balances.js.map