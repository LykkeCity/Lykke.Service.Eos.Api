import { JsonController, Param, Body, Get, Post, Put, Delete, BadRequestError, OnNull, OnUndefined, QueryParam, HttpCode } from "routing-controllers";
import { IsArray, IsString, IsNotEmpty, IsBase64, IsUUID } from "class-validator";
import { EosService } from "../services/eosService";
import { AssetRepository, AssetEntity } from "../domain/assets";
import { OperationRepository, OperationType, OperationEntity } from "../domain/operations";
import { toBase64, fromBase64, ADDRESS_SEPARATOR, isoUTC } from "../common";
import { NotImplementedError } from "../errors/notImplementedError";
import { LogService, LogLevel } from "../services/logService";
import { ConflictError } from "../errors/conflictError";
import { BlockchainError } from "../errors/blockchainError";
import { HistoryRepository, HistoryAddressCategory } from "../domain/history";

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

enum State {
    inProgress = "inProgress",
    completed = "completed",
    failed = "failed"
}

@JsonController("/transactions")
export class TransactionsController {

    constructor(
        private logService: LogService,
        private eosService: EosService,
        private operationRepository: OperationRepository,
        private assetRepository: AssetRepository,
        private historyRepository: HistoryRepository) {
    }

    private isFake(action: { fromAddress: string, toAddress: string }): boolean {
        return action.fromAddress.split(ADDRESS_SEPARATOR)[0] == action.toAddress.split(ADDRESS_SEPARATOR)[0];
    }

    private getState(operation: OperationEntity): State {
        return !!operation.FailTime ? State.failed : !!operation.CompletionTime ? State.completed : State.inProgress;
    }

    private getTimestamp(operation: OperationEntity): Date {
        return operation.FailTime || operation.CompletionTime || operation.SendTime;
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
        if (!!operation && operation.isSent()) {
            throw new ConflictError("Operation already broadcasted");
        }
    }

