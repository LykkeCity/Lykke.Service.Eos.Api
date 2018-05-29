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
const typedi_1 = require("typedi");
const azure_storage_1 = require("azure-storage");
const common_1 = require("../common");
const queries_1 = require("./queries");
const util_1 = require("util");
let AssetRepository = class AssetRepository {
    constructor(settings) {
        this.settings = settings;
        this.tableName = "EosAssets";
        this.table = azure_storage_1.createTableService(settings.EosSignService.DataConnectionString);
    }
    map(entity) {
        if (!entity) {
            return null;
        }
        else {
            return {
                assetId: entity.PartitionKey._,
                address: entity.Address._,
                name: entity.Name._,
                accuracy: entity.Accuracy._
            };
        }
    }
    async get(idOrTake, continuation) {
        if (util_1.isString(idOrTake)) {
            return this.map(await queries_1.select(this.table, this.tableName, idOrTake, ""));
        }
        else {
            return new queries_1.QueryResult(await queries_1.select(this.table, this.tableName, new azure_storage_1.TableQuery().top(idOrTake || 100), queries_1.toAzure(continuation)), this.map).items;
        }
    }
};
AssetRepository = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [common_1.Settings])
], AssetRepository);
exports.AssetRepository = AssetRepository;
//# sourceMappingURL=assets.js.map