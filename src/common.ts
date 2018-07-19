import { getMetadataArgsStorage, Action, BadRequestError } from "routing-controllers";
import { ParamType } from "routing-controllers/metadata/types/ParamType";
import { registerDecorator } from "class-validator";
import { isString, promisify } from "util";
import axios from "axios";
import fs from "fs";

const pkg = require("../package.json");
const uuidRegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const eosAddressRegExp = /^[.12345a-z]{1,12}$/;

export const APP_NAME = pkg.name;

export const APP_VERSION = pkg.version;

export const ENV_INFO = process.env.ENV_INFO;

export const ADDRESS_SEPARATOR = "$";

export enum Encoding {
    base64 = "base64",
    utf8 = "utf8"
};

/**
 * Serializes object to JSON and then encodes result to base64
 * @param obj Object to serialize to JSON and encode to base64
 */
export function toBase64(obj: any): string {
    return Buffer.from(JSON.stringify(obj)).toString(Encoding.base64);
}

/**
 * Converts base64 string to JSON and then parses result to `T`
 * @param str String in base64 encoding
 */
export function fromBase64<T>(str: string): T {
    return JSON.parse(Buffer.from(str, Encoding.base64).toString(Encoding.utf8)) as T;
}

/**
 * Application settings.
 * Defined as `class` instead of `interface` to make DI easier (no need of Token<Service>)
 */
export class Settings {
    EosApi: {
        Azure: {
            ConnectionString: string;
        },
        Mongo: {
            ConnectionString: string;
            User: string;
            Password: string;
            Database: string;
        },
        LogAdapterUrl: string;
        LogSlackChannels: string[];
        Eos: {
            ExpireInSeconds: number;
            HttpEndpoint: string;
        }
    };
}

/**
 * Loads application settings from file or URL as specified in `SettingsUrl` environment variable.
 */
export async function loadSettings(): Promise<Settings> {
    if (process.env.SettingsUrl.startsWith("http")) {
        return (await axios.get<Settings>(process.env.SettingsUrl)).data;
    } else {
        return JSON.parse(await promisify(fs.readFile)(process.env.SettingsUrl, Encoding.utf8)) as Settings;
    }
}

export function isoUTC(iso: string): Date {
    iso = iso.endsWith("Z")
        ? iso
        : `${iso}Z`;

    return new Date(iso);
}

export function isUuid(str: string): boolean {
    return !!str && uuidRegExp.test(str);
}

export function isEosAddress(str: string): boolean {
    return !!str && eosAddressRegExp.test(str.split(ADDRESS_SEPARATOR)[0]);
}

/**
 * Class property validation decorator to check EOS address
 * @param name Paremeter name
 */
export function IsEosAddress() {
    return function(object: Object, propertyName: string) {
        registerDecorator({
            name: "IsEosAddress",
            target: object.constructor,
            propertyName: propertyName,
            validator: (val: any) => isString(val) && isEosAddress(val)
        });
    };
}

/**
 * Returns decorator function which adds action parameter metadata to routing-controllers metadata store,
 * so that parameter can be checked and validated at runtime.
 * @param options Parameter metadata
 */
export function createParamDecorator(options: { type: ParamType, name: string, required: boolean, parse: boolean, transform?: (action: Action, value?: any) => Promise<any> | any }) {
    return (object: any, method: string, index: number) => {
        getMetadataArgsStorage().params.push({
            object: object,
            method: method,
            index: index,
            ...options
        });
    };
}

/**
 * Route parameter validation decorator to check UUID
 * @param name Paremeter name
 */
export function ParamIsUuid(name: string) {
    return createParamDecorator({
        type: "param",
        name: name,
        required: true,
        parse: false,
        transform: action => {
            if (isUuid(action.context.params[name])) {
                return action.context.params[name];
            } else {
                return Promise.reject(new BadRequestError(`Route parameter [${name}] is invalid, must be UUID.`));
            }
        }
    });
}

/**
 * Route parameter validation decorator to check EOS address
 * @param name Paremeter name
 */
export function ParamIsEosAddress(name: string) {
    return createParamDecorator({
        type: "param",
        name: name,
        required: true,
        parse: false,
        transform: action => {
            if (isEosAddress(action.context.params[name])) {
                return action.context.params[name];
            } else {
                return Promise.reject(new BadRequestError(`Route parameter [${name}] is invalid, must be valid EOS address with optional extension.`));
            }
        }
    });
}

/**
 * Query parameter validation decorator to check positive integer
 * @param name Paremeter name
 */
export function QueryParamIsPositiveInteger(name: string) {
    return createParamDecorator({
        type: "query",
        name: name,
        required: true,
        parse: false,
        transform: action => {
            const value = parseInt(action.context.query[name]);
            if (!!value && value > 0) {
                return value;
            } else {
                return Promise.reject(new BadRequestError(`Query parameter [${name}] is invalid, must be positive integer.`));
            }
        }
    });
}