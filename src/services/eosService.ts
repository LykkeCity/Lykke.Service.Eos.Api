import { Service } from "typedi";
import { promisify } from "util";
import { Asset } from "../domain/assets";
import { OperationItem } from "../domain/operations";
import { Settings, ADDRESS_SEPARATOR } from "../common";

// EOSJS has no typings, so use it as regular node module
const Eos = require("eosjs");

@Service()
export class EosService {

    private eos: any;

    private isFake(item: OperationItem): boolean {
        return item.from.indexOf(ADDRESS_SEPARATOR) >= 0 || item.to.indexOf(ADDRESS_SEPARATOR) >= 0;
    }

    constructor(private settings: Settings) {
        this.eos = Eos.Localnet({ httpEndpoint: settings.EosApi.Eos.HttpEndpoint });
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

    async buildTransaction(operationId: string, items: OperationItem[]): Promise<any> {

        // TODO: save operations

        const info = await this.eos.getInfo({});
        return {
            chainId: info.chain_id,
            headers: await promisify(this.eos.createTransaction)(this.settings.EosApi.Eos.ExpireInSeconds),
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

    async broadcastTransaction(operationId: string, tx: any) {

        // TODO: update balances

        if (!!tx) {
            await promisify(this.eos.pushTransaction)(tx);
        }
    }
}