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
require("reflect-metadata");
const typedi_1 = require("typedi");
const azure_storage_1 = require("azure-storage");
const common_1 = require("../common");
let AssetService = class AssetService {
    constructor(settings) {
        this.settings = settings;
        this.tableName = "EosAssets";
        this.table = azure_storage_1.createTableService(settings.EosSignService.DataConnectionString);
    }
    ensureTable() {
        return new Promise((res, rej) => {
            this.table.createTableIfNotExists(this.tableName, (err, result) => {
                if (err) {
                    rej(err);
                }
                else {
                    res(this.table);
                }
            });
        });
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
    async get(id) {
        return this.ensureTable()
            .then(table => new Promise((res, rej) => table.retrieveEntity(this.tableName, id, "", (err, result, response) => {
            if (err && response.statusCode != 404) {
                rej(err);
            }
            else {
                res(this.map(result));
            }
        })));
    }
    async getAll(take = 100, continuation) {
        const query = new azure_storage_1.TableQuery()
            .top(take);
        const continuationToken = !!continuation
            ? JSON.parse(common_1.fromBase64(continuation))
            : null;
        return this.ensureTable()
            .then(table => new Promise((res, rej) => table.queryEntities(this.tableName, query, continuationToken, (err, result, response) => {
            if (err) {
                rej(err);
            }
            else {
                res(result.entries.map(e => this.map(e)));
            }
        })));
    }
};
AssetService = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [common_1.Settings])
], AssetService);
exports.AssetService = AssetService;
//# sourceMappingURL=assetService.js.map