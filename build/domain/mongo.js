"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_1 = require("mongodb");
class MongoEntity {
}
exports.MongoEntity = MongoEntity;
class MongoRepository {
    constructor(connectionString, user, password, database) {
        this.connectionString = connectionString;
        this.user = user;
        this.password = password;
        this.database = database;
    }
    async db() {
        if (this._db == null) {
            this._db = (await mongodb_1.MongoClient.connect(this.connectionString, { auth: { user: this.user, password: this.password }, useNewUrlParser: true }))
                .db(this.database);
        }
        return this._db;
    }
    validateContinuation(continuation) {
        return !continuation || !Number.isNaN(parseInt(continuation));
    }
}
exports.MongoRepository = MongoRepository;
class MongoQueryResult {
    constructor(items, continuation) {
        this.items = items;
        this.continuation = continuation;
    }
}
exports.MongoQueryResult = MongoQueryResult;
//# sourceMappingURL=mongo.js.map