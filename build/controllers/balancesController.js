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
const assets_1 = require("../domain/assets");
const eosService_1 = require("../services/eosService");
const conflictError_1 = require("../errors/conflictError");
const blockchainError_1 = require("../errors/blockchainError");
let BalancesController = class BalancesController {
    constructor(assetRepository, balanceRepository, eosService) {
        this.assetRepository = assetRepository;
        this.balanceRepository = balanceRepository;
        this.eosService = eosService;
    }
    async balances(take, continuation) {
        if (take <= 0) {
            throw new blockchainError_1.BlockchainError({ status: 400, message: "Query parameter [take] is required" });
        }
        if (!!continuation && !this.balanceRepository.validateContinuation(continuation)) {
            throw new blockchainError_1.BlockchainError({ status: 400, message: "Query parameter [continuation] is invalid" });
        }
        const block = await this.eosService.getLastIrreversibleBlockNumber();
        const query = await this.balanceRepository.get(take, continuation);
        return {
            continuation: query.continuation,
            items: query.items.map(e => ({
                address: e._id.Address,
                assetId: e._id.AssetId,
                balance: e.AmountInBaseUnit.toFixed(),
                block: block
            }))
        };
    }
    async balanceOf(address, assetId) {
        if (!this.eosService.validate(address)) {
            throw new blockchainError_1.BlockchainError({ status: 400, message: `Invalid address [${address}]` });
        }
        const asset = await this.assetRepository.get(assetId);
        if (asset == null) {
            throw new blockchainError_1.BlockchainError({ status: 400, message: `Unknown assetId [${assetId}]` });
        }
        const block = await this.eosService.getLastIrreversibleBlockNumber();
        const value = await this.balanceRepository.get(address, assetId);
        if (!!value) {
            return {
                address: address,
                assetId: assetId,
                balance: value.AmountInBaseUnit.toFixed(),
                block: block
            };
        }
        else {
            return null;
        }
    }
    async observe(address) {
        if (await this.balanceRepository.isObservable(address)) {
            throw new conflictError_1.ConflictError(`Address [${address}] is already observed`);
        }
        else {
            await this.balanceRepository.observe(address);
        }
    }
    async deleteObservation(address) {
        if (await this.balanceRepository.isObservable(address)) {
            await this.balanceRepository.remove(address);
        }
        else {
            return null;
        }
    }
};
__decorate([
    routing_controllers_1.Get(),
    __param(0, routing_controllers_1.QueryParam("take", { required: true })),
    __param(1, routing_controllers_1.QueryParam("continuation")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], BalancesController.prototype, "balances", null);
__decorate([
    routing_controllers_1.Get("/:address/:assetId"),
    __param(0, routing_controllers_1.Param("address")),
    __param(1, routing_controllers_1.Param("assetId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BalancesController.prototype, "balanceOf", null);
__decorate([
    routing_controllers_1.Post("/:address/observation"),
    routing_controllers_1.OnNull(200),
    routing_controllers_1.OnUndefined(200),
    __param(0, routing_controllers_1.Param("address")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BalancesController.prototype, "observe", null);
__decorate([
    routing_controllers_1.Delete("/:address/observation"),
    routing_controllers_1.OnNull(204),
    routing_controllers_1.OnUndefined(200),
    __param(0, routing_controllers_1.Param("address")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BalancesController.prototype, "deleteObservation", null);
BalancesController = __decorate([
    routing_controllers_1.JsonController("/balances"),
    __metadata("design:paramtypes", [assets_1.AssetRepository,
        balances_1.BalanceRepository,
        eosService_1.EosService])
], BalancesController);
exports.BalancesController = BalancesController;
//# sourceMappingURL=balancesController.js.map