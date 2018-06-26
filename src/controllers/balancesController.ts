import { JsonController, Get, Param, QueryParam, BadRequestError, Post, Delete, HttpCode, OnNull, OnUndefined, Res, Ctx } from "routing-controllers";
import { BalanceRepository, BalanceEntity } from "../domain/balances";
import { validateContinuation } from "../domain/queries";
import { AssetRepository, AssetEntity } from "../domain/assets";
import { EosService } from "../services/eosService";

export class BalanceModel {

    constructor(balance: BalanceEntity, asset: AssetEntity, block: number) {
        this.address = balance.Address;
        this.assetId = balance.AssetId;
        this.balance = (balance.Balance * (Math.pow(10, asset.Accuracy))).toFixed(0);
        this.block = block;
    }

    address: string;
    assetId: string;
    balance: string;
    block: number;
}

@JsonController("/balances")
export class BalancesController {

    constructor(private assetRepository: AssetRepository, private balanceRepository: BalanceRepository, private eos: EosService) {
    }

    @Get()
    async balances(@QueryParam("take", { required: true }) take: number, @QueryParam("continuation") continuation?: string) {
        if (take <= 0) {
            throw new BadRequestError(`Query parameter "take" is required`);
        }

        if (!!continuation && !validateContinuation(continuation)) {
            throw new BadRequestError(`Query parameter "continuation" is invalid`);
        }

        const blockNumber = await this.eos.getLastIrreversibleBlockNumber();
        const result = await this.balanceRepository.get(take, continuation);
        const assets = await this.assetRepository.all();

        return {
            items: result.items.filter(e => e.Balance > 0).map(e => new BalanceModel(e, assets.find(a => a.AssetId == e.AssetId), blockNumber)),
            continuation: result.continuation
        };
    }

    @Post("/:address/observation")
    @HttpCode(200)
    @OnNull(200)
    @OnUndefined(200)
    async observe(@Param("address") address: string) {
    }

    @Delete("/:address/observation")
    @HttpCode(200)
    @OnNull(200)
    @OnUndefined(200)
    async deleteObservation(@Param("address") address: string) {
    }
}