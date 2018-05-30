import { Service } from "typedi";
import { promisify } from "util";
import { Asset } from "../domain/assets";
import { OperationItem } from "../domain/operations";
import { Settings } from "../common";

// EOSJS has no typings, so use it as regular node module
const Eos = require("eosjs");

@Service()
export class EosService {

    private eos: any;

    constructor(private settings: Settings) {
        this.eos = Eos.Localnet({ httpEndpoint: settings.EosApi.Eos.HttpEndpoint });
    }

    async buildTransaction(operationId: string, items: OperationItem[]): Promise<any> {
        return {
            headers: await promisify(this.eos.createTransaction)(this.settings.EosApi.Eos.ExpireInSeconds),
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
}