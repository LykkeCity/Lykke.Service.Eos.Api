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
const assets_1 = require("../domain/assets");
const queries_1 = require("../domain/queries");
class AssetModel {
    constructor(asset) {
        this.assetId = asset.AssetId;
        this.address = asset.Address;
        this.name = asset.Name;
        this.accuracy = asset.Accuracy;
    }
}
exports.AssetModel = AssetModel;
let AssetsController = class AssetsController {
    constructor(assetRepository) {
        this.assetRepository = assetRepository;
    }
    async list(take, continuation) {
        if (take <= 0) {
            throw new routing_controllers_1.BadRequestError(`Query parameter "take" is required`);
        }
        if (!!continuation && !queries_1.validateContinuation(continuation)) {
            throw new routing_controllers_1.BadRequestError(`Query parameter "continuation" is invalid`);
        }
        const query = await this.assetRepository.get(take, continuation);
        return {
            items: query.items.map(e => new AssetModel(e)),
            continuation: query.continuation
        };
    }
    async item(assetId) {
        const asset = await this.assetRepository.get(assetId);
        return new AssetModel(asset);
    }
};
__decorate([
    routing_controllers_1.Get(),
    __param(0, routing_controllers_1.QueryParam("take", { required: true })), __param(1, routing_controllers_1.QueryParam("continuation")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "list", null);
__decorate([
    routing_controllers_1.Get("/:assetId"),
    __param(0, routing_controllers_1.Param("assetId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AssetsController.prototype, "item", null);
AssetsController = __decorate([
    routing_controllers_1.JsonController("/assets"),
    __metadata("design:paramtypes", [assets_1.AssetRepository])
], AssetsController);
exports.AssetsController = AssetsController;
//# sourceMappingURL=assetsController.js.map