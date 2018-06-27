import { JsonController, Get, Param, QueryParam, BadRequestError, Post, Delete, HttpCode, OnNull, OnUndefined, Res, Ctx } from "routing-controllers";
import { BalanceRepository, BalanceEntity } from "../domain/balances";
import { validateContinuation } from "../domain/queries";
import { AssetRepository, AssetEntity } from "../domain/assets";
import { EosService } from "../services/eosService";

@JsonController("/balances")
export class BalancesController {

    constructor(
        private assetRepository: AssetRepository,
        private balanceRepository: BalanceRepository,
        private eosService: EosService) {
    }

    @Get()
    async balances(@QueryParam("take", { required: true }) take: number, @QueryParam("continuation") continuation?: string) {
        if (take <= 0) {
            throw new BadRequestError(`Query parameter "take" is required`);
        }

        if (!!continuation && !validateContinuation(continuation)) {
            throw new BadRequestError(`Query parameter "continuation" is invalid`);
        }

        const block = await this.eosService.getLastIrreversibleBlockNumber();
        const query = await this.balanceRepository.get(take, continuation);

        return {
            continuation: query.continuation,
            items: query.items
                .filter(e => e.Amount > 0)
                .map(e => ({
                    address: e.Address,
                    assetId: e.AssetId,
                    balance: e.AmountInBaseUnit.toFixed(),
                    block: block
                }))
        };
    }

    @Post("/:address/observation")
    @HttpCode(200)
    @OnNull(200)
    @OnUndefined(200)
    async observe(@Param("address") address: string) {
        // always OK due to controlling observation by node's configuration
    }

    @Delete("/:address/observation")
    @HttpCode(200)
    @OnNull(200)
    @OnUndefined(200)
    async deleteObservation(@Param("address") address: string) {
        // always OK due to controlling observation by node's configuration
    }
}