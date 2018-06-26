import { AssetEntity } from "./assets";
import { Settings } from "../common";
import { AzureEntity, AzureRepository, Ignore, Double, AzureQueryResult } from "./queries";
import { isString } from "util";
import { TableQuery } from "azure-storage";
import { Service } from "typedi";

export class BalanceEntity extends AzureEntity {

    @Ignore()
    get Address(): string {
        return this.PartitionKey;
    }

    @Ignore()
    get AssetId(): string {
        return this.RowKey;
    }

    @Double()
    Balance: number;
}

@Service()
export class BalanceRepository extends AzureRepository {

    private tableName: string = "EosBalances";

    constructor(private settings: Settings) {
        super(settings.EosApi.DataConnectionString);
    }

    /**
     * Updates or creates balance record for address.
     * @param address Address
     * @param asset Asset
     * @param affix Amount to add (if positive) or subtract (if negative)
     */
    async upsert(address: string, asset: AssetEntity, affix: number): Promise<number> {
        let entity = await this.select(BalanceEntity, this.tableName, address, asset.AssetId);

        if (entity) {
            entity.Balance += affix;
        } else {
            entity = new BalanceEntity();
            entity.PartitionKey = address;
            entity.RowKey = asset.AssetId;
            entity.Balance = affix;
        }

        await this.insertOrMerge(this.tableName, entity);

        return entity.Balance;
    }

    async get(id: string): Promise<BalanceEntity>;
    async get(take: number, continuation?: string): Promise<AzureQueryResult<BalanceEntity>>;
    async get(idOrTake: string | number, continuation?: string): Promise<BalanceEntity | AzureQueryResult<BalanceEntity>> {
        if (isString(idOrTake)) {
            return await this.select(BalanceEntity, this.tableName, idOrTake, "");
        } else {
            return await this.select(BalanceEntity, this.tableName, new TableQuery().top(idOrTake || 100), continuation);
        }
    }

    async all(): Promise<BalanceEntity[]> {
        return await this.selectAll(c => this.get(100, c));
    }
}