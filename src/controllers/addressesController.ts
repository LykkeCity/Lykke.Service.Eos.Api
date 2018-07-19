import { JsonController, Get, Param } from "routing-controllers";
import { NotImplementedError } from "../errors/notImplementedError";
import { isEosAddress, ParamIsEosAddress } from "../common";
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
    isValid(@Param("address") address: string) {
        return {
            isValid: isEosAddress(address)
        };
    }
}