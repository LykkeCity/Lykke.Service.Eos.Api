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
let AddressRepository = class AddressRepository {
    constructor(settings) {
        this.settings = settings;
        this.balanceTableName = "EosBalanceAddresses";
        this.historyTableName = "EosHostoryAddresses";
        this.table = azure_storage_1.createTableService(settings.EosSignService.DataConnectionString);
    }
    async get(take = 100, continuation) {
        return new queries_1.QueryResult(await queries_1.select(this.table, this.balanceTableName, new azure_storage_1.TableQuery().top(take), queries_1.toAzure(continuation)), e => e.PartitionKey._);
    }
};
AddressRepository = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [common_1.Settings])
], AddressRepository);
exports.AddressRepository = AddressRepository;
//# sourceMappingURL=addresses.js.map