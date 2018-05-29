"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typedi_1 = require("typedi");
const routing_controllers_1 = require("routing-controllers");
const common_1 = require("./common");
// DI initialization for routing-controllers must go first, before any aother action 
routing_controllers_1.useContainer(typedi_1.Container);
common_1.loadSettings()
    .then(settings => {
    typedi_1.Container.set(common_1.Settings, settings);
    const koa = routing_controllers_1.createKoaServer({
        classTransformer: true,
        controllers: [`${__dirname}/controllers/*js`],
        middlewares: [`${__dirname}/middlewares/*js`],
        routePrefix: "/api"
    });
    koa.listen(5000);
})
    .then(_ => console.log("Started"), e => console.log(e));
//# sourceMappingURL=server.js.map