import "reflect-metadata";
import { Service } from "typedi";
import { createTableService } from "azure-storage";
import * as util from "util";

// EOSJS has no typings, so use it as regular node module
const Eos = require("eosjs");

@Service()
export class EosService {

    private eos: any;

    constructor() {
        this.eos = Eos.Localnet();
    }

    async buildTransaction(from: string, to: string, amount: number) {
    }
}