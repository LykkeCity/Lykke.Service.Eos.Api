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
const mongo_1 = require("./mongo");
const common_1 = require("../common");
const util_1 = require("util");
const typedi_1 = require("typedi");
class BalanceEntity extends mongo_1.MongoEntity {
}
exports.BalanceEntity = BalanceEntity;
let BalanceRepository = class BalanceRepository extends mongo_1.MongoRepository {
    constructor(settings) {
        super(settings.EosApi.Mongo.ConnectionString, settings.EosApi.Mongo.User, settings.EosApi.Mongo.Password, settings.EosApi.Mongo.Database);
        this.addressCollectionName = "EosBalanceAddresses";
        this.balanceCollectionName = "EosBalances";
    }
    async observe(address) {
        const db = await this.db();
        await db.collection(this.addressCollectionName)
            .replaceOne({ _id: address }, { _id: address }, { upsert: true });
        await db.collection(this.balanceCollectionName)
            .updateMany({ Address: { $eq: address } }, { $set: { IsObservable: true } });
    }
    async isObservable(address) {
        const db = await this.db();
        const entity = await db.collection(this.addressCollectionName).findOne({ _id: address });
        return !!entity;
    }
    async remove(address) {
        const db = await this.db();
        await db.collection(this.addressCollectionName).deleteOne({ _id: address });
        await db.collection(this.balanceCollectionName)
            .updateMany({ Address: { $eq: address } }, { $set: { IsObservable: false } });
    }
    async upsert(address, assetId, operationOrTxId, amount, amountInBaseUnit) {
        const db = await this.db();
        const id = `${address}_${assetId}_${operationOrTxId}`;
        const isObservable = await this.isObservable(address);
        await db.collection(this.balanceCollectionName)
            .updateOne({ _id: id }, { $set: { _id: id, Address: address, AssetId: assetId, OperationOrTxId: operationOrTxId, Amount: amount, AmountInBaseUnit: amountInBaseUnit, IsObservable: isObservable } }, { upsert: true });
    }
    async update(address, assetId, operationOrTxId, params) {
        const db = await this.db();
        const id = `${address}_${assetId}_${operationOrTxId}`;
        await db.collection(this.balanceCollectionName)
            .updateOne({ _id: id }, { $set: { IsCancelled: params.isCancelled } }, { upsert: true });
    }
    async get(addressOrTake, assetIdOrcontinuation) {
        const db = await this.db();
        if (util_1.isString(addressOrTake)) {
            return await db.collection(this.balanceCollectionName)
                .aggregate([
                { $match: { Address: addressOrTake, AssetId: assetIdOrcontinuation, IsCancelled: { $ne: true } } },
                { $group: { _id: { Address: "$Address", AssetId: "$Assetid" }, Amount: { $sum: "$Amount" }, AmountInBaseUnit: { $sum: "$AmountInBaseUnit" } } },
            ])
                .next();
        }
        else {
            const skip = parseInt(assetIdOrcontinuation) || 0;
            const entities = await db.collection(this.balanceCollectionName)
                .aggregate([
                { $match: { IsCancelled: { $ne: true }, IsObservable: { $eq: true } } },
                { $group: { _id: { Address: "$Address", AssetId: "$Assetid" }, Amount: { $sum: "$Amount" }, AmountInBaseUnit: { $sum: "$AmountInBaseUnit" } } },
                { $skip: skip },
                { $limit: addressOrTake }
            ])
                .toArray();
            return new mongo_1.MongoQueryResult(entities, entities.length < addressOrTake ? null : (skip + addressOrTake).toFixed());
        }
    }
};
BalanceRepository = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [common_1.Settings])
], BalanceRepository);
exports.BalanceRepository = BalanceRepository;
//# sourceMappingURL=balances.js.map