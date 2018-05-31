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