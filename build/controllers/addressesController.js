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
const notImplementedError_1 = require("../errors/notImplementedError");
const common_1 = require("../common");
let AddressesController = class AddressesController {
    explorerUrl(address) {
        throw new notImplementedError_1.NotImplementedError();
    }
    isValid(address) {
        return {
            isValid: !!address && /^[.12345a-z]{1,12}$/.test(address.split(common_1.ADDRESS_SEPARATOR)[0])
        };
    }
};
__decorate([
    routing_controllers_1.Get("/:address/explorer-url"),
    __param(0, routing_controllers_1.Param("address")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AddressesController.prototype, "explorerUrl", null);
__decorate([
    routing_controllers_1.Get("/:address/validity"),
    __param(0, routing_controllers_1.Param("address")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AddressesController.prototype, "isValid", null);
AddressesController = __decorate([
    routing_controllers_1.JsonController("/addresses")
], AddressesController);
exports.AddressesController = AddressesController;
//# sourceMappingURL=addressesController.js.map