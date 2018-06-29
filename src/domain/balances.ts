import { Settings } from "../common";
import { AzureEntity, AzureRepository, Ignore, Double, AzureQueryResult, Int64 } from "./queries";
import { isString } from "util";
import { TableQuery } from "azure-storage";
import { Service } from "typedi";

export class AddressEntity extends AzureEntity {
    @Ignore()
    get Address(): string {
        return this.PartitionKey;
    }
}

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
    Amount: number;

    @Int64()
    AmountInBaseUnit: number;
}

@Service()
export class BalanceRepository extends AzureRepository {

    private addressTableName: string = "EosBalanceAddresses";
    private balanceTableName: string = "EosBalances";

    constructor(private settings: Settings) {
        super(settings.EosApi.DataConnectionString);
    }

    async observe(address: string) {
        const entity = new AddressEntity();
        entity.PartitionKey = address;
        entity.RowKey = "";

        await this.insertOrMerge(this.addressTableName, entity);
    }

    async isObservable(address: string): Promise<boolean> {
        return !!(await this.select(AddressEntity, this.addressTableName, address, ""));
    }

    /**
     * Creates, updates or removes balance record for address.
     * @param address Address
     * @param assetId Asset
     * @param affix Amount to add (if positive) or subtract (if negative)
     */
    async modify(address: string, assetId: string, affix: number, affixInBaseUnit: number): Promise<{ amount: number, amountInBaseUnit: number }> {
        let entity = await this.select(BalanceEntity, this.balanceTableName, address, assetId);
        if (entity == null) {
            entity = new BalanceEntity();
            entity.PartitionKey = address;
            entity.RowKey = assetId;
        }

        entity.Amount += affix;
        entity.AmountInBaseUnit += affixInBaseUnit;

        if (entity.AmountInBaseUnit != 0) {
            await this.insertOrMerge(this.balanceTableName, entity);
        } else {
            await this.delete(this.balanceTableName, entity.PartitionKey, entity.RowKey);
        }

        return {
            amount: entity.Amount,
            amountInBaseUnit: entity.AmountInBaseUnit
        };
    }

    async remove(address: string, assetId?: string) {
        if (!!assetId) {
            await this.delete(this.balanceTableName, address, assetId);
        } else {
            await this.delete(this.addressTableName, address, "");
            await this.deleteAll(BalanceEntity, this.balanceTableName, new TableQuery().where("PartitionKey == ?", address));
        }
    }

    async get(address: string, assetId: string): Promise<BalanceEntity>;
    async get(take: number, continuation?: string): Promise<AzureQueryResult<BalanceEntity>>;
    async get(addressOrTake: string | number, assetIdOrcontinuation?: string): Promise<BalanceEntity | AzureQueryResult<BalanceEntity>> {
        if (isString(addressOrTake)) {
            return await this.select(BalanceEntity, this.balanceTableName, addressOrTake, assetIdOrcontinuation);
        } else {
            return await this.select(BalanceEntity, this.balanceTableName, new TableQuery().top(addressOrTake || 100), assetIdOrcontinuation);
        }
    }

    async all(): Promise<BalanceEntity[]> {
        return await this.selectAll(c => this.get(100, c));
    }
}