import { JsonController, Get, Param, QueryParam, BadRequestError, Post, Delete, HttpCode, OnNull, OnUndefined, Res, Ctx } from "routing-controllers";
import { BalanceRepository, BalanceEntity } from "../domain/balances";
import { AssetRepository } from "../domain/assets";
import { EosService } from "../services/eosService";
import { ConflictError } from "../errors/conflictError";
import { BlockchainError } from "../errors/blockchainError";

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

        if (Number.isNaN(take) || !Number.isInteger(take) || take <= 0) {
            throw new BlockchainError({ status: 400, message: "Query parameter [take] is invalid, must be positive integer" });
        }

        if (!!continuation && !this.balanceRepository.validateContinuation(continuation)) {
            throw new BlockchainError({ status: 400, message: "Query parameter [continuation] is invalid" });
        }

        const block = await this.eosService.getLastIrreversibleBlockNumber();
        const query = await this.balanceRepository.get(take, continuation);

        return {
            continuation: query.continuation,
            items: query.items.map(e => ({
                address: e._id.Address,
                assetId: e._id.AssetId,
                balance: e.AmountInBaseUnit.toFixed(),
                block: block
            }))
        };
    }

    @Get("/:address/:assetId")
    async balanceOf(
        @Param("address") address: string,
        @Param("assetId") assetId: string) {

        if (!this.eosService.validate(address)) {
            throw new BlockchainError({ status: 400, message: `Invalid address [${address}]` });
        }

        const asset = await this.assetRepository.get(assetId);
        if (asset == null) {
            throw new BlockchainError({ status: 400, message: `Unknown assetId [${assetId}]` });
        }

        const block = await this.eosService.getLastIrreversibleBlockNumber();
        const value = await this.balanceRepository.get(address, assetId);

        if (!!value) {
            return {
                address: address,
                assetId: assetId,
                balance: value.AmountInBaseUnit.toFixed(),
                block: block
            };
        } else {
            return null;
        }
    }

    @Post("/:address/observation")
    @OnNull(200)
    @OnUndefined(200)
    async observe(@Param("address") address: string) {
        if (!this.eosService.validate(address)) {
            throw new BlockchainError({ status: 400, message: `Invalid address [${address}]` });
        }

        if (await this.balanceRepository.isObservable(address)) {
            throw new ConflictError(`Address [${address}] is already observed`);
        } else {
            await this.balanceRepository.observe(address);
        }
    }

    @Delete("/:address/observation")
    @OnNull(204)
    @OnUndefined(200)
    async deleteObservation(@Param("address") address: string): Promise<any> {
        if (!this.eosService.validate(address)) {
            throw new BlockchainError({ status: 400, message: `Invalid address [${address}]` });
        }

        if (await this.balanceRepository.isObservable(address)) {
            await this.balanceRepository.remove(address);
        } else {
            return null;
        }
    }
}