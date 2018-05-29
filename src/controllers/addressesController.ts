import { JsonController, Get, Param } from "routing-controllers";
import { NotImplementedError } from "../errors/notImplementedError";
import { ADDRESS_SEPARATOR } from "../common";

@JsonController("/addresses")
export class AddressesController {

    @Get("/:address/explorer-url")
    explorerUrl(@Param("address") address: string) {
        throw new NotImplementedError();
    }

    @Get("/:address/validity")
    isValid(@Param("address") address: string) {
        return {
            isValid: !!address && /^[.12345a-z]{1,12}$/.test(address.split(ADDRESS_SEPARATOR)[0])
        };
    }
}