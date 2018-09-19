import { JsonController, Get } from "routing-controllers";
import { Settings } from "../common";

@JsonController("/capabilities")
export class CapabilitiesController {

    constructor(private settings: Settings) {
    }

    @Get()
    capabiliies() {
        return {
            isTransactionsRebuildingSupported: false,
            areManyInputsSupported: !this.settings.EosApi.DisableManyInputsOutputs,
            areManyOutputsSupported: !this.settings.EosApi.DisableManyInputsOutputs,
            isTestingTransfersSupported: false,
            isPublicAddressExtensionRequired: true,
            isReceiveTransactionRequired: false,
            canReturnExplorerUrl: false
        };
    }
}