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
const util_1 = require("util");
const common_1 = require("../common");
// EOSJS has no typings, so use it as regular node module
const Eos = require("eosjs");
let EosService = class EosService {
    constructor(settings) {
        this.settings = settings;
        this.eos = Eos.Localnet({ httpEndpoint: settings.EosApi.Eos.HttpEndpoint });
    }
    async buildTransaction(operationId, items) {
        return {
            headers: await util_1.promisify(this.eos.createTransaction)(this.settings.EosApi.Eos.ExpireInSeconds),
            actions: items.map(item => {
                return {
                    account: item.asset.address,
                    name: "transfer",
                    authorization: [{
                            actor: item.from,
                            permission: "active"
                        }],
                    data: {
                        from: item.from,
                        to: item.to,
                        quantity: `${item.amount} ${item.asset.name}`,
                        memo: ""
                    }
                };
            })
        };
    }
};
EosService = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [common_1.Settings])
], EosService);
exports.EosService = EosService;
//# sourceMappingURL=eosService.js.map