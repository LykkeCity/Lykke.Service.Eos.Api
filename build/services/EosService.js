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
    isFake(item) {
        return item.from.indexOf(common_1.ADDRESS_SEPARATOR) >= 0 || item.to.indexOf(common_1.ADDRESS_SEPARATOR) >= 0;
    }
    async getLastIrreversibleBlockNumber() {
        return (await this.eos.getInfo({})).last_irreversible_block_num;
    }
    /**
     * Main:
     *
     * 0. We require local node because of history_api_plugin (see https://github.com/EOSIO/eos/blob/master/EXCHANGE_README.md).
     * 1. Install node (DAWN 4.2 or RTM if exist).
     * 2. Init local testnet with token contracts OR connect to any public testnet (f.e. dev.cryptolions.io/).
     * 3. Run node with history_api_plugin and --filter_on_accounts hotwallet.
     * 4. Periodically pull actions of hotwallet and increase balances of users (maybe it makes sense to store balance as sequence of changes with block number).
     * 5. Build transactions including real transfers only, but saving all actions in DB by operationId.
     * 6. On broadcast get actions from DB by operationId and decrease balances.
     * 7. Keep only user balances (hotwallet$user-id), not hotwallet?
     *
     * History:
     *
     * 1. Just save all actions of hotwallet while pulling them from node and updating balance.
     * 2. Check expired transactions similarily to Zcash.
     * 3. Increase balance if transaction broadcasted but not included in block, expired and marked as failed later.
     */
    async buildTransaction(operationId, items) {
        // TODO: save operations
        const info = await this.eos.getInfo({});
        return {
            chainId: info.chain_id,
            headers: await util_1.promisify(this.eos.createTransaction)(this.settings.EosApi.Eos.ExpireInSeconds),
            actions: items
                .filter(item => !this.isFake(item))
                .map(item => {
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
    async broadcastTransaction(operationId, tx) {
        // TODO: update balances
        if (!!tx) {
            await util_1.promisify(this.eos.pushTransaction)(tx);
        }
    }
};
EosService = __decorate([
    typedi_1.Service(),
    __metadata("design:paramtypes", [common_1.Settings])
], EosService);
exports.EosService = EosService;
//# sourceMappingURL=eosService.js.map