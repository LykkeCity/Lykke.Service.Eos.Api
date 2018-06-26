import { JsonController, Get, Param } from "routing-controllers";
import { NotImplementedError } from "../errors/notImplementedError";
import { ADDRESS_SEPARATOR } from "../common";
import { EosService } from "../services/eosService";

@JsonController("/addresses")
export class AddressesController {

    constructor(private eosService: EosService) {
    }

    @Get("/:address/explorer-url")
    explorerUrl(@Param("address") address: string) {
        throw new NotImplementedError();
    }

    @Get("/:address/validity")
    isValid(@Param("address") address: string) {
        return {
            isValid: this.eosService.validate(address)
        };
    }
}