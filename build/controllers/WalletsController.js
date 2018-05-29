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
const routing_controllers_1 = require("routing-controllers");
const EosService_1 = require("../services/EosService");
let WalletsController = class WalletsController {
    constructor(eosService) {
        this.eosService = eosService;
    }
    async createWallet() {
        return await this.eosService.createWallet();
    }
};
__decorate([
    routing_controllers_1.Post(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WalletsController.prototype, "createWallet", null);
WalletsController = __decorate([
    routing_controllers_1.JsonController("/wallets"),
    __metadata("design:paramtypes", [EosService_1.EosService])
], WalletsController);
exports.WalletsController = WalletsController;
//# sourceMappingURL=WalletsController.js.map