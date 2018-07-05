import { JsonController, Get, Param, QueryParam, BadRequestError } from "routing-controllers";
import { AssetRepository } from "../domain/assets";
import { BlockchainError } from "../errors/blockchainError";


@JsonController("/assets")
export class AssetsController {

    constructor(private assetRepository: AssetRepository) {
    }

    @Get()
    async list(
        @QueryParam("take", { required: true }) take: number,
        @QueryParam("continuation") continuation: string) {

        if (Number.isNaN(take) || !Number.isInteger(take) || take <= 0) {
            throw new BlockchainError({ status: 400, message: "Query parameter [take] is invalid" });
        }

        if (!!continuation && !this.assetRepository.validateContinuation(continuation)) {
            throw new BlockchainError({ status: 400, message: "Query parameter [continuation] is invalid" });
        }

        const query = await this.assetRepository.get(take, continuation);

        return {
            continuation: query.continuation,
            items: query.items.map(e => ({
                assetId: e.AssetId,
                address: e.Address,
                name: e.Name,
                accuracy: e.Accuracy
            }))
        };
    }

    @Get("/:assetId")
    async item(@Param("assetId") assetId: string) {
        const asset = await this.assetRepository.get(assetId);
        if (!!asset) {
            return {
                assetId: asset.AssetId,
                address: asset.Address,
                name: asset.Name,
                accuracy: asset.Accuracy
            }
        } else {
            return null;
        }
    }
}