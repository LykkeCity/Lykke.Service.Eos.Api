import { TableQuery } from "azure-storage";
import { Settings } from "../common";
import { AzureQueryResult, AzureEntity, AzureRepository, Ignore, Int32 } from "./queries";
import { isString } from "util";
import { Service } from "typedi";

export class AssetEntity extends AzureEntity {

    /**
     * Token symbol
     */
    @Ignore()
    get AssetId(): string {
        return this.PartitionKey;
    }

    /**
     * Token contract account
     */
    Address: string;

    Name: string;

    /**
     * Number of digits after the decimal point
     */
    @Int32()
    Accuracy: number;

    parse(integerString: string) {
        return parseInt(integerString) / Math.pow(10, this.Accuracy);
    }
}

@Service()
export class AssetRepository extends AzureRepository {

    private tableName: string = "EosAssets";

    constructor(private settings: Settings) {
        super(settings.EosApi.DataConnectionString);
    }

    async get(id: string): Promise<AssetEntity>;
    async get(take: number, continuation?: string): Promise<AzureQueryResult<AssetEntity>>;
    async get(idOrTake: string | number, continuation?: string): Promise<AssetEntity | AzureQueryResult<AssetEntity>> {
        if (isString(idOrTake)) {
            return await this.select(AssetEntity, this.tableName, idOrTake, "");
        } else {
            return await this.select(AssetEntity, this.tableName, new TableQuery().top(idOrTake || 100), continuation);
        }
    }

    async all(): Promise<AssetEntity[]> {
        return await this.selectAll(c => this.get(100, c));
    }
}