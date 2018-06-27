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
const balances_1 = require("../domain/balances");
const queries_1 = require("../domain/queries");
const assets_1 = require("../domain/assets");
const eosService_1 = require("../services/eosService");
class BalanceModel {
    constructor(balance, asset, block) {
        this.address = balance.Address;
        this.assetId = balance.AssetId;
        this.balance = (balance.Balance * (Math.pow(10, asset.Accuracy))).toFixed(0);
        this.block = block;
    }
}
exports.BalanceModel = BalanceModel;
let BalancesController = class BalancesController {
    constructor(assetRepository, balanceRepository, eos) {
        this.assetRepository = assetRepository;
        this.balanceRepository = balanceRepository;
        this.eos = eos;
    }
    async balances(take, continuation) {
        if (take <= 0) {
            throw new routing_controllers_1.BadRequestError(`Query parameter "take" is required`);
        }
        if (!!continuation && !queries_1.validateContinuation(continuation)) {
            throw new routing_controllers_1.BadRequestError(`Query parameter "continuation" is invalid`);
        }
        const blockNumber = await this.eos.getLastIrreversibleBlockNumber();
        const result = await this.balanceRepository.get(take, continuation);
        const assets = await this.assetRepository.all();
        return {
            items: result.items.filter(e => e.Balance > 0).map(e => new BalanceModel(e, assets.find(a => a.AssetId == e.AssetId), blockNumber)),
            continuation: result.continuation
        };
    }
    async observe(address) {
        // always OK due to controlling observation by node's configuration
    }
    async deleteObservation(address) {
        // always OK due to controlling observation by node's configuration
    }
};
__decorate([
    routing_controllers_1.Get(),
    __param(0, routing_controllers_1.QueryParam("take", { required: true })), __param(1, routing_controllers_1.QueryParam("continuation")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], BalancesController.prototype, "balances", null);
__decorate([
    routing_controllers_1.Post("/:address/observation"),
    routing_controllers_1.HttpCode(200),
    routing_controllers_1.OnNull(200),
    routing_controllers_1.OnUndefined(200),
    __param(0, routing_controllers_1.Param("address")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BalancesController.prototype, "observe", null);
__decorate([
    routing_controllers_1.Delete("/:address/observation"),
    routing_controllers_1.HttpCode(200),
    routing_controllers_1.OnNull(200),
    routing_controllers_1.OnUndefined(200),
    __param(0, routing_controllers_1.Param("address")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BalancesController.prototype, "deleteObservation", null);
BalancesController = __decorate([
    routing_controllers_1.JsonController("/balances"),
    __metadata("design:paramtypes", [assets_1.AssetRepository, balances_1.BalanceRepository, eosService_1.EosService])
], BalancesController);
exports.BalancesController = BalancesController;
//# sourceMappingURL=balancesController.js.map