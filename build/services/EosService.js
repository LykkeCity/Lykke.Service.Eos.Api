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
        this.eos = Eos({ httpEndpoint: settings.EosApi.Eos.HttpEndpoint });
    }
    async getChainId() {
        return (await this.eos.getInfo({})).chain_id;
    }
    async getLastIrreversibleBlockNumber() {
        return (await this.eos.getInfo({})).last_irreversible_block_num;
    }
    async getTransactionHeaders() {
        return (await util_1.promisify(this.eos.createTransaction)(this.settings.EosApi.Eos.ExpireInSeconds));
    }
    async getBalance(account, tokenContractAccount, symbol) {
        const data = await this.eos.getCurrencyBalance({ code: tokenContractAccount, account, symbol });
        return (data[0] && parseFloat(data[0].split(" ")[0])) || 0;
    }
    async pushTransaction(tx) {
        return (await this.eos.pushTransaction(tx)).transaction_id;
    }
    validate(address) {
        return !!address && /^[.12345a-z]{1,12}$/.test(address.split(common_1.ADDRESS_SEPARATOR)[0]);
    }
};
EosService = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [common_1.Settings])
], EosService);
exports.EosService = EosService;
//# sourceMappingURL=eosService.js.map