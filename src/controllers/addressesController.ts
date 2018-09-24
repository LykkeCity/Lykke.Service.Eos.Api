import { JsonController, Get, Param } from "routing-controllers";
import { NotImplementedError } from "../errors/notImplementedError";
import { isEosAddress, ParamIsEosAddress, ADDRESS_SEPARATOR } from "../common";
import { EosService } from "../services/eosService";

@JsonController("/addresses")
export class AddressesController {

    constructor(private eosService: EosService) {
    }

    @Get("/:address/explorer-url")
    explorerUrl(@ParamIsEosAddress("address") address: string) {
        throw new NotImplementedError();
    }

    @Get("/:address/validity")
    async isValid(@Param("address") address: string) {
        return {
            isValid: isEosAddress(address) &&
                await this.eosService.accountExists(address.split(ADDRESS_SEPARATOR)[0])
        };
    }
}