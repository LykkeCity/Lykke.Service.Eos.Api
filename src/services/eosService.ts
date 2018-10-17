import { Service } from "typedi";
import { promisify } from "util";
import { Settings } from "../common";

// EOSJS has no typings, so use it as regular node module
const Eos = require("eosjs");
const ecc = require("eosjs-ecc");

@Service()
export class EosService {

    private eos: any;

    constructor(private settings: Settings) {
        this.eos = Eos({ httpEndpoint: settings.EosApi.Eos.HttpEndpoint });
        ecc.initialize();
    }

    async accountExists(account: string): Promise<boolean> {
        let acc: any;
        try {
            acc = await this.eos.getAccount(account);
        } catch (e) {
        }
        return !!acc;
    }

    async getChainId(): Promise<string> {
        return (await this.eos.getInfo({})).chain_id;
    }

    async getLastIrreversibleBlockNumber(): Promise<number> {
        return (await this.eos.getInfo({})).last_irreversible_block_num;
    }

    async getTransactionHeaders() {
        return (await promisify(this.eos.createTransaction)(this.settings.EosApi.Eos.ExpireInSeconds));
    }

    async getBalance(account: string, tokenContractAccount: string, symbol: string): Promise<number> {
        const data = await this.eos.getCurrencyBalance({ code: tokenContractAccount, account, symbol });
        return (data[0] && parseFloat(data[0].split(" ")[0])) || 0;
    }

    async pushTransaction(tx: any): Promise<string> {
        return (await this.eos.pushTransaction(tx)).transaction_id;
    }

    async delegateBandwidth(account: string, wif: string, net: number, cpu: number) {
        const chainId = await this.getChainId();
        const eos = Eos({
            httpEndpoint: this.settings.EosApi.Eos.HttpEndpoint,
            keyProvider: wif,
            chainId
        });
        return await eos.delegatebw(account, account, `${net.toFixed(4)} EOS`, `${cpu.toFixed(4)} EOS`, 0, {
            expireInSeconds: this.settings.EosApi.Eos.ExpireInSeconds
        });
    }

    async accountCreate(creator: string, wif: string, account: string,
        ownerPublicKey?: string, activePublicKey?: string, ram = 4096, net?: number, cpu?: number, transfer = true) {
        
        const chainId = await this.getChainId();
        const eos = Eos({
            httpEndpoint: this.settings.EosApi.Eos.HttpEndpoint,
            keyProvider: wif,
            chainId
        });

        const ownerKeys = { publicKey: ownerPublicKey, wif: "" };
        const activeKeys = { publicKey: activePublicKey, wif: "" };

        if (!ownerPublicKey) {
            const key = await ecc.PrivateKey.randomKey();
            ownerKeys.wif = key.toWif();
            ownerKeys.publicKey = key.toPublic().toString();
        }

        if (!activePublicKey) {
            const key = await ecc.PrivateKey.randomKey();
            activeKeys.wif = key.toWif();
            activeKeys.publicKey = key.toPublic().toString();
        }

        const result = await eos.transaction((tr: any) => {
            tr.newaccount({ creator, name: account, owner: ownerKeys.publicKey, active: activeKeys.publicKey });
            tr.buyrambytes({ payer: creator, receiver: account, bytes: ram });

            if (!!net || !!cpu) {
                tr.delegatebw({
                    from: creator,
                    receiver: account,
                    stake_net_quantity: `${net.toFixed(4)} EOS`,
                    stake_cpu_quantity: `${cpu.toFixed(4)} EOS`,
                    transfer: transfer ? 1 : 0
                });
            }
        }, {
            expireInSeconds: this.settings.EosApi.Eos.ExpireInSeconds
        });

        return {
            ownerKeys,
            activeKeys,
            result
        };
    }

    async bandwidth(action: string, account: string, wif: string, net: number, cpu: number) {
        const isDelegate = action == "delegate";
        const netAssetAmount = `${net.toFixed(4)} EOS`;
        const cpuAssetAmount = `${cpu.toFixed(4)} EOS`;
        const chainId = await this.getChainId();
        const eos = Eos({
            httpEndpoint: this.settings.EosApi.Eos.HttpEndpoint,
            keyProvider: wif,
            chainId
        });
        return await eos[`${action}bw`]({
            from: account,
            receiver: account,
            stake_net_quantity: isDelegate ? netAssetAmount : undefined,
            stake_cpu_quantity: isDelegate ? cpuAssetAmount : undefined,
            unstake_net_quantity: !isDelegate ? netAssetAmount : undefined,
            unstake_cpu_quantity: !isDelegate ? cpuAssetAmount : undefined,
            transfer: isDelegate ? 0 : undefined
        }, {
            expireInSeconds: this.settings.EosApi.Eos.ExpireInSeconds
        });
    }
}