import { JsonController, Param, Body, Get, Post, Put, Delete, BadRequestError, OnNull, OnUndefined, QueryParam, HttpCode } from "routing-controllers";
import { IsArray, IsString, IsNotEmpty, IsBase64, IsUUID, IsJSON } from "class-validator";
import { EosService } from "../services/eosService";
import { AssetRepository, AssetEntity } from "../domain/assets";
import { OperationRepository, OperationType, OperationEntity } from "../domain/operations";
import { toBase64, fromBase64, ADDRESS_SEPARATOR, isoUTC } from "../common";
import { NotImplementedError } from "../errors/notImplementedError";
import { LogService, LogLevel } from "../services/logService";
import { ConflictError } from "../errors/conflictError";
import { BlockchainError, ErrorCode } from "../errors/blockchainError";
import { HistoryRepository, HistoryAddressCategory } from "../domain/history";
import { BalanceEntity, BalanceRepository } from "../domain/balances";

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

class SignedTransactionModel {
    txId: string;
}

@JsonController("/transactions")
export class TransactionsController {

    constructor(
        private logService: LogService,
        private eosService: EosService,
        private operationRepository: OperationRepository,
        private assetRepository: AssetRepository,
        private historyRepository: HistoryRepository,
        private balanceRepository: BalanceRepository) {
    }

    private getAccount(address: string) {
        return address.split(ADDRESS_SEPARATOR)[0];
    }

    private isSimulated(from: string, to: string): boolean {
        return this.getAccount(from) == this.getAccount(to);
    }

    private getState(operation: OperationEntity): State {
        return !!operation.FailTime ? State.failed : !!operation.CompletionTime ? State.completed : State.inProgress;
    }

    private getTimestamp(operation: OperationEntity): Date {
        return operation.FailTime || operation.CompletionTime || operation.SendTime;
    }


    private async build(type: OperationType, operationId: string, assetId: string, inOut: { fromAddress: string, toAddress: string, amount: string }[]) {
        const operation = await this.operationRepository.get(operationId);
        if (!!operation && operation.isSent()) {
            throw new BlockchainError({ status: 409, message: `Operation [${operationId}] already broadcasted` });
        }

        const asset = await this.assetRepository.get(assetId);
        if (asset == null) {
            throw new BlockchainError({ status: 400, message: `Unknown asset [${assetId}]` });
        }

        const opActions = [];
        const txActions = [];

        for (const action of inOut) {

            if (!this.eosService.validate(action.fromAddress)) {
                throw new BlockchainError({ status: 400, message: `Invalid address [${action.fromAddress}]` });
            }

            if (!this.eosService.validate(action.toAddress)) {
                throw new BlockchainError({ status: 400, message: `Invalid address [${action.toAddress}]` });
            }

            const amountInBaseUnit = parseInt(action.amount);

            if (Number.isNaN(amountInBaseUnit) || amountInBaseUnit <= 0) {
                throw new BlockchainError({ status: 400, message: `Invalid amount [${action.amount}]` });
            }

            const amount = asset.fromBaseUnit(amountInBaseUnit);

            opActions.push({
                ...action,
                amountInBaseUnit: amountInBaseUnit,
                amount: amount
            });

            let balanceInBaseUnit = 0;

            if (this.isSimulated(action.fromAddress, action.toAddress)) {
                const balanceEntity = await this.balanceRepository.get(action.fromAddress, assetId);
                balanceInBaseUnit = balanceEntity && balanceEntity.AmountInBaseUnit;
            } else {
                const from = this.getAccount(action.fromAddress);
                const to = this.getAccount(action.toAddress);
                const quantity = `${amount.toFixed(asset.Accuracy)} ${asset.AssetId}`;
                const memo = action.toAddress.split(ADDRESS_SEPARATOR)[1] || "";
                const balanceAmount = await this.eosService.getBalance(from, asset.Address, asset.AssetId);
                balanceInBaseUnit = asset.toBaseUnit(balanceAmount);
                txActions.push({
                    account: asset.Address,
                    name: "transfer",
                    authorization: [{ actor: from, permission: "active" }],
                    data: { from, to, quantity, memo }
                });
            }

            if (balanceInBaseUnit < amountInBaseUnit) {
                throw new BlockchainError({ status: 400, message: `Not enough balance on address [${action.fromAddress}]`, errorCode: ErrorCode.notEnoughBalance });
            }
        }

        const context = {
            chainId: await this.eosService.getChainId(),
            headers: await this.eosService.getTransactionHeaders(),
            actions: txActions
        };

        await this.operationRepository.upsert(operationId, type, assetId, opActions, isoUTC(context.headers.expiration));

        return {
            transactionContext: toBase64(context)
        };
    }

    private async getHistory(category: HistoryAddressCategory, address: string, take: number, afterHash: string) {
        if (take <= 0) {
            throw new BadRequestError("Query parameter [take] is required");
        }

        if (!this.eosService.validate(address)) {
            throw new BadRequestError(`Invalid address [${address}]`);
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
        const operation = await this.operationRepository.get(request.operationId);
        const operationActions = await this.operationRepository.getActions(request.operationId);
        const block = await this.eosService.getLastIrreversibleBlockNumber();
        const now = new Date();
        const tx = fromBase64<SignedTransactionModel>(request.signedTransaction);
        let txId = tx.txId;

        if (!!txId) {
            // for fully simulated transaction we mark
            // operation as completed immediately
            await this.operationRepository.update(request.operationId, { sendTime: now, txId, completionTime: now, blockTime: now, block });
        } else {
            if (!operation || !operation.isSent()) {
                try {
                    txId = await this.eosService.pushTransaction(tx);
                } catch (error) {
                    if (error.status == 400) {
                        throw new BlockchainError({ status: error.status, message: `Transaction rejected`, data: JSON.parse(error.message) });
                    } else {
                        throw error;
                    }
                }
            }

            await this.operationRepository.update(request.operationId, { sendTime: now, txId });
        }

        for (const action of operationActions) {
            // record balance changes
            const balanceChanges = [
                { address: action.from, affix: -action.Amount, affixInBaseUnit: -action.AmountInBaseUnit },
                { address: action.ToAddress, affix: action.Amount, affixInBaseUnit: action.AmountInBaseUnit }
            ];
            for (const bc of balanceChanges) {
                await this.balanceRepository.upsert(bc.address, operation.AssetId, operation.OperationId, bc.affix, bc.affixInBaseUnit);
                await this.logService.write(LogLevel.info, TransactionsController.name, this.broadcast.name,
                    "Balance change recorded", JSON.stringify({ ...bc, assetId: operation.AssetId, txId }));
            }

            // upsert history of simulated operation actions
            if (this.isSimulated(action.FromAddress, action.ToAddress)) {
                await this.historyRepository.upsert(action.FromAddress, action.ToAddress, operation.AssetId, action.Amount, action.AmountInBaseUnit,
                    block, now, txId, action.RowKey, operation.OperationId);
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
                    fromAddress: a.FromAddress
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
                    toAddress: a.ToAddress
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
    async getHistoryFrom(
        @Param("address") address: string,
        @QueryParam("take", { required: true }) take: number,
        @QueryParam("afterHash") afterHash: string) {

        return await this.getHistory(HistoryAddressCategory.From, address, take, afterHash);
    }

    @Get("/history/to/:address")
    async getHistoryTo(
        @Param("address") address: string,
        @QueryParam("take", { required: true }) take: number,
        @QueryParam("afterHash") afterHash: string) {

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