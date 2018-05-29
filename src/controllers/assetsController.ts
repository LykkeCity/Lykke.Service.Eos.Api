import { JsonController, Get, Param, QueryParam } from "routing-controllers";
import { Asset, AssetRepository } from "../domain/assets";

@JsonController("/assets")
export class AssetsController {

    constructor(private assetRepository: AssetRepository) {
    }

    @Get()
    async list(@QueryParam("take") take: number, @QueryParam("continuation") continuation: string) {
        return await this.assetRepository.get(take, continuation);
    }

    @Get("/:assetId")
    async item(@Param("assetId") assetId: string) {
        return await this.assetRepository.get(assetId);
    }
}