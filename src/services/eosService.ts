import { Service } from "typedi";
import { promisify } from "util";
import { Settings, ADDRESS_SEPARATOR } from "../common";

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

    async pushTransaction(tx: any): Promise<string> {
        return (await this.eos.pushTransaction(tx)).transaction_id;
    }

    validate(address: string): boolean {
        return !!address && /^[.12345a-z]{1,12}$/.test(address.split(ADDRESS_SEPARATOR)[0])
    }
}