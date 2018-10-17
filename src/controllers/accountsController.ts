import { JsonController, Post, Body } from "routing-controllers";
import { IsEosAddress } from "../common";
import { EosService } from "../services/eosService";
import { IsString, IsOptional, IsNotEmpty, IsNumber, IsIn, IsBoolean } from "class-validator";
import { BlockchainError } from "../errors/blockchainError";

class CreateRequest {
    @IsNotEmpty()
    @IsString()
    @IsEosAddress()        
    creator: string;

    @IsNotEmpty()
    @IsString()
    wif: string;
    
    @IsNotEmpty()
    @IsString()
    @IsEosAddress()        
    account: string;

    @IsOptional()
    @IsString()
    ownerPublicKey: string;

    @IsOptional()
    @IsString()
    activePublicKey: string;

    @IsOptional()
    @IsNumber()
    ram: number;

    @IsOptional()
    @IsNumber()
    net: number;

    @IsOptional()
    @IsNumber()
    cpu: number;

    @IsOptional()
    @IsBoolean()
    transafer: boolean;
}

class BandwidthRequest {

    @IsNotEmpty()
    @IsString()
    @IsIn(["delegate", "undelegate"])
    action: string;

    @IsNotEmpty()
    @IsString()
    @IsEosAddress()
    account: string;

    @IsNotEmpty()
    @IsString()
    wif: string;

    @IsNotEmpty()
    @IsNumber()
    net: number;

    @IsNotEmpty()
    @IsNumber()
    cpu: number;
}

@JsonController("/accounts")
export class AddressesController {

    constructor(private eosService: EosService) {
    }

    @Post("/create")
    async create(@Body() request: CreateRequest) {
        if (await this.eosService.accountExists(request.account)) {
            throw new BlockchainError({ status: 409, message: `Account [${request.account}] already exists` });
        }

        return await this.eosService.accountCreate(
            request.creator, 
            request.wif,
            request.account,
            request.activePublicKey,
            request.ownerPublicKey,
            request.ram,
            request.net,
            request.cpu,
            request.transafer);
    }

    @Post("/bandwidth")
    async bandwidth(@Body() request: BandwidthRequest) {
        return await this.eosService.bandwidth(request.action, request.account, request.wif, request.net, request.cpu);
    }
}