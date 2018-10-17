import { Middleware, KoaMiddlewareInterface, } from "routing-controllers";
import { Context } from "koa";
import { ErrorCode } from "../domain/operations";

@Middleware({ type: 'before' })
export class ErrorMiddleware implements KoaMiddlewareInterface {

    async use(ctx: Context, next: (err?: any) => Promise<any>): Promise<any> {

        // We don't need to wrap this into try..catch because
        // routing-controllers lib has built-in error handler.
        // See https://github.com/typestack/routing-controllers#error-handlers for details
        await next();
        
        const body = ctx.body || {};

        // format error data according to BIL contract,
        // and preserve original error
        if (ctx.status >= 400) {
            ctx.body = {
                errorMessage: typeof body == "object" ? (body.errorMessage || body.message || ctx.message) : "Unknown error",
                errorCode: body.errorCode || ErrorCode.unknown,
                errorData: body
            };
        }

        // map routing-controllers "errors" property to
        // BIL contract "modelErrors" property
        if (ctx.status == 400 && !!body.errors) {
            ctx.body.modelErrors = {};
            body.errors.filter((e: any) => !!e.property && !!e.constraints)
                .forEach((e: any) => {
                    ctx.body.modelErrors[e.property] = [];
                    for (const k in e.constraints) {
                        ctx.body.modelErrors[e.property].push(e.constraints[k]);
                    }
                });
        }
    }
}