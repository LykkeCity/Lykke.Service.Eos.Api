import { JsonController, Param, Body, Get, Post, Put, Delete } from "routing-controllers";
import { EosService } from "../services/EosService";

@JsonController("/transactions")
export class TransactionsController {

    constructor(private eosService: EosService) {
    }

    @Post("/single")
    async build() {
        return await this.eosService.buildTransaction("", "", 0);
    }
}