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
const addresses_1 = require("../domain/addresses");
let BalancesController = class BalancesController {
    constructor(addressRepository) {
        this.addressRepository = addressRepository;
    }
    async balances(take = 100, continuation) {
        const items = [];
        do {
            const addressQuery = await this.addressRepository.get(take, continuation);
            for (let i = 0; i < addressQuery.items.length; i++) {
                // TODO: get balance
                items.push({
                    address: addressQuery.items[i],
                });
            }
            take -= addressQuery.items.length;
            continuation = addressQuery.continuation;
        } while (!!take && !!continuation);
        return {
            continuation,
            items
        };
    }
};
__decorate([
    routing_controllers_1.Get(),
    __param(0, routing_controllers_1.QueryParam("take")), __param(1, routing_controllers_1.QueryParam("continuation")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BalancesController.prototype, "balances", null);
BalancesController = __decorate([
    routing_controllers_1.JsonController("/balances"),
    __metadata("design:paramtypes", [addresses_1.AddressRepository])
], BalancesController);
exports.BalancesController = BalancesController;
//# sourceMappingURL=balancesController.js.map