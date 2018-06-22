import { JsonController, Param, Body, Get, Post, Put, Delete, BadRequestError } from "routing-controllers";
import { IsArray, IsString, IsNotEmpty, IsBase64, IsUUID } from "class-validator";
import { EosService } from "../services/eosService";
import { AssetRepository, Asset } from "../domain/assets";
import { OperationItem } from "../domain/operations";
import { toBase64, fromBase64 } from "../common";
import { NotImplementedError } from "../errors/notImplementedError";

class BuildSingleRequest {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
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

class Input {
    @IsString()
    @IsNotEmpty()
    fromAddress: string;

    fromAddressContext?: string;

    @IsString()
    @IsNotEmpty()
    amount: string;
}

class BuildManyInputsRequest {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    operationId: string;

    @IsArray()
    @IsNotEmpty()
    inputs: Input[];

    @IsString()
    @IsNotEmpty()
    toAddress: string;

    @IsString()
    @IsNotEmpty()
    assetId: string;
}

class Output {
    @IsString()
    @IsNotEmpty()
    toAddress: string;

    @IsString()
    @IsNotEmpty()
    amount: string;
}

class BuildManyOutputsRequest {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    operationId: string;

    @IsString()
    @IsNotEmpty()
    fromAddress: string;

    fromAddressContext?: string;

    @IsArray()
    @IsNotEmpty()
    outputs: Output[];

    @IsString()
    @IsNotEmpty()
    assetId: string;
}

class BroadcastRequest {
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    operationId: string;

    @IsString()
    @IsNotEmpty()
    @IsBase64()
    signedTransaction: string;
}

class BuildResponse {
    constructor(public transactionContext: string) {
    }
}

@JsonController("/transactions")
export class TransactionsController {

    constructor(private eosService: EosService, private assetRepository: AssetRepository) {
    }

    private async ensureAsset(assetId: string): Promise<Asset> {
        const asset = await this.assetRepository.get(assetId);
        if (!!asset) {
            return asset;
        }
        throw new BadRequestError(`Unknown asset: ${assetId}`)
    }

    @Post("/single")
    async buildSingle(@Body({ required: true }) request: BuildSingleRequest): Promise<BuildResponse> {
        const asset = await this.ensureAsset(request.assetId);
        const items = Array.of(new OperationItem(request.fromAddress, request.toAddress, asset, request.amount));
        const txctx = await this.eosService.buildTransaction(request.operationId, items);

        return new BuildResponse(toBase64(txctx));
    }

    @Post("/many-inputs")
    async buildManyInputs(@Body({ required: true }) request: BuildManyInputsRequest): Promise<BuildResponse> {
        const asset = await this.ensureAsset(request.assetId);
        const items = request.inputs.map(vin => new OperationItem(vin.fromAddress, request.toAddress, asset, vin.amount));
        const txctx = await this.eosService.buildTransaction(request.operationId, items);

        return new BuildResponse(toBase64(txctx));
    }

    @Post("/many-outputs")
    async buildManyOutputs(@Body({ required: true }) request: BuildManyOutputsRequest): Promise<BuildResponse> {
        const asset = await this.ensureAsset(request.assetId);
        const items = request.outputs.map(out => new OperationItem(request.fromAddress, out.toAddress, asset, out.amount));
        const txctx = await this.eosService.buildTransaction(request.operationId, items);

        return new BuildResponse(toBase64(txctx));
    }

    @Put()
    async Rebuild() {
        throw new NotImplementedError();
    }

    @Post("/broadcast")
    async broadcast(@Body({ required: true }) request: BroadcastRequest) {
        return await this.eosService.broadcastTransaction(request.operationId, fromBase64(request.signedTransaction));
    }
}