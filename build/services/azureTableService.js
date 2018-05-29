"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const azure_storage_1 = require("azure-storage");
class AzureEntity {
}
exports.AzureEntity = AzureEntity;
class AzureTableService {
    constructor(connectionString, tableName) {
        this.tableName = tableName;
        this._table = azure_storage_1.createTableService(connectionString);
    }
    ensureTable() {
        return new Promise((res, rej) => {
            this._table.createTableIfNotExists(this.tableName, (err, result) => {
                if (err) {
                    rej(err);
                }
                else {
                    res(this._table);
                }
            });
        });
    }
    retrieve(partitionKey, rowKey) {
        return this.ensureTable()
            .then(table => new Promise((res, rej) => table.retrieveEntity(this.tableName, partitionKey, rowKey, (err, result, response) => {
            if (err && response.statusCode != 404) {
                rej(err);
            }
            else {
                res(result);
            }
        })));
    }
}
exports.AzureTableService = AzureTableService;
//# sourceMappingURL=azureTableService.js.map