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
let AssetsController = class AssetsController {
    constructor(assetRepository) {
        this.assetRepository = assetRepository;
    }
    async list(take, continuation) {
        return await this.assetRepository.get(take, continuation);
    }
    async item(assetId) {
        return await this.assetRepository.get(assetId);
    }
};
__decorate([
    routing_controllers_1.Get(),
    __param(0, routing_controllers_1.QueryParam("take")), __param(1, routing_controllers_1.QueryParam("continuation")),
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