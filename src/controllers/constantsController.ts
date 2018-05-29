import { JsonController, Get } from "routing-controllers";

@JsonController("/constants")
export class ConstantsController {

    @Get()
    constants() {
        return {
            publicAddressExtension: {
                separator: "/",
                displayName: "Memo",
                baseDisplayName: "Account"
            }
        };
    }
}