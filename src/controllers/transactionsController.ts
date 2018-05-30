import { JsonController, Param, Body, Get, Post, Put, Delete } from "routing-controllers";
import { IsArray, IsString, IsNotEmpty } from "class-validator";
import { EosService } from "../services/eosService";
import { AssetRepository } from "../domain/assets";
import { OperationItem } from "../domain/operations";
import { toBase64 } from "../common";

export class BuildSingleRequest {
    @IsString()
    @IsNotEmpty()
    operationId: string;

    @IsString()
    @IsNotEmpty()
    fromAddress: string;

    fromAddressContext?: string;

    @IsString()
    @IsNotEmpty()
    toAddress: string;

    @IsString()
    @IsNotEmpty()
    assetId: string;

    @IsString()
    @IsNotEmpty()
    amount: string;

    includeFee?: boolean;
}

class BuildResponse {
    constructor(public transactionContext: string) {
    }
}

@JsonController("/transactions")
export class TransactionsController {

    constructor(private eosService: EosService, private assetRepository: AssetRepository) {
    }

    @Post("/single")
    async buildSingle(@Body({ required: true }) request: BuildSingleRequest): Promise<BuildResponse> {
        const asset = await this.assetRepository.get(request.assetId);
        const txctx = await this.eosService.buildTransaction(
            request.operationId,
            [{
                from: request.fromAddress,
                to: request.toAddress,
                asset: asset,
                amount: parseInt(request.amount) / Math.pow(10, asset.accuracy)
            }]);

        return new BuildResponse(toBase64(txctx));
    }
}