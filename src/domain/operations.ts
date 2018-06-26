import { TableQuery, TableBatch } from "azure-storage";
import { Settings } from "../common";
import { AzureRepository, AzureEntity, Ignore, Int64, Double } from "./queries";
import { isDate, isString } from "util";
import { AssetEntity } from "./assets";
import { Service } from "typedi";

export enum OperationType {
    Single = "Single",
    MultiFrom = "MultiFrom",
    MultiTo = "MultiTo",
    MultiFromMultiTo = "MultiFromMultiTo"
}

export class OperationEntity extends AzureEntity {
    @Ignore()
    get OperationId(): string {
        return this.PartitionKey;
    }

    Type: OperationType;
    AssetId: string;

    @Double()
    Amount: number;

    BuildTime: Date;
    ExpiryTime: Date;
    SendTime: Date;
    TxId: string;
    CompletionTime: Date;
    BlockTime: Date;

    @Int64()
    Block: number;

    FailTime: Date;
    Error: string;
}

export class OperationActionEntity extends AzureEntity {

    @Ignore()
    get OperationId(): string {
        return this.PartitionKey;
    }

    From: string;
    To: string;

    @Double()
    Amount: number;
}

export class OperationByExpiryTimeEntity extends AzureEntity {
    @Ignore()
    get ExpiryTime(): Date {
        return new Date(this.PartitionKey);
    }

    @Ignore()
    get OperationId(): string {
        return this.RowKey;
    }
}

export class OperationByTxIdEntity extends AzureEntity {
    @Ignore()
    get TxId(): string {
        return this.PartitionKey;
    }

    OperationId: string;
}

@Service()
export class OperationRepository extends AzureRepository {

    private operationTableName: string = "EosOperations";
    private operationActionTableName: string = "EosOperationActions";
    private operationByExpiryTimeTableName: string = "EosOperationsByExpiryTime";
    private operationByTxIdTableName: string = "EosOperationsByTxId";

    constructor(private settings: Settings) {
        super(settings.EosApi.DataConnectionString);
    }

    async upsert(operationId: string, type: OperationType, assetId: string, actions: { fromAddress: string, toAddress: string, amount: number }[], expiryTime: Date) {
        const operationEntity = new OperationEntity();
        operationEntity.PartitionKey = operationId;
        operationEntity.RowKey = "";
        operationEntity.Type = type;
        operationEntity.AssetId = assetId;
        operationEntity.Amount = actions.reduce((sum, action) => sum + action.amount, 0);
        operationEntity.BuildTime = new Date();
        operationEntity.ExpiryTime = expiryTime;

        const operationActionEntities = actions.map((action, i) => {
            const entity = new OperationActionEntity();
            entity.PartitionKey = operationId;
            entity.RowKey = i.toString().padStart(4, "0");
            entity.From = action.fromAddress;
            entity.To = action.toAddress;
            entity.Amount = action.amount;
            return entity;
        });

        const operationByExpiryTimeEntity = new OperationByExpiryTimeEntity();
        operationByExpiryTimeEntity.PartitionKey = expiryTime.toISOString();
        operationByExpiryTimeEntity.RowKey = operationId;

        await this.insertOrMerge(this.operationTableName, operationEntity);
        await this.insertOrMerge(this.operationActionTableName, operationActionEntities);
        await this.insertOrMerge(this.operationByExpiryTimeTableName, operationByExpiryTimeEntity);
    }

    async updateSend(operationId: string, txId: string) {
        const operationEntity = new OperationEntity();
        operationEntity.PartitionKey = operationId;
        operationEntity.RowKey = "";
        operationEntity.SendTime = new Date();
        operationEntity.TxId = txId;

        await this.insertOrMerge(this.operationTableName, operationEntity);
    }

    async updateFail(operationId: string, error: string) {
        const operationEntity = new OperationEntity();
        operationEntity.PartitionKey = operationId;
        operationEntity.RowKey = "";
        operationEntity.FailTime = new Date();
        operationEntity.Error = error;

        await this.insertOrMerge(this.operationTableName, operationEntity);
    }

    async get(operationId: string): Promise<OperationEntity> {
        return await this.select(OperationEntity, this.operationTableName, operationId, "");
    }
}