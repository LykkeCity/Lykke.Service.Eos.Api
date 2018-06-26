import { JsonController, Get, Param, QueryParam, BadRequestError } from "routing-controllers";
import { AssetEntity, AssetRepository } from "../domain/assets";
import { IsNotEmpty } from "class-validator";
import { validateContinuation } from "../domain/queries";

export class AssetModel {

    constructor(asset: AssetEntity) {
        this.assetId = asset.AssetId;
        this.address = asset.Address;
        this.name = asset.Name;
        this.accuracy = asset.Accuracy;
    }

    assetId: string;
    address: string;
    name: string;
    accuracy: number;
}

@JsonController("/assets")
export class AssetsController {

    constructor(private assetRepository: AssetRepository) {
    }

    @Get()
    async list(@QueryParam("take", { required: true }) take: number, @QueryParam("continuation") continuation: string) {
        if (take <= 0) {
            throw new BadRequestError(`Query parameter "take" is required`);
        }

        if (!!continuation && !validateContinuation(continuation)) {
            throw new BadRequestError(`Query parameter "continuation" is invalid`);
        }

        const query = await this.assetRepository.get(take, continuation);

        return {
            items: query.items.map(e => new AssetModel(e)),
            continuation: query.continuation
        };
    }

    @Get("/:assetId")
    async item(@Param("assetId") assetId: string) {
        const asset = await this.assetRepository.get(assetId);
        return new AssetModel(asset);
    }
}