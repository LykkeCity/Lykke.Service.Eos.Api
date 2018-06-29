import { JsonController, Get, Param, QueryParam, BadRequestError, Post, Delete, HttpCode, OnNull, OnUndefined, Res, Ctx } from "routing-controllers";
import { BalanceRepository, BalanceEntity } from "../domain/balances";
import { validateContinuation } from "../domain/queries";
import { AssetRepository, AssetEntity } from "../domain/assets";
import { EosService } from "../services/eosService";
import { ConflictError } from "../errors/conflictError";

@JsonController("/balances")
export class BalancesController {

    constructor(
        private assetRepository: AssetRepository,
        private balanceRepository: BalanceRepository,
        private eosService: EosService) {
    }

    @Get()
    async balances(
        @QueryParam("take", { required: true }) take: number,
        @QueryParam("continuation") continuation?: string) {

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
            items: query.items.map(e => ({
                address: e.Address,
                assetId: e.AssetId,
                balance: e.AmountInBaseUnit.toFixed(),
                block: block
            }))
        };
    }

    @Post("/:address/observation")
    @OnNull(200)
    @OnUndefined(200)
    async observe(@Param("address") address: string) {
        if (await this.balanceRepository.isObservable(address)) {
            throw new ConflictError("Address is already observed");
        } else {
            await this.balanceRepository.observe(address);
        }
    }

    @Delete("/:address/observation")
    @OnNull(204)
    @OnUndefined(200)
    async deleteObservation(@Param("address") address: string): Promise<any> {
        if (await this.balanceRepository.isObservable(address)) {
            await this.balanceRepository.remove(address);
        } else {
            return null;
        }
    }
}