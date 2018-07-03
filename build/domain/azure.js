"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const azure_storage_1 = require("azure-storage");
const common_1 = require("../common");
const util_1 = require("util");
require("reflect-metadata");
const azureEdmMetadataKey = Symbol("Azure.Edm");
const azureIgnoreMetadataKey = Symbol("Azure.Ignore");
const int64EdmMetadataKey = "Edm.Int64";
const int32EdmMetadataKey = "Edm.Int32";
const doubleEdmMetadataKey = "Edm.Double";
function Ignore() {
    return (target, propertyKey) => Reflect.defineMetadata(azureIgnoreMetadataKey, true, target, propertyKey);
}
exports.Ignore = Ignore;
function Int64() {
    return (target, propertyKey) => Reflect.defineMetadata(azureEdmMetadataKey, int64EdmMetadataKey, target, propertyKey);
}
exports.Int64 = Int64;
function Int32() {
    return (target, propertyKey) => Reflect.defineMetadata(azureEdmMetadataKey, int32EdmMetadataKey, target, propertyKey);
}
exports.Int32 = Int32;
function Double() {
    return (target, propertyKey) => Reflect.defineMetadata(azureEdmMetadataKey, doubleEdmMetadataKey, target, propertyKey);
}
exports.Double = Double;
function fromAzure(entityOrContinuationToken, t) {
    if (!entityOrContinuationToken) {
        return null;
    }
    if (!t) {
        return common_1.toBase64(entityOrContinuationToken);
    }
    else {
        const result = new t(); // cast to "any" type to be able to set properties by name
        for (const key in entityOrContinuationToken) {
            if (entityOrContinuationToken.hasOwnProperty(key)) {
                if (!!entityOrContinuationToken[key] && entityOrContinuationToken[key].hasOwnProperty("_")) {
                    switch (entityOrContinuationToken[key].$) {
                        case "Edm.DateTime":
                            result[key] = new Date(entityOrContinuationToken[key]._);
                            break;
                        case "Edm.Int32":
                        case "Edm.Int64":
                            result[key] = parseInt(entityOrContinuationToken[key]._);
                            break;
                        case "Edm.Double":
                            result[key] = parseFloat(entityOrContinuationToken[key]._);
                            break;
                        default:
                            result[key] = entityOrContinuationToken[key]._;
                            break;
                    }
                }
                else {
                    result[key] = entityOrContinuationToken[key];
                }
            }
        }
        return result;
    }
}
exports.fromAzure = fromAzure;
function toAzure(entityOrContinuation) {
    if (!entityOrContinuation) {
        return null;
    }
    if (util_1.isString(entityOrContinuation)) {
        return common_1.fromBase64(entityOrContinuation);
    }
    else {
        const entity = {
            ".metadata": entityOrContinuation[".metadata"] // cast to "any" type to be able to get properties by name
        };
        for (const key in entityOrContinuation) {
            if (key != ".metadata" && !Reflect.getMetadata(azureIgnoreMetadataKey, entityOrContinuation, key)) {
                entity[key] = {
                    _: entityOrContinuation[key],
                    $: Reflect.getMetadata(azureEdmMetadataKey, entityOrContinuation, key)
                };
            }
        }
        return entity;
    }
}
exports.toAzure = toAzure;
class AzureEntity {
}
exports.AzureEntity = AzureEntity;
class AzureQueryResult {
    constructor(azureQueryResult, toT) {
        this.items = azureQueryResult.entries.map(toT);
        this.continuation = fromAzure(azureQueryResult.continuationToken);
    }
}
exports.AzureQueryResult = AzureQueryResult;
class AzureRepository {
    constructor(connectionString) {
        this.table = azure_storage_1.createTableService(connectionString);
    }
    ensureTable(tableName) {
        return new Promise((res, rej) => {
            this.table.createTableIfNotExists(tableName, err => {
                if (err) {
                    rej(err);
                }
                else {
                    res();
                }
            });
        });
    }
    delete(tableName, partitionKey, rowKey) {
        return this.ensureTable(tableName)
            .then(() => {
            return new Promise((res, rej) => {
                const entity = {
                    PartitionKey: azure_storage_1.TableUtilities.entityGenerator.String(partitionKey),
                    RowKey: azure_storage_1.TableUtilities.entityGenerator.String(rowKey)
                };
                this.table.deleteEntity(tableName, entity, (err, response) => {
                    if (err && response.statusCode != 404) {
                        rej(err);
                    }
                    else {
                        res();
                    }
                });
            });
        });
    }
    deleteAll(t, tableName, query) {
        return this.selectAll(async (c) => await this.select(t, tableName, query, c))
            .then(list => {
            const batches = [];
            while (list.length) {
                const batch = new azure_storage_1.TableBatch();
                list.splice(0, 100)
                    .forEach(e => batch.deleteEntity(toAzure(e)));
                batches.push(new Promise((res, rej) => {
                    this.table.executeBatch(tableName, batch, err => {
                        if (err) {
                            rej(err);
                        }
                        else {
                            res();
                        }
                    });
                }));
            }
            return Promise.all(batches);
        });
    }
    select(t, tableName, partitionKeyOrQuery, rowKeyOrContinuation, throwIfNotFound = false) {
        return this.ensureTable(tableName)
            .then(() => {
            return new Promise((res, rej) => {
                if (util_1.isString(partitionKeyOrQuery)) {
                    this.table.retrieveEntity(tableName, partitionKeyOrQuery, rowKeyOrContinuation, (err, result, response) => {
                        if (err && (response.statusCode != 404 || !!throwIfNotFound)) {
                            rej(err);
                        }
                        else {
                            res(fromAzure(result, t));
                        }
                    });
                }
                else {
                    this.table.queryEntities(tableName, partitionKeyOrQuery, toAzure(rowKeyOrContinuation), (err, result) => {
                        if (err) {
                            rej(err);
                        }
                        else {
                            res(new AzureQueryResult(result, e => fromAzure(e, t)));
                        }
                    });
                }
            });
        });
    }
    insertOrMerge(tableName, entityOrArray) {
        return this.ensureTable(tableName)
            .then(() => {
            if (util_1.isArray(entityOrArray)) {
                const batches = [];
                while (entityOrArray.length) {
                    const batch = new azure_storage_1.TableBatch();
                    entityOrArray.splice(0, 100)
                        .forEach(e => batch.insertOrMergeEntity(toAzure(e)));
                    batches.push(new Promise((res, rej) => {
                        this.table.executeBatch(tableName, batch, err => {
                            if (err) {
                                rej(err);
                            }
                            else {
                                res();
                            }
                        });
                    }));
                }
                return Promise.all(batches).then(() => { });
            }
            else {
                return new Promise((res, rej) => {
                    this.table.insertOrMergeEntity(tableName, toAzure(entityOrArray), err => {
                        if (err) {
                            rej(err);
                        }
                        else {
                            res();
                        }
                    });
                });
            }
        });
    }
    /**
     * Fetches all entities chunk by chunk.
     * @param query Performs actual query, must accept continuation
     */
    async selectAll(query) {
        let continuation = null;
        let items = [];
        do {
            const res = await query(continuation);
            continuation = res.continuation;
            items = items.concat(res.items);
        } while (!!continuation);
        return items;
    }
    validateContinuation(continuation) {
        try {
            return toAzure(continuation) != null;
        }
        catch (e) {
            return false;
        }
    }
}
exports.AzureRepository = AzureRepository;
//# sourceMappingURL=azure.js.map