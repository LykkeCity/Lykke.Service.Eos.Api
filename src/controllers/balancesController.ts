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

        const block = (await this.eosService.getLastIrreversibleBlockNumber()) * 10;
        let items: any[] = [];

        // CosmosDB doesn't suppport multiple $match-es in public preview version,
        // so we can't filter out zero balances on server.
        // Instead we have to set non-zero balances incrementally
        // to return exactly [take] number of items

        do {
            const result = await this.balanceRepository.get(take, continuation);

            continuation = result.continuation;

            for (const e of result.items) {
                if (e.AmountInBaseUnit > 0) {
                    items.push({
                        address: e._id.Address,
                        assetId: e._id.AssetId,
                        balance: e.AmountInBaseUnit.toFixed(),
                        block: Math.max(e.Block, block)
                    });
                    take--;
                }
            }

        } while (take > 0 && !!continuation)

        return {
            continuation,
            items
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