    private async build(type: OperationType, operationId: string, assetId: string,
        inOut: { fromAddress: string, toAddress: string, amount: string }[]) {

        if (inOut.some(a => !this.eosService.validate(a.fromAddress) || !this.eosService.validate(a.fromAddress))) {
            throw new BadRequestError("Invalid address(es)");
        }

        if (inOut.some(a => Number.isNaN(parseInt(a.amount)) || parseInt(a.amount) == 0)) {
            throw new BadRequestError("Invalid amount(s)");
        }

        await this.ensureOperationNotBroadcasted(operationId);

        const asset = await this.ensureAsset(assetId);
        const actions = inOut.map(e => ({
            ...e,
            amount: asset.fromBaseUnit(parseInt(e.amount)),
            amountInBaseUnit: parseInt(e.amount)
        }));
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

    private async getHistory(category: HistoryAddressCategory, address: string, take: number, afterHash: string) {
        if (take <= 0) {
            throw new BadRequestError(`Query parameter "take" is required`);
        }

        if (!this.eosService.validate(address)) {
            throw new BadRequestError("Invalid address");
        }

        const history = await this.historyRepository.get(category, address, take, afterHash);

        return history.map(e => ({
            timestamp: e.BlockTime,
            fromAddress: e.From,
            toAsdress: e.To,
            assetId: e.AssetId,
            amount: e.AmountInBaseUnit.toFixed(),
            hash: e.TxId
        }));
    }

    @Post("/single")
    async buildSingle(@Body({ required: true }) request: BuildSingleRequest) {
        return await this.build(OperationType.Single, request.operationId, request.assetId, Array.of(request))
    }

    @Post("/many-inputs")
    async buildManyInputs(@Body({ required: true }) request: BuildManyInputsRequest) {
        return await this.build(OperationType.ManyInputs,
            request.operationId,
            request.assetId,
            request.inputs.map(vin => ({
                toAddress: request.toAddress,
                ...vin
            })));
    }

    @Post("/many-outputs")
    async buildManyOutputs(@Body({ required: true }) request: BuildManyOutputsRequest) {
        return await this.build(OperationType.ManyOutputs,
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
            await this.operationRepository.update(request.operationId, {
                sendTime: new Date(),
                txId
            });

            // TODO: update balances

        } catch (error) {
            if (error.status == 400) {
                throw new BlockchainError({ status: error.status, message: `Transaction rejected`, data: JSON.parse(error.message) });
            } else {
                throw error;
            }
        }
    }

    @Get("/broadcast/single/:operationId")
    @OnNull(204)
    @OnUndefined(204)
    async getSingle(@Param("operationId") operationId: string) {
        const operation = await this.operationRepository.get(operationId);
        if (!!operation) {
            return {
                operationId,
                state: this.getState(operation),
                timestamp: this.getTimestamp(operation),
                amount: operation.AmountInBaseUnit.toFixed(),
                fee: "0",
                hash: operation.TxId,
                block: operation.Block,
                error: operation.Error
            };
        } else {
            return null;
        }
    }

    @Get("/broadcast/many-inputs/:operationId")
    @OnNull(204)
    @OnUndefined(204)
    async getManyInputs(@Param("operationId") operationId: string) {
        const operation = await this.operationRepository.get(operationId);
        if (!!operation && operation.isNotBuiltOrDeleted()) {
            const actions = await this.operationRepository.getActions(operationId);
            return {
                operationId,
                state: this.getState(operation),
                timestamp: this.getTimestamp(operation),
                inputs: actions.map(a => ({
                    amount: a.AmountInBaseUnit.toFixed(),
                    fromAddress: a.From
                })),
                fee: "0",
                hash: operation.TxId,
                block: operation.Block,
                error: operation.Error
            };
        } else {
            return null;
        }
    }

    @Get("/broadcast/many-outputs/:operationId")
    @OnNull(204)
    @OnUndefined(204)
    async getManyOutputs(@Param("operationId") operationId: string) {
        const operation = await this.operationRepository.get(operationId);
        if (!!operation) {
            const actions = await this.operationRepository.getActions(operationId);
            return {
                operationId,
                state: this.getState(operation),
                timestamp: this.getTimestamp(operation),
                outputs: actions.map(a => ({
                    amount: a.AmountInBaseUnit.toFixed(),
                    toAddress: a.To
                })),
                fee: "0",
                hash: operation.TxId,
                block: operation.Block,
                error: operation.Error
            };
        } else {
            return null;
        }
    }

    @Delete("/boradcast/:operationId")
    @OnNull(200)
    @OnUndefined(200)
    async deleteBroadcasted(@Param("operationId") operationId: string) {
        await this.operationRepository.update(operationId, {
            deleteTime: new Date()
        });
    }

    @Get("/history/from/:address")
    async getHistoryFrom(@Param("address") address: string, @QueryParam("take", { required: true }) take: number, @QueryParam("afterHash") afterHash: string) {
        return await this.getHistory(HistoryAddressCategory.From, address, take, afterHash);
    }

    @Get("/history/to/:address")
    async getHistoryTo(@Param("address") address: string, @QueryParam("take", { required: true }) take: number, @QueryParam("afterHash") afterHash: string) {
        return await this.getHistory(HistoryAddressCategory.To, address, take, afterHash);
    }

    @Post("/history/from/:address/observation")
    @HttpCode(200)
    @OnNull(200)
    @OnUndefined(200)
    async observeFrom(@Param("address") address: string) {
        // always OK due to controlling transaction tracking by node's configuration
    }

    @Delete("/history/from/:address/observation")
    @HttpCode(200)
    @OnNull(200)
    @OnUndefined(200)
    async deleteFromObservation(@Param("address") address: string) {
        // always OK due to controlling transaction tracking by node's configuration
    }

    @Post("/history/to/:address/observation")
    @HttpCode(200)
    @OnNull(200)
    @OnUndefined(200)
    async observeTo(@Param("address") address: string) {
        // always OK due to controlling transaction tracking by node's configuration
    }

    @Delete("/history/to/:address/observation")
    @HttpCode(200)
    @OnNull(200)
    @OnUndefined(200)
    async deleteToObservation(@Param("address") address: string) {
        // always OK due to controlling transaction tracking by node's configuration
    }
}