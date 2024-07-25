import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
    createPublicClient,
    http,
    parseAbiItem,
    PublicClient,
    WalletClient,
    createWalletClient,
    Chain,
    HDAccount
} from 'viem';
import {computeProxyChain} from "./compute-proxy.chain";
import {mnemonicToAccount} from "viem/accounts";
import {computeProxyAbi} from "./compute-proxy.abi";

@Injectable()
export class ComputeProxyService {
    private readonly logger = new Logger(ComputeProxyService.name);
    private client;
    private walletClient;
    private contractAddress: `0x${string}`;
    private account: HDAccount;
    private abi = [
        // Add the relevant ABI items for the ComputeProxy contract
        parseAbiItem('function executeRequest((bytes32 id, address requester, (uint8 opcode, uint256[] operands, uint64 value)[] ops, uint256 opsCursor, address callbackAddr, bytes4 callbackFunc, bytes extraData) r) public returns ((uint256 data, uint8 valueType)[])')
    ];

    constructor(private readonly configService: ConfigService) {

        // this.client = createPublicClient({
        //     chain: computeProxyChain,
        //     transport: http(this.configService.get<string>('COMPUTE_PROXY_CHAIN_RPC_URL')),
        // });
        //
        // const mnemonic = this.configService.get<string>('COMPUTE_PROXY_CHAIN_MNEMONIC');
        // this.account = mnemonicToAccount(mnemonic);
        //
        // this.walletClient = createWalletClient({
        //     chain: computeProxyChain,
        //     transport: http(this.configService.get<string>('COMPUTE_PROXY_CHAIN_RPC_URL')),
        // });
        //
        // this.contractAddress = this.configService.get<string>('COMPUTE_PROXY_CONTRACT_ADDRESS') as `0x${string}`;
    }

    async executeRequest(request: any): Promise<any> {
        // try {
        //     const transactionHash = await this.walletClient.writeContract({
        //         address: this.contractAddress,
        //         abi: this.abi,
        //         functionName: 'executeRequest',
        //         args: [request],
        //         account: this.account
        //     });
        //
        //     this.logger.log(`Transaction sent: ${transactionHash}`);
        //     const receipt = await this.client.waitForTransactionReceipt({ hash: transactionHash });
        //     this.logger.log(`Transaction mined: ${transactionHash}`);
        //     return receipt;
        // } catch (error) {
        //     this.logger.error(`Error executing request: ${error.message}`);
        //     throw error;
        // }
    }
}
