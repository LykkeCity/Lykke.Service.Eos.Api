import { Service } from "typedi";
import { promisify } from "util";
import { Settings } from "../common";

// EOSJS has no typings, so use it as regular node module
const Eos = require("eosjs");

@Service()
export class EosService {

    private eos: any;

    constructor(private settings: Settings) {
        this.eos = Eos({ httpEndpoint: settings.EosApi.Eos.HttpEndpoint });
    }

    async getChainId(): Promise<string> {
        return (await this.eos.getInfo({})).chain_id;
    }

    async getLastIrreversibleBlockNumber(): Promise<number> {
        return (await this.eos.getInfo({})).last_irreversible_block_num;
    }

    async getTransactionHeaders() {
        return (await promisify(this.eos.createTransaction)(this.settings.EosApi.Eos.ExpireInSeconds));
    }

    async getBalance(account: string, tokenContractAccount: string, symbol: string): Promise<number> {
        const data = await this.eos.getCurrencyBalance({ code: tokenContractAccount, account, symbol });
        return (data[0] && parseFloat(data[0].split(" ")[0])) || 0;
    }

    async pushTransaction(tx: any): Promise<string> {
        return (await this.eos.pushTransaction(tx)).transaction_id;
    }
}