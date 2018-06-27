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
const util_1 = require("util");
const typedi_1 = require("typedi");
class AssetEntity extends queries_1.AzureEntity {
    /**
     * Token symbol
     */
    get AssetId() {
        return this.PartitionKey;
    }
    convert(decimalNumberOrIntegerString) {
        if (util_1.isNumber(decimalNumberOrIntegerString)) {
            return decimalNumberOrIntegerString * Math.pow(10, this.Accuracy);
        }
        else {
            return parseInt(decimalNumberOrIntegerString) / Math.pow(10, this.Accuracy);
        }
    }
}
__decorate([
    queries_1.Ignore(),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], AssetEntity.prototype, "AssetId", null);
__decorate([
    queries_1.Int32(),
    __metadata("design:type", Number)
], AssetEntity.prototype, "Accuracy", void 0);
exports.AssetEntity = AssetEntity;
let AssetRepository = class AssetRepository extends queries_1.AzureRepository {
    constructor(settings) {
        super(settings.EosApi.DataConnectionString);
        this.settings = settings;
        this.tableName = "EosAssets";
    }
    async get(idOrTake, continuation) {
        if (util_1.isString(idOrTake)) {
            return await this.select(AssetEntity, this.tableName, idOrTake, "");
        }
        else {
            return await this.select(AssetEntity, this.tableName, new azure_storage_1.TableQuery().top(idOrTake || 100), continuation);
        }
    }
    async all() {
        return await this.selectAll(c => this.get(100, c));
    }
};
AssetRepository = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [common_1.Settings])
], AssetRepository);
exports.AssetRepository = AssetRepository;
//# sourceMappingURL=assets.js.map