import { JsonController, Get, Param, QueryParam } from "routing-controllers";
import { ADDRESS_SEPARATOR } from "../common";
import { AddressRepository } from "../domain/addresses";

@JsonController("/balances")
export class BalancesController {

    constructor(private addressRepository: AddressRepository) {
    }

    @Get()
    async balances(@QueryParam("take") take = 100, @QueryParam("continuation") continuation?: string) {
        const items: any[] = [];

        do {
            const addressQuery = await this.addressRepository.get(take, continuation);

            for (let i = 0; i < addressQuery.items.length; i++) {
                // TODO: get balance
                items.push({
                    address: addressQuery.items[i],

                });
            }

            take -= addressQuery.items.length;
            continuation = addressQuery.continuation;
        }
        while (!!take && !!continuation);

        return {
            continuation,
            items
        };
    }
}