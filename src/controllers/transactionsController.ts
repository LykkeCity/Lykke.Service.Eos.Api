import { JsonController, Param, Body, Get, Post, Put, Delete, BadRequestError, OnNull, OnUndefined } from "routing-controllers";
import { IsArray, IsString, IsNotEmpty, IsBase64, IsUUID } from "class-validator";
import { EosService } from "../services/eosService";
import { AssetRepository, AssetEntity } from "../domain/assets";
import { OperationRepository, OperationType } from "../domain/operations";
import { toBase64, fromBase64, ADDRESS_SEPARATOR, isoUTC } from "../common";
import { NotImplementedError } from "../errors/notImplementedError";
import { LogService, LogLevel } from "../services/logService";
import { ConflictError } from "../errors/conflictError";

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

@JsonController("/transactions")
export class TransactionsController {

    constructor(
        private logService: LogService,
        private eosService: EosService,
        private assetRepository: AssetRepository,
        private operationRepository: OperationRepository) {
    }

    private isFake(action: { fromAddress: string, toAddress: string }): boolean {
        return action.fromAddress.split(ADDRESS_SEPARATOR)[0] == action.toAddress.split(ADDRESS_SEPARATOR)[0];
    }

    private async ensureAsset(assetId: string): Promise<AssetEntity> {
        const asset = await this.assetRepository.get(assetId);
        if (!!asset) {
            return asset;
        }

        throw new BadRequestError("Unknown asset");
    }

    private async ensureOperationNotBroadcasted(operationId: string) {
        const operation = await this.operationRepository.get(operationId);
        if (!!operation) {
            if (!!operation.SendTime) {
                throw new ConflictError("Operation already broadcasted");
            } else if (!!operation.FailTime) {
                throw new ConflictError("Operation failed while broadcasting, use another operationId to repeat");
            }
        }
    }

    private async build(type: OperationType, operationId: string, assetId: string, inputsOutputs: { fromAddress: string, toAddress: string, amount: string }[]) {
        if (inputsOutputs.some(a => !this.eosService.validate(a.fromAddress) || !this.eosService.validate(a.fromAddress))) {
            throw new BadRequestError("Invalid address(es)");
        }

        if (inputsOutputs.some(a => Number.isNaN(Number.parseInt(a.amount)))) {
            throw new BadRequestError("Invalid amount(s)");
        }

        await this.ensureOperationNotBroadcasted(operationId);

        const asset = await this.ensureAsset(assetId);
        const actions = inputsOutputs.map(e => ({ ...e, amount: asset.parse(e.amount) }));
        const context = {
            chainId: await this.eosService.getChainId(),
            headers: await this.eosService.getTransactionHeaders(),
            actions: actions
                .filter(action => !this.isFake(action))
                .map(action => {
                    const from = action.fromAddress.split(ADDRESS_SEPARATOR)[0];
                    const memo = action.fromAddress.split(ADDRESS_SEPARATOR)[1] || "";
                    const to = action.toAddress.split(ADDRESS_SEPARATOR)[0];
                    const quantity = `${action.amount.toFixed(asset.Accuracy)} ${asset.AssetId}`;
                    return {
                        account: asset.Address,
                        name: "transfer",
                        authorization: [{ actor: from, permission: "active" }],
                        data: { from, to, quantity, memo }
                    };
                })
        }

        await this.operationRepository.upsert(operationId, type, assetId, actions, isoUTC(context.headers.expiration));

        return {
            transactionContext: toBase64(context)
        };
    }

    @Post("/single")
    async buildSingle(@Body({ required: true }) request: BuildSingleRequest) {
        return await this.build(OperationType.Single, request.operationId, request.assetId, Array.of(request))
    }

    @Post("/many-inputs")
    async buildManyInputs(@Body({ required: true }) request: BuildManyInputsRequest) {
        return await this.build(OperationType.MultiFrom,
            request.operationId,
            request.assetId,
            request.inputs.map(vin => ({
                toAddress: request.toAddress,
                ...vin
            })));
    }

    @Post("/many-outputs")
    async buildManyOutputs(@Body({ required: true }) request: BuildManyOutputsRequest) {
        return await this.build(OperationType.MultiTo,
            request.operationId,
            request.assetId,
            request.outputs.map(vout => ({
                fromAddress: request.fromAddress,
                ...vout
            })));
    }

    @Put()
    async Rebuild() {
        throw new NotImplementedError();
    }

    @Post("/broadcast")
    @OnNull(200)
    @OnUndefined(200)
    async broadcast(@Body({ required: true }) request: BroadcastRequest) {
        await this.ensureOperationNotBroadcasted(request.operationId);

        try {
            const txId = await this.eosService.pushTransaction(fromBase64(request.signedTransaction));
            await this.operationRepository.updateSend(request.operationId, txId);

            // TODO: update balances

        } catch (error) {
            if (error.status == 400) {
                // HTTP 400 means transaction data is wrong,
                // it's useless to repeat so mark as failed:
                await this.operationRepository.updateFail(request.operationId, error.message);
                await this.logService.write(LogLevel.warning, TransactionsController.name, this.broadcast.name, "Transaction rejected",
                    error.message, error.name, error.stack);
            } else {
                throw error;
            }
        }
    }
